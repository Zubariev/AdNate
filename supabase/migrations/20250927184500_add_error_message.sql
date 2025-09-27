-- Add error_message column to briefs table to store processing errors
ALTER TABLE briefs
ADD COLUMN error_message TEXT;

-- Update the table definition in the shared schema
COMMENT ON COLUMN briefs.error_message IS 'Stores error messages that occur during image generation or brief processing';
