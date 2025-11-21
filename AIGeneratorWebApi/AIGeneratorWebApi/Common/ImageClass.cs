using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace AIGeneratorWebApi.Common
{
    public class ImageClass
    {
        public static bool Resize(byte[] bytes, string imagePath, string thumbnailPath)
        {
            try
            {
                using Image image = Image.Load(bytes);
                int maxWidth = 700, maxHeight = 850;
                int width = image.Width;
                int height = image.Height;
                double ratio = 1.0 * width / height;
                if (width > maxWidth)
                {
                    width = maxWidth;
                    height = Convert.ToInt32(Math.Round(width / ratio, 0));
                }
                if (height > maxHeight)
                {
                    height = maxHeight;
                    width = Convert.ToInt32(Math.Round(height * ratio, 0));
                }
                image.Mutate(x => x.Resize(width, height));
                image.SaveAsPng(imagePath);
                width = image.Width;
                height = image.Height;
                if (image.Width > 168 || image.Height > 168)
                {
                    if (image.Width > image.Height)
                    {
                        width = 168;
                        height = Convert.ToInt32(Math.Round(width / ratio, 0));
                    }
                    else
                    {
                        height = 168;
                        width = Convert.ToInt32(Math.Round(height * ratio, 0));
                    }
                }
                image.Mutate(x => x.Resize(width, height));
                image.SaveAsPng(thumbnailPath);
            }
            catch { return false; }
            return true;
        }
    }
}
