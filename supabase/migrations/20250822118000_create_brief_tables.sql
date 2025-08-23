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
    performanceMetrics text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
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

ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own briefs
CREATE POLICY "Users can view their own briefs" ON briefs
  FOR SELECT
  USING (user_id = auth.uid());

-- Create policy to allow users to update their own briefs
CREATE POLICY "Users can update their own briefs" ON briefs
  FOR UPDATE
  USING (user_id = auth.uid());

-- Create policy to allow users to delete their own briefs
CREATE POLICY "Users can delete their own briefs" ON briefs
  FOR DELETE
  USING (user_id = auth.uid());

