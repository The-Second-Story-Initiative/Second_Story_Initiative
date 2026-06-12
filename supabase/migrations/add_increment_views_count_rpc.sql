-- Atomic view count increment to avoid race conditions
CREATE OR REPLACE FUNCTION increment_views_count(project_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;
