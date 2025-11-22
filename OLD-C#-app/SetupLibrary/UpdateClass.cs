using Common;
using Interfaces;
using Microsoft.Win32;
using System;
using System.Diagnostics;
using System.IO;
using static System.Net.Mime.MediaTypeNames;

namespace SetupLibrary
{
    public class UpdateClass
    {
        private readonly IFTPService IFTPService;

        public UpdateClass(IFTPService iFTPService)
        {
            IFTPService = iFTPService;
        }

        //private readonly string msiFile = "C:\\Users\\Zoli\\Desktop\\AIGeneratorSetup.msi";
        //private readonly string installPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "AIGenerator");
        //private readonly string filesPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "AIGeneratorFiles");

        public SetupState CheckForUpdate()
        {
            //if (IsAppInstalled())
            //{
            if (IsUpdateAvailable())
            {
                return UpdateApp();
            }
            return SetupState.UpToDate;
            //}
            //else
            //{
            //    try
            //    {
            //        string newVersionInstallerPath = IFTPService.DownloadInstaller();
            //        if (string.IsNullOrEmpty(newVersionInstallerPath)) throw new Exception();
            //        try
            //        {
            //            new InstallClass().Install(newVersionInstallerPath, installPath);
            //            if (File.Exists(newVersionInstallerPath)) File.Delete(newVersionInstallerPath);
            //        }
            //        catch
            //        {
            //            if (File.Exists(newVersionInstallerPath)) File.Delete(newVersionInstallerPath);
            //            return SetupState.InstallFailed;
            //        }
            //        return SetupState.Installed;
            //    }
            //    catch { return SetupState.InstallFailed; }
            //}
        }

        public SetupState UpdateApp()
        {
            try
            {
                string newVersionInstallerPath = IFTPService.DownloadInstaller();
                if (string.IsNullOrEmpty(newVersionInstallerPath)) throw new Exception();
                //try { new UninstallClass().Uninstall(); }
                //catch { return SetupState.UninstallFailed; }
                try
                {
                    new InstallClass().Update(newVersionInstallerPath);
                }
                catch
                {
                    return SetupState.InstallFailed;
                }
                return SetupState.Updated;
            }
            catch { return SetupState.UpdateFailed; }
        }

        public bool IsUpdateAvailable()
        {
            string serverVersion = IFTPService.GetServerVersion();
            string localVersion = new VersionClass().GetAppVersion();
            return serverVersion != localVersion;
        }

        public bool IsUpdaterUpdateAvailable()
        {
            string serverVersion = IFTPService.GetUpdaterVersion();
            string localVersion = new VersionClass().GetUpdaterVersion();
            return serverVersion != localVersion;
        }

        public SetupState CheckForUpdaterUpdate()
        {
            try
            {
                string updaterVersion = IFTPService.GetUpdaterVersion();
                if (!File.Exists(AppData.UPDATER_PATH) || (FileVersionInfo.GetVersionInfo(AppData.UPDATER_PATH).ProductVersion ?? "") != updaterVersion)
                {

                    string filePath = IFTPService.DownloadUpdater(updaterVersion);
                    if (string.IsNullOrEmpty(filePath)) throw new Exception();
                    if (File.Exists(AppData.UPDATER_PATH)) File.Delete(AppData.UPDATER_PATH);
                    File.Copy(filePath, AppData.UPDATER_PATH);
                    if (File.Exists(filePath)) File.Delete(filePath);
                    return SetupState.Installed;
                }
                return SetupState.UpToDate;
            }
            catch { return SetupState.InstallFailed; }
            //if (File.Exists(filePath))
            //{
            //    if (!IsUpdaterUpdateAvailable()) return SetupState.UpToDate;
            //    try
            //    {
            //        string newVersionPath = "";
            //        try { if (File.Exists(filePath)) File.Delete(filePath); }
            //        catch { return SetupState.UninstallFailed; }
            //        try
            //        {
            //            newVersionPath = IFTPService.DownloadUpdater();
            //            File.Copy(newVersionPath, filePath);
            //        }
            //        catch
            //        {
            //            if (File.Exists(newVersionPath)) File.Delete(newVersionPath);
            //            return SetupState.InstallFailed;
            //        }
            //        return SetupState.Updated;
            //    }
            //    catch { return SetupState.UpdateFailed; }

            //}
            //else
            //{
            //    try
            //    {
            //        string newVersionPath = IFTPService.DownloadUpdater();
            //        File.Copy(newVersionPath, filePath);
            //        return SetupState.Installed;
            //    }
            //    catch { return SetupState.InstallFailed; }
            //}
        }

        public bool IsAppInstalled()
        {
            return File.Exists(AppData.APP_EXE_PATH);
        }
    }
}
