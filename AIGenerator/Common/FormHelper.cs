using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.Common
{
    public class FormHelper
    {
        public static void CloseApp()
        {
            if (!new StackTrace().GetFrames().Any(x => x.GetMethod().Name == "Close")) Application.Exit();
        }

        public static void ConfigureTimePicker(DateTimePicker timePicker)
        {
            timePicker.Format = DateTimePickerFormat.Custom;
            timePicker.CustomFormat = "HH:mm";
            timePicker.ShowUpDown = true;
        }
    }
}
