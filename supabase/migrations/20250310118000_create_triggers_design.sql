-- 1) Trigger function: creates a designs row when a briefs row is inserted
CREATE OR REPLACE FUNCTION public.create_design_from_brief()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.designs(id, user_id, name, data)
  VALUES (
    gen_random_uuid(),                      -- new UUID for designs.id
    NEW.user_id,                            -- copy user_id from briefs
    NEW.projectname,                        -- copy project name
    NULL::jsonb                             -- empty data
  );
  RETURN NEW;
END;
$$;

-- 2) Trigger: fires after insert on briefs
DROP TRIGGER IF EXISTS create_design_after_brief_insert ON public.briefs;
CREATE TRIGGER create_design_after_brief_insert
AFTER INSERT ON public.briefs
FOR EACH ROW
EXECUTE FUNCTION public.create_design_from_brief();
------------------------------------------------

-- 1) Helper: normalize element type mapping
CREATE OR REPLACE FUNCTION public._map_element_type(in_type text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(coalesce(in_type, ''))
    WHEN 'text' THEN 'text'
    WHEN 'headline' THEN 'text'
    WHEN 'cta' THEN 'shape'
    WHEN 'graphics' THEN 'image'
    WHEN 'image' THEN 'image'
    WHEN 'icon' THEN 'icon'
    ELSE 'shape' -- default fallback
  END;
$$;

-- 2) Main transformer: spec JSONB -> DesignData JSONB
CREATE OR REPLACE FUNCTION public.spec_to_designdata(
  spec jsonb,
  p_user_id uuid,
  p_name text,
  p_created_at timestamptz DEFAULT now(),
  p_updated_at timestamptz DEFAULT now()
) RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  elems jsonb;
  el jsonb;
  el_rec record;
  out_elements jsonb := '[]'::jsonb;
  metadata jsonb;
  width_num numeric := 1000; -- default canvas size if not provided
  height_num numeric := 1000;
  now_ts timestamptz := coalesce(p_created_at, now());
BEGIN
  -- Validate incoming spec
  IF spec IS NULL OR jsonb_typeof(spec) <> 'object' THEN
    RAISE EXCEPTION 'spec must be a non-null json object';
  END IF;

  IF NOT (spec ? 'elements') THEN
    RAISE EXCEPTION 'spec must contain "elements" array';
  END IF;

  elems := spec->'elements';
  IF elems IS NULL OR jsonb_typeof(elems) <> 'array' OR jsonb_array_length(elems) = 0 THEN
    RAISE EXCEPTION 'spec.elements must be a non-empty array';
  END IF;

  -- Attempt to read background width/height if present (optional)
  IF spec ? 'background' THEN
    IF (spec->'background') ? 'width' THEN
      width_num := (spec->'background'->>'width')::numeric;
    ELSIF (spec->'background') ? 'specification' THEN
      -- no numeric size, keep defaults
      NULL;
    END IF;
    IF (spec->'background') ? 'height' THEN
      height_num := (spec->'background'->>'height')::numeric;
    END IF;
  END IF;

  -- Iterate elements and map fields
  FOR el_rec IN
    SELECT value AS el
    FROM jsonb_array_elements(elems) AS arr(value)
  LOOP
    el := el_rec.el;

    -- Build a mapped element JSON object following Element interface
    out_elements := out_elements || jsonb_build_array(
      jsonb_build_object(
        'id', coalesce(el ->> 'id', gen_random_uuid()::text),
        'type', public._map_element_type(el ->> 'type'),
        'x', COALESCE((el->'position'->>'x')::numeric, (el->>'x')::numeric, 0)::double precision,
        'y', COALESCE((el->'position'->>'y')::numeric, (el->>'y')::numeric, 0)::double precision,
        'width', COALESCE((el->'dimensions'->>'width')::numeric, (el->>'width')::numeric, 100)::double precision,
        'height', COALESCE((el->'dimensions'->>'height')::numeric, (el->>'height')::numeric, 20)::double precision,
        'rotation', 0,
        'content', el ->> 'regenerationPrompt',
        'fontSize', CASE
          WHEN (el->>'regenerationPrompt') IS NOT NULL THEN
            -- try to extract a point size like "40pt" from regenerationPrompt, else default
            greatest(12, COALESCE((regexp_match(el->>'regenerationPrompt', '([0-9]{1,3})pt'))[1]::int, 20))
          ELSE 20 END,
        'fontFamily', COALESCE(NULLIF(el->>'styleAnchors', ''), 'System'),
        'color', COALESCE(
            (regexp_match(coalesce(el->>'regenerationPrompt',''), '#[0-9A-Fa-f]{6}'))[1],
            '#000000'
          ),
        'backgroundColor', 'transparent',
        'opacity', 1.0,
        'shapeType', NULL,
        'layerDepth', COALESCE((el->>'layerDepth')::int, 0),
        'locked', false,
        'isBold', (el->>'styleAnchors') ILIKE '%bold%',
        'isItalic', (el->>'styleAnchors') ILIKE '%italic%',
        'iconName', NULL
      )
    );
  END LOOP;

  -- Build metadata
  metadata := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'name', coalesce(p_name, 'Imported design'),
    'width', width_num::int,
    'height', height_num::int,
    'createdAt', to_char(now_ts, 'YYYY-MM-DD"T"HH24:MI:SSOF'),
    'updatedAt', to_char(coalesce(p_updated_at, now()), 'YYYY-MM-DD"T"HH24:MI:SSOF'),
    'previewUrl', NULL,
    'fullUrl', NULL,
    'aspectRatio', CASE WHEN height_num = 0 THEN NULL ELSE (width_num/height_num)::double precision END
  );

  RETURN jsonb_build_object(
    'id', gen_random_uuid()::text,
    'user_id', COALESCE(p_user_id::text, NULL),
    'name', coalesce(p_name, 'Imported design'),
    'data', jsonb_build_object(
      'metadata', metadata,
      'elements', (SELECT jsonb_agg(elem) FROM jsonb_array_elements(out_elements) AS t(elem))
    ),
    'created_at', to_char(now_ts, 'YYYY-MM-DD"T"HH24:MI:SSOF'),
    'updated_at', to_char(coalesce(p_updated_at, now()), 'YYYY-MM-DD"T"HH24:MI:SSOF')
  );
END;
$$;


-- 3) Trigger function: after insert or update on element_specifications
CREATE OR REPLACE FUNCTION public.element_specifications_after_insert_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  spec jsonb;
  design jsonb;
  target_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    spec := NEW.specification_data;
  ELSE
    -- UPDATE: use NEW.specification_data if present; if null, do nothing
    spec := NEW.specification_data;
  END IF;

  -- Require non-empty JSON
  IF spec IS NULL OR jsonb_typeof(spec) <> 'object' OR NOT (spec ? 'elements') OR jsonb_array_length(spec->'elements') = 0 THEN
    RETURN NEW; -- do nothing if spec invalid or empty
  END IF;

  -- Generate design JSON
  design := public.spec_to_designdata(spec, NEW.user_id, COALESCE((spec->>'name'), ('imported-'||NEW.id::text)), NEW.created_at, NEW.updated_at);

  -- Upsert into public.designs: if a design already exists linked to this element_specification.id (by name or other), we insert a new design.
  -- Here we'll insert a new row into public.designs using NEW.id as id to preserve link if preferred.
  -- Use a new uuid for design id to avoid collisions.
  INSERT INTO public.designs (id, user_id, name, data, created_at, updated_at)
  VALUES (gen_random_uuid(), NEW.user_id, (design->>'name')::text, design->'data', now(), now());

  RETURN NEW;
END;
$$;

-- 4) Attach trigger to table
DROP TRIGGER IF EXISTS trg_element_specs_after_upsert ON public.element_specifications;
CREATE TRIGGER trg_element_specs_after_upsert
AFTER INSERT OR UPDATE ON public.element_specifications
FOR EACH ROW
EXECUTE FUNCTION public.element_specifications_after_insert_update();

------------------------------------------------
-- 1) Helper: normalize element type mapping
CREATE OR REPLACE FUNCTION public._map_element_type(in_type text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(coalesce(in_type, ''))
    WHEN 'text' THEN 'text'
    WHEN 'headline' THEN 'text'
    WHEN 'cta' THEN 'shape'
    WHEN 'graphics' THEN 'image'
    WHEN 'image' THEN 'image'
    WHEN 'icon' THEN 'icon'
    ELSE 'shape' -- default fallback
  END;
$$;

-- 2) Main transformer: spec JSONB -> DesignData JSONB
CREATE OR REPLACE FUNCTION public.spec_to_designdata(
  spec jsonb,
  p_user_id uuid,
  p_name text,
  p_created_at timestamptz DEFAULT now(),
  p_updated_at timestamptz DEFAULT now()
) RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  elems jsonb;
  el jsonb;
  el_rec record;
  out_elements jsonb := '[]'::jsonb;
  metadata jsonb;
  width_num numeric := 1000; -- default canvas size if not provided
  height_num numeric := 1000;
  now_ts timestamptz := coalesce(p_created_at, now());
BEGIN
  -- Validate incoming spec
  IF spec IS NULL OR jsonb_typeof(spec) <> 'object' THEN
    RAISE EXCEPTION 'spec must be a non-null json object';
  END IF;

  IF NOT (spec ? 'elements') THEN
    RAISE EXCEPTION 'spec must contain "elements" array';
  END IF;

  elems := spec->'elements';
  IF elems IS NULL OR jsonb_typeof(elems) <> 'array' OR jsonb_array_length(elems) = 0 THEN
    RAISE EXCEPTION 'spec.elements must be a non-empty array';
  END IF;

  -- Attempt to read background width/height if present (optional)
  IF spec ? 'background' THEN
    IF (spec->'background') ? 'width' THEN
      width_num := (spec->'background'->>'width')::numeric;
    ELSIF (spec->'background') ? 'specification' THEN
      -- no numeric size, keep defaults
      NULL;
    END IF;
    IF (spec->'background') ? 'height' THEN
      height_num := (spec->'background'->>'height')::numeric;
    END IF;
  END IF;

  -- Iterate elements and map fields
  FOR el_rec IN
    SELECT value AS el
    FROM jsonb_array_elements(elems) AS arr(value)
  LOOP
    el := el_rec.el;

    -- Build a mapped element JSON object following Element interface
    out_elements := out_elements || jsonb_build_array(
      jsonb_build_object(
        'id', coalesce(el ->> 'id', gen_random_uuid()::text),
        'type', public._map_element_type(el ->> 'type'),
        'x', COALESCE((el->'position'->>'x')::numeric, (el->>'x')::numeric, 0)::double precision,
        'y', COALESCE((el->'position'->>'y')::numeric, (el->>'y')::numeric, 0)::double precision,
        'width', COALESCE((el->'dimensions'->>'width')::numeric, (el->>'width')::numeric, 100)::double precision,
        'height', COALESCE((el->'dimensions'->>'height')::numeric, (el->>'height')::numeric, 20)::double precision,
        'rotation', 0,
        'content', el ->> 'regenerationPrompt',
        'fontSize', CASE
          WHEN (el->>'regenerationPrompt') IS NOT NULL THEN
            -- try to extract a point size like "40pt" from regenerationPrompt, else default
            greatest(12, COALESCE((regexp_match(el->>'regenerationPrompt', '([0-9]{1,3})pt'))[1]::int, 20))
          ELSE 20 END,
        'fontFamily', COALESCE(NULLIF(el->>'styleAnchors', ''), 'System'),
        'color', COALESCE(
            (regexp_match(coalesce(el->>'regenerationPrompt',''), '#[0-9A-Fa-f]{6}'))[1],
            '#000000'
          ),
        'backgroundColor', 'transparent',
        'opacity', 1.0,
        'shapeType', NULL,
        'layerDepth', COALESCE((el->>'layerDepth')::int, 0),
        'locked', false,
        'isBold', (el->>'styleAnchors') ILIKE '%bold%',
        'isItalic', (el->>'styleAnchors') ILIKE '%italic%',
        'iconName', NULL
      )
    );
  END LOOP;

  -- Build metadata
  metadata := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'name', coalesce(p_name, 'Imported design'),
    'width', width_num::int,
    'height', height_num::int,
    'createdAt', to_char(now_ts, 'YYYY-MM-DD"T"HH24:MI:SSOF'),
    'updatedAt', to_char(coalesce(p_updated_at, now()), 'YYYY-MM-DD"T"HH24:MI:SSOF'),
    'previewUrl', NULL,
    'fullUrl', NULL,
    'aspectRatio', CASE WHEN height_num = 0 THEN NULL ELSE (width_num/height_num)::double precision END
  );

  RETURN jsonb_build_object(
    'id', gen_random_uuid()::text,
    'user_id', COALESCE(p_user_id::text, NULL),
    'name', coalesce(p_name, 'Imported design'),
    'data', jsonb_build_object(
      'metadata', metadata,
      'elements', (SELECT jsonb_agg(elem) FROM jsonb_array_elements(out_elements) AS t(elem))
    ),
    'created_at', to_char(now_ts, 'YYYY-MM-DD"T"HH24:MI:SSOF'),
    'updated_at', to_char(coalesce(p_updated_at, now()), 'YYYY-MM-DD"T"HH24:MI:SSOF')
  );
END;
$$;


-- 3) Trigger function: after insert or update on element_specifications
CREATE OR REPLACE FUNCTION public.element_specifications_after_insert_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  spec jsonb;
  design jsonb;
  target_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    spec := NEW.specification_data;
  ELSE
    -- UPDATE: use NEW.specification_data if present; if null, do nothing
    spec := NEW.specification_data;
  END IF;

  -- Require non-empty JSON
  IF spec IS NULL OR jsonb_typeof(spec) <> 'object' OR NOT (spec ? 'elements') OR jsonb_array_length(spec->'elements') = 0 THEN
    RETURN NEW; -- do nothing if spec invalid or empty
  END IF;

  -- Generate design JSON
  design := public.spec_to_designdata(spec, NEW.user_id, COALESCE((spec->>'name'), ('imported-'||NEW.id::text)), NEW.created_at, NEW.updated_at);

  -- Upsert into public.designs: if a design already exists linked to this element_specification.id (by name or other), we insert a new design.
  -- Here we'll insert a new row into public.designs using NEW.id as id to preserve link if preferred.
  -- Use a new uuid for design id to avoid collisions.
  INSERT INTO public.designs (id, user_id, name, data, created_at, updated_at)
  VALUES (gen_random_uuid(), NEW.user_id, (design->>'name')::text, design->'data', now(), now());

  RETURN NEW;
END;
$$;

-- 4) Attach trigger to table
DROP TRIGGER IF EXISTS trg_element_specs_after_upsert ON public.element_specifications;
CREATE TRIGGER trg_element_specs_after_upsert
AFTER INSERT OR UPDATE ON public.element_specifications
FOR EACH ROW
EXECUTE FUNCTION public.element_specifications_after_insert_update();