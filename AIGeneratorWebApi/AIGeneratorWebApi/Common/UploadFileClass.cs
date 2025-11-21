using Models;

namespace AIGeneratorWebApi.Common
{
    public class UploadFileClass
    {
        public static List<ReportFile> Upload(List<ReportFile> files, string reportId, string contentRootPath)
        {
            List<ReportFile> remove = new List<ReportFile>();
            DateTime now = DateTime.UtcNow;
            string filesFolderPath = Path.Combine(contentRootPath, "Files");
            int i = 1;
            foreach (ReportFile file in files.OrderBy(x => x.Ordinal))
            {
                file.ReportExportId = reportId;
                file.UpdateTime = now;
                file.Ordinal = i;
                i++;
                if (string.IsNullOrEmpty(file.Bytes)) continue;
                List<byte> bytes = file.Bytes.Replace("]", "").Replace("[", "").Split(',').Select(byte.Parse).ToList();
                file.Bytes = "";
                file.IsImage = CheckClass.IsImage(Path.GetExtension(file.Name));
                bool isVideo = CheckClass.IsVideo(Path.GetExtension(file.Name));
                string name = Path.GetFileNameWithoutExtension(file.Name) + Guid.NewGuid().ToString();
                string fileName = name + (file.IsImage ? ".png" : Path.GetExtension(file.Name));
                string imagePath = "", thumbnailPath = "";
                if (file.IsImage)
                {
                    fileName = name + (file.IsImage ? ".png" : Path.GetExtension(file.Name));
                    file.Extension = ".png";
                    imagePath = Path.Combine(filesFolderPath, fileName);
                    thumbnailPath = Path.Combine(filesFolderPath, "thumb_" + fileName);
                    if (file.IsImage)
                    {
                        if (!ImageClass.Resize(bytes.ToArray(), imagePath, thumbnailPath)) continue;
                    }
                }
                else if(Path.GetExtension(file.Name).ToLower() == ".pdf")
                {
                    string pdfPath = Path.Combine(filesFolderPath, fileName);
                    List<ReportFile> list = new List<ReportFile>();
                    using (Stream fileStream = new FileStream(pdfPath, FileMode.Create, FileAccess.Write))
                    {
                        fileStream.Write(bytes.ToArray(), 0, bytes.Count);
                        list = PdfClass.ConvertToImages(pdfPath, file.Id, fileName, filesFolderPath);
                    }
                    if (File.Exists(pdfPath)) File.Delete(pdfPath);
                    if (list.Count == 0)
                    {
                        remove.Add(file);
                        continue;
                    }
                    file.Name = list[0].Name;
                    file.Extension = ".pdf";
                    file.Path = list[0].Path;
                    file.Thumbnail = list[0].Thumbnail;
                    file.CreationTime = now;
                    files.AddRange(list);
                }
                else
                {
                    using Stream fileStream = new FileStream(Path.Combine(filesFolderPath, fileName), FileMode.Create, FileAccess.Write); 
                    fileStream.Write(bytes.ToArray(), 0, bytes.Count);
                }
                if (file.IsImage)
                {
                    file.Name = fileName;
                    file.Path = "Files/" + fileName;
                    file.Thumbnail = string.IsNullOrEmpty(thumbnailPath) ? "" : "Files/thumb_" + fileName;
                    file.CreationTime = now;
                }
            }
            foreach(ReportFile file in remove)
            {
                if (files.Any(x => x.Id == file.Id))
                {
                    files.Remove(files.Single(x => x.Id == file.Id));
                }
            }
            return files;
        }
    }
}
