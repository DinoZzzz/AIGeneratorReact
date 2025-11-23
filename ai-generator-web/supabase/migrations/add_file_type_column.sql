-- Add file_type column to report_files table
ALTER TABLE report_files
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- Update existing records to set file_type based on file_name extension
UPDATE report_files
SET file_type = CASE
  WHEN file_name ILIKE '%.pdf' THEN 'pdf'
  WHEN file_name ILIKE '%.jpg' OR file_name ILIKE '%.jpeg' OR file_name ILIKE '%.png' THEN 'image'
  ELSE 'unknown'
END
WHERE file_type IS NULL;
