using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SetupLibrary
{
    public enum SetupState
    {
        Unknown,
        UpToDate,
        Installed,
        Uninstalled,
        Updated,
        UpdateFailed,
        InstallFailed,
        UninstallFailed
    }
}
