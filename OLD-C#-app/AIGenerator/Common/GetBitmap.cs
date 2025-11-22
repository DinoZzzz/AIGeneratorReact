using System.Drawing;

namespace AIGenerator.Common
{
    public class GetBitmap
    {
        public static Bitmap GetById(int id)
        {
            object obj = Properties.Resources.ResourceManager.GetObject($"Scheme{id}");
            return (Bitmap)obj;
        }
    }
}
