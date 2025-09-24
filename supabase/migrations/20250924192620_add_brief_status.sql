-- Add a status column to the briefs table to track image generation progress.
ALTER TABLE briefs
ADD COLUMN image_generation_status TEXT DEFAULT 'pending';
