using Common;
using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SetupLibrary
{
    public class UninstallClass
    {
        public void Uninstall()
        {
            string uninstallString = GetUninstallString(AppData.PRODUCT_CODE);

            if (!string.IsNullOrEmpty(uninstallString))
            {
                ProcessStartInfo startInfo = new ProcessStartInfo();
                startInfo.FileName = "msiexec";
                startInfo.Arguments = $"/x {AppData.PRODUCT_CODE} /qn"; // the /qn argument specifies a silent uninstallation
                startInfo.UseShellExecute = false;
                startInfo.CreateNoWindow = true;

                Process process = new Process();
                process.StartInfo = startInfo;
                process.Start();
                process.WaitForExit();
            }
            else
            {
                Console.WriteLine($"Unable to find uninstall string for product code: {AppData.PRODUCT_CODE}");
            }
        }

        public string GetUninstallString(string productCode)
        {
            string uninstallKey = $@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{productCode}";
            using (RegistryKey key = Registry.LocalMachine.OpenSubKey(uninstallKey))
            {
                if (key != null)
                {
                    object value = key.GetValue("UninstallString");
                    if (value != null)
                    {
                        return value.ToString();
                    }
                }
            }
            return string.Empty;
        }
    }
}
