using AIGeneratorInstaller.Common;
using Common;
using System.Diagnostics;
using System.Reflection;

namespace AIGeneratorInstaller
{
    internal static class Program
    {
        /// <summary>
        ///  The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            // To customize application configuration such as set high DPI settings or default font,
            // see https://aka.ms/applicationconfiguration.
            ApplicationConfiguration.Initialize();
            Directory.CreateDirectory(AppData.FILES_FOLDER_PATH);
            Directory.CreateDirectory(AppData.TEMP_FOLDER_PATH);
            if (File.Exists(AppData.UPDATER_PATH))
            {
                Version update = new Version(FileVersionInfo.GetVersionInfo(AppData.UPDATER_PATH).ProductVersion ?? "");
                Version installer = new Version(FileVersionInfo.GetVersionInfo(Application.ExecutablePath).ProductVersion ?? "");
                if (update > installer)
                {
                    Process.Start(AppData.UPDATER_PATH);
                    Application.Exit();
                    return;
                }
            }
            Application.Run(new MainForm());
        }
    }
}