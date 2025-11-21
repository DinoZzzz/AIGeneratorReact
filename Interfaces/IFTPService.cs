using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Interfaces
{
    public interface IFTPService
    {
        string DownloadFile(string fileName);
        string DownloadUpdater(string version);
        string DownloadInstaller();
        bool UploadToAIServer(string customerName, string workOrder, string filePath);
        string GetServerVersion();
        string GetUpdaterVersion();
    }
}
