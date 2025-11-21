using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.Common
{
    public class StringClass
    {
        public static string GetByAsciiCode(byte code)
        {
            Encoding encoding = Encoding.GetEncoding(437);
            return encoding.GetString(new byte[] { code });
        }

        public static string SupperScript2() => GetByAsciiCode(253);

        public static string FormatString(string text)
        {
            StringBuilder sb = new StringBuilder();
            foreach (string s in text.Split(new string[] { " " }, StringSplitOptions.RemoveEmptyEntries))
            {
                sb.Append(" " + s);
            }
            return sb.ToString().Trim();
        }

        public static float StringWidth(string text, Font font)
        {
            //using (Graphics graphics = Graphics.FromImage(new Bitmap(1, 1)))
            //{
            //    return graphics.MeasureString(text, font).Width;
            //}
            return TextRenderer.MeasureText(text, font).Width;
        }

        public static float StringHeight(string text, Font font)
        {
            using (Graphics graphics = Graphics.FromImage(new Bitmap(1, 1)))
            {
                return graphics.MeasureString(text, font).Height;
            }
        }

        public static float StringHeight(string text, Font font, float width, float height)
        {
            using (Graphics graphics = Graphics.FromImage(new Bitmap(1, 1)))
            {
                return graphics.MeasureString(text, font, new SizeF(width, height)).Height;
            }
        }
    }
}
