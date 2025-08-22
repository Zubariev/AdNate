CREATE TABLE briefs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    projectName text,
    targetAudience text,
    keyMessage text,
    brandGuidelines text,
    bannerSizes text,
    brandContext text,
    objective text,
    consumerJourney text,
    emotionalConnection text,
    visualStyle text,
    performanceMetrics text
);

CREATE TABLE concepts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id uuid NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    elements jsonb NOT NULL DEFAULT '{}'::jsonb,
    midjourney_prompts jsonb NOT NULL DEFAULT '{}'::jsonb,
    rationale jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE FUNCTION insert_brief(post_id uuid, brief jsonb)
RETURNS void
AS $$
BEGIN
    INSERT INTO briefs (id, user_id, projectName, targetAudience, keyMessage, brandGuidelines, bannerSizes, brandContext, objective, consumerJourney, emotionalConnection, visualStyle, performanceMetrics)
    VALUES (post_id, auth.uid(), brief->>'projectName', brief->>'targetAudience', brief->>'keyMessage', brief->>'brandGuidelines', brief->>'bannerSizes', brief->>'brandContext', brief->>'objective', brief->>'consumerJourney', brief->>'emotionalConnection', brief->>'visualStyle', brief->>'performanceMetrics');
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION insert_concept(post_id uuid, concept jsonb)
RETURNS void
AS $$
BEGIN
    INSERT INTO concepts (id, brief_id, title, description, elements, midjourney_prompts, rationale)
    VALUES (post_id, brief_id, concept->>'title', concept->>'description', concept->>'elements', concept->>'midjourney_prompts', concept->>'rationale');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own concepts
CREATE POLICY "Users can view their own concepts" ON concepts
  FOR SELECT
  USING (user_id = auth.uid());

-- Create policy to allow users to insert their own concepts
CREATE POLICY "Users can insert their own concepts" ON concepts
  FOR INSERT
  USING (user_id = auth.uid());

-- Create policy to allow users to update their own concepts
CREATE POLICY "Users can update their own concepts" ON concepts
  FOR UPDATE
  USING (user_id = auth.uid());

-- Create policy to allow users to delete their own concepts
CREATE POLICY "Users can delete their own concepts" ON concepts
  FOR DELETE
  USING (user_id = auth.uid());

ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own briefs
CREATE POLICY "Users can view their own briefs" ON briefs
  FOR SELECT
  USING (user_id = auth.uid());

-- Create policy to allow users to insert their own briefs
CREATE POLICY "Users can insert their own briefs" ON briefs
  FOR INSERT
  USING (user_id = auth.uid());

-- Create policy to allow users to update their own briefs
CREATE POLICY "Users can update their own briefs" ON briefs
  FOR UPDATE
  USING (user_id = auth.uid());

-- Create policy to allow users to delete their own briefs
CREATE POLICY "Users can delete their own briefs" ON briefs
  FOR DELETE
  USING (user_id = auth.uid());

