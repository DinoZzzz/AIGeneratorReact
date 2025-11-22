using System.Drawing;
using System.Windows.Forms;

namespace AIGenerator.Common
{
    public class ScreenshotControl
    {

        public static Bitmap CapturePanel(Panel panel)
        {
            panel.AutoScrollPosition = new Point(0, 0);
            Bitmap bitmap = new Bitmap(panel.DisplayRectangle.Width, panel.DisplayRectangle.Height);
            using (Graphics gfx = Graphics.FromImage(bitmap))
            using (SolidBrush brush = new SolidBrush(CustomColor.Background))
            {
                gfx.FillRectangle(brush, 0, 0, bitmap.Width, bitmap.Height);
            }
            //panel.DrawToBitmap(bitmap, new Rectangle(0, 0, bitmap.Width, bitmap.Height));
            foreach (Control child in panel.Controls) if (child.Visible) DrawControl(child, new Point(), bitmap);
            //bitmap.Save(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "img.jpg"), ImageFormat.Jpeg);
            return bitmap;
        }

        private static void DrawControl(Control control, Point parentLocation, Bitmap bitmap)
        {
            Point newLocation = new Point(parentLocation.X + control.Location.X, parentLocation.Y + control.Location.Y);
            control.DrawToBitmap(bitmap, new Rectangle(newLocation, control.Size));
            //control.DrawToBitmap(bitmap, control.Bounds);
            foreach (Control child in control.Controls) if (child.Visible) DrawControl(child, newLocation, bitmap);
        }
    }
}
