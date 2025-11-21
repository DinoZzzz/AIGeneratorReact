using Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace AIGeneratorInstaller.Common
{
    public class FTPService
    {
        public string DownloadFile(string fileName)
        {
            string filePath = Path.Combine(AppData.TEMP_FOLDER_PATH, Path.GetFileNameWithoutExtension(fileName) + Guid.NewGuid().ToString() + Path.GetExtension(fileName));
            try
            {
                using (FtpWebResponse response = GetFTPResponse(AppData.FTP_HOST + "/" + fileName))
                {
                    // Get the response stream and save it to a file
                    using (Stream responseStream = response.GetResponseStream())
                    {
                        using (FileStream localFileStream = new FileStream(filePath, FileMode.Create))
                        {
                            responseStream.CopyTo(localFileStream);
                            return filePath;
                        }
                    }
                }
            }
            catch { return ""; }
        }

        public string GetServerVersion()
        {
            return GetFileText(AppData.FTP_HOST + "/version.txt");
        }

        public string GetUpdaterVersion()
        {
            return GetFileText(AppData.FTP_HOST + "/updater_version.txt");
        }

        private string GetFileText(string url)
        {
            string text = "";
            // Get the FTP server's response
            using (FtpWebResponse response = GetFTPResponse(url))
            {
                // Get the response stream and read the string
                using (Stream responseStream = response.GetResponseStream())
                {
                    using (StreamReader reader = new StreamReader(responseStream))
                    {
                        text = reader.ReadToEnd();
                    }
                }
            }
            return text;
        }

        private FtpWebResponse GetFTPResponse(string url)
        {
            FtpWebRequest request = (FtpWebRequest)WebRequest.Create(url);
            request.EnableSsl = true;

            // Set the login credentials
            request.Credentials = new NetworkCredential(AppData.FTP_USERNAME, AppData.FTP_PASSWORD);

            // Specify that we want to download a string
            request.Method = WebRequestMethods.Ftp.DownloadFile;
            return (FtpWebResponse)request.GetResponse();
        }
    }
}
