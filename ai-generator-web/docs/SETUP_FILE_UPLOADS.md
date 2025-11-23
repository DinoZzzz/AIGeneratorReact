# Setup Guide: File Uploads for Reports

This guide explains how to set up the file upload functionality for attaching images and PDFs to Word reports.

**Note:** The file uploader appears in the Export Dialog when you click "Generiraj izvještaj" (Generate Report).

## 1. Update Database Table (Add file_type column)

If your `report_files` table already exists, run this SQL in your Supabase SQL Editor to add the `file_type` column:

```sql
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
```

## 2. Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Name: `report-files`
4. Public bucket: ✅ **YES** (enable public access)
5. Click "Create bucket"

### Configure Bucket Policies

After creating the bucket, set up access policies:

1. Click on the `report-files` bucket
2. Go to "Policies" tab
3. Add these policies:

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'report-files');
```

**Policy 2: Allow authenticated users to delete their files**
```sql
CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'report-files');
```

**Policy 3: Allow public read access**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'report-files');
```

## 3. Update Word Template

Open your `method1610.docx` template and add this section where you want images to appear (typically at the end before "KRAJ IZVJEŠTAJA"):

```
7. PRILOZI

{contentTable}

{#attachments}
{%image}
Slika: {name}

{/attachments}
```

**Important:**
- `{contentTable}` will show a text list of all attachments (7.1. Description, 7.2. Description, etc.)
- `{#attachments}...{/attachments}` is a loop that repeats for each image
- `{%image}` is the special tag that inserts the actual image
- `{name}` shows the file name

## 4. How to Use

### Upload Files & Generate Report
1. Navigate to a construction's reports page
2. Click **"Generiraj izvještaj"** (Generate Report) button
3. The Export Dialog will open
4. Scroll down to the **"Prilozi"** section at the bottom
5. Drag & drop files or click to select
6. Optionally add a description for each file
7. Supported formats: **JPG, PNG, PDF**
8. Fill in other export details (construction part, drainage, remarks, etc.)
9. Click **"Export Report"**
10. The Word document will include all uploaded images at the end

**Note:** Images are automatically preserved in their original format (JPG stays JPG, PNG stays PNG)

## 5. File Structure

**Database:** `report_files` table
- Links files to constructions via `construction_id`
- Stores file metadata (name, description, type)

**Storage:** `report-files` bucket
- Files organized by construction: `{construction_id}/{timestamp}-{random}.{ext}`
- Public URLs for easy access

## 6. Troubleshooting

### Error: "Could not find table report_files"
- Run the SQL from step 1 in Supabase SQL Editor

### Error: "Bucket not found"
- Create the `report-files` bucket in Supabase Storage (step 2)

### Images not appearing in Word document
- Verify the template has `{#attachments}{%image}{/attachments}` tags
- Check browser console for upload errors
- Ensure files are actually uploaded (check Supabase Storage)

### Upload fails
- Check storage bucket policies are set correctly
- Verify bucket is public
- Check browser console for detailed error messages
