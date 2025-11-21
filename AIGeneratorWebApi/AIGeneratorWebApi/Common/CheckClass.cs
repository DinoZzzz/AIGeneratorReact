namespace AIGeneratorWebApi.Common
{
    public class CheckClass
    {
        public static bool IsImage(string extension)
        {
            switch (extension.ToLower())
            {
                case ".jpeg":
                    return true;
                case ".jpg":
                    return true;
                case ".webp":
                    return true;
                case ".png":
                    return true;
                case ".gif":
                    return true;
                case ".bmp":
                    return true;
                case ".wbmp":
                    return true;
                default:
                    return false;
            }
        }

        public static bool IsVideo(string extension)
        {
            switch (extension.ToLower())
            {
                case ".mp4":
                    return true;
                case ".mov":
                    return true;
                case ".wmv":
                    return true;
                case ".rmvb":
                    return true;
                case ".avi":
                    return true;
                case ".avchd":
                    return true;
                case ".webm":
                    return true;
                case ".mkv":
                    return true;
                case ".mpg":
                    return true;
                case ".mpeg":
                    return true;
                case ".3gp":
                    return true;
                default:
                    return false;
            }
        }
    }
}
