-- Create report_files table for storing attachments (images, PDFs)
CREATE TABLE IF NOT EXISTS report_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  construction_id UUID REFERENCES constructions(id) ON DELETE CASCADE,
  report_id UUID REFERENCES report_forms(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  description TEXT,
  file_type TEXT, -- 'image' or 'pdf'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE report_files ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Enable all for authenticated users" ON report_files
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create storage bucket for report files (if not exists)
-- This needs to be run in Supabase dashboard or via client
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('report-files', 'report-files', true)
-- ON CONFLICT DO NOTHING;
