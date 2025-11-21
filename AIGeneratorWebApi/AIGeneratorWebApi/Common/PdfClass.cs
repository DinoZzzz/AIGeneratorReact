using Ghostscript.NET;
using Ghostscript.NET.Rasterizer;
using Models;
using System.Drawing.Imaging;

namespace AIGeneratorWebApi.Common
{
    public class PdfClass
    {
        public static List<ReportFile> ConvertToImages(string pdfPath, string pdfId, string fileName, string folderPath)
        {
            DateTime now = DateTime.Now;
            List<ReportFile> reportFiles = new List<ReportFile>();
            int desired_dpi = 96;

            GhostscriptVersionInfo gvi = new GhostscriptVersionInfo(@"C:\Program Files\gs\gs10.00.0\bin\gsdll64.dll");

            using (var rasterizer = new GhostscriptRasterizer())
            {
                rasterizer.Open(pdfPath, gvi, false);

                for (var pageNumber = 1; pageNumber <= rasterizer.PageCount; pageNumber++)
                {
                    string imageName = Path.GetFileNameWithoutExtension(fileName) + "_" + pageNumber + ".png";
                    string imagePath = Path.Combine(folderPath, imageName);
                    string thumbnailPath = Path.Combine(folderPath, "thumb_" + imageName);

                    var img = rasterizer.GetPage(desired_dpi, pageNumber);
                    if (img == null) continue;
                    using (var imageStream = new MemoryStream())
                    {
                        img.Save(imageStream, ImageFormat.Png);
                        if (!ImageClass.Resize(imageStream.ToArray(), imagePath, thumbnailPath)) continue;
                    }
                    reportFiles.Add(new ReportFile
                    {
                        PdfId = pdfId,
                        CreationTime = now,
                        UpdateTime = now,
                        IsImage = true,
                        Name = imageName,
                        Path = "Files/" + imageName,
                        Thumbnail = string.IsNullOrEmpty(thumbnailPath) ? "" : "Files/thumb_" + imageName,
                        Ordinal = pageNumber
                    });
                }
            }
            return reportFiles;
        }
    }
}
