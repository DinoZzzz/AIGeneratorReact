using Common;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SetupLibrary
{
    public class VersionClass
    {
        public string GetAppVersion()
        {
            if (!File.Exists(AppData.APP_EXE_PATH)) return "";

            FileVersionInfo versionInfo = FileVersionInfo.GetVersionInfo(AppData.APP_EXE_PATH);

            return versionInfo.ProductVersion;            
        }

        public string GetUpdaterVersion()
        {
            if (!File.Exists(AppData.UPDATER_PATH)) return "";

            FileVersionInfo versionInfo = FileVersionInfo.GetVersionInfo(AppData.UPDATER_PATH);

            return versionInfo.ProductVersion;
        }
    }
}
