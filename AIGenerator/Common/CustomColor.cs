using AIGenerator.Forms;
using Interfaces;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIGenerator.Common
{
    public class CustomColor
    {
        public static Color MainColor { get { return LoginForm.DarkMode ? Color.FromArgb(255, 255, 255) : Color.FromArgb(35, 177, 77); } }
        public static Color Green { get { return Color.FromArgb(35, 177, 77); } }
        public static Color MainColor20 { get { return Color.FromArgb(208, 235, 216); } }
        public static Color Text1 { get { return LoginForm.DarkMode ? Color.White : Color.FromArgb(0, 0, 0); } }
        public static Color Text2 { get { return LoginForm.DarkMode ? Color.FromArgb(225, 225, 225) : Color.FromArgb(131, 131, 131); } }
        public static Color Text3 { get { return LoginForm.DarkMode ? Color.FromArgb(170, 170, 170) : Color.FromArgb(171, 171, 171); } }
        public static Color Background { get { return LoginForm.DarkMode ? Color.FromArgb(38, 38, 38) : Color.FromArgb(250, 251, 250); } }
        public static Color PrimaryBackground { get { return LoginForm.DarkMode ? Color.FromArgb(131, 131, 131) : Color.White; } }
        public static Color White10 { get { return LoginForm.DarkMode ? Color.FromArgb(172, 172, 172) : Color.FromArgb(244, 255, 238); } }
        public static Color Red { get { return Color.FromArgb(242, 68, 29); } }
        public static Color Pre10 { get { return Color.FromArgb(244, 255, 238); } }
        public static Color Grey { get { return Color.FromArgb(243, 243, 243); } }
    }
}
