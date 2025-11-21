using Common;
using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIGeneratorInstaller.Common
{
    public class SetupClass
    {
        public int Install(string msiFilePath, string installPath)
        {
            string arguments = "/i \"" + msiFilePath + "\" /quiet TARGETDIR=\"" + installPath + "\"";
            ProcessStartInfo processStartInfo = new ProcessStartInfo();
            processStartInfo.FileName = "msiexec.exe";
            processStartInfo.Arguments = arguments;
            processStartInfo.CreateNoWindow = true;
            processStartInfo.UseShellExecute = false;
            using (Process? process = Process.Start(processStartInfo))
            {
                if (process != null)
                {
                    process.WaitForExit();
                    return process.ExitCode;
                }
                return -1;
            }
        }

        public int Uninstall()
        {
            string uninstallString = GetUninstallString(AppData.PRODUCT_CODE);

            if (!string.IsNullOrEmpty(uninstallString))
            {
                ProcessStartInfo startInfo = new ProcessStartInfo();
                startInfo.FileName = "msiexec";
                startInfo.Arguments = $"/x {AppData.PRODUCT_CODE} /qn";
                startInfo.UseShellExecute = false;
                startInfo.CreateNoWindow = true;

                Process process = new Process();
                process.StartInfo = startInfo;
                process.Start();
                process.WaitForExit();
                return process.ExitCode;
            }
            else
            {
                Console.WriteLine($"Unable to find uninstall string for product code: {AppData.PRODUCT_CODE}");
            }
            return 1;
        }

        public string GetUninstallString(string productCode)
        {
            return $"MsiExec.exe /I{productCode}";
            //string uninstallKey = $@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{productCode}";
            //using (RegistryKey? key = Registry.LocalMachine.OpenSubKey(uninstallKey))
            //{
            //    if (key != null)
            //    {
            //        object? value = key.GetValue("UninstallString");
            //        if (value != null)
            //        {
            //            return Convert.ToString(value) ?? "";
            //        }
            //    }
            //}
            //return string.Empty;
        }
    }
}
