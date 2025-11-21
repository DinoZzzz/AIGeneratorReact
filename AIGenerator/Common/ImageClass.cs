using Common;
using Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace AIGenerator.Common
{
    public class ImageClass
    {
        private static readonly string folderPath = Path.Combine(Path.GetTempPath(), "AIGenerator");

        public void ResizeImage(string imagePath)
        {
            //using (Image image = Image.Load(imagePath))
            //{
            //    int maxWidth = 600, maxHeight = 850;
            //    int width = image.Width, height = image.Height;
            //    double ratio = 1.0 * width / height;
            //    if (width > maxWidth)
            //    {
            //        width = maxWidth;
            //        height = Convert.ToInt32(Math.Round(width / ratio, 0));
            //    }
            //    if (height > maxHeight)
            //    {
            //        height = maxHeight;
            //        width = Convert.ToInt32(Math.Round(height * ratio, 0));
            //    }
            //    image.Mutate(x => x.Resize(width, height));
            //}
        }

        private static System.Drawing.Bitmap GetInternetImage(string url)
        {
            try
            {
                using (WebClient webClient = new WebClient())
                {
                    using (Stream stream = webClient.OpenRead(url))
                    {
                        System.Drawing.Bitmap bitmap = new System.Drawing.Bitmap(stream);
                        return bitmap;
                    }
                }
            }
            catch { return new System.Drawing.Bitmap(16, 16); }
        }


        public static System.Drawing.Bitmap GetThumbnail(ReportFile reportFile)
        {
            string filePath = Path.Combine(folderPath, "thumb_" + reportFile.Name);
            if (!File.Exists(filePath))
            {
                System.Drawing.Bitmap bitmap = GetInternetImage(AppData.SERVER_URL + reportFile.Thumbnail);
                bitmap.Save(filePath);
                return bitmap;
            }
            return new System.Drawing.Bitmap(filePath);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="reportFile"></param>
        /// <returns>The path of the image</returns>
        public static string GetImagePath(ReportFile reportFile)
        {
            string filePath = Path.Combine(folderPath, reportFile.Name);
            if (!File.Exists(filePath))
            {
                System.Drawing.Bitmap bitmap = GetInternetImage(AppData.SERVER_URL + reportFile.Path);
                bitmap.Save(filePath);
            }
            return filePath;
        }

        public static System.Drawing.Bitmap GetImage(ReportFile reportFile)
        {
            return new System.Drawing.Bitmap(GetImagePath(reportFile));
        }
    }
}
