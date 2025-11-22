using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace SetupLibrary
{
    public class InstallClass
    {
        [DllImport("msi.dll", SetLastError = true)]
        private static extern int MsiInstallProduct(string packagePath, string commandLine);

        public void Install(string msiFilePath, string installPath)
        {
            string arguments = "/i " + msiFilePath + " /quiet TARGETDIR=" + installPath;
            ProcessStartInfo processStartInfo = new ProcessStartInfo();
            processStartInfo.FileName = "msiexec.exe";
            processStartInfo.Arguments = arguments;
            processStartInfo.CreateNoWindow = true;
            processStartInfo.UseShellExecute = false;
            using (Process process = Process.Start(processStartInfo))
            {
                process.WaitForExit();
                if (process.ExitCode == 0)
                {
                    Console.WriteLine("Installation was successful.");
                }
                else
                {
                    Console.WriteLine("Installation failed with exit code: " + process.ExitCode);
                }
            }
        }

        public void Update(string msiFilePath)
        {
            string batFilePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "AIGeneratorFiles", "AIGeneratorUpdater.bat");

            ProcessStartInfo startInfo = new ProcessStartInfo();
            startInfo.CreateNoWindow = true;
            startInfo.UseShellExecute = false;
            startInfo.FileName = batFilePath;
            startInfo.WindowStyle = ProcessWindowStyle.Hidden;
            startInfo.Arguments = msiFilePath;

            Process.Start(startInfo);
        }
    }
}
