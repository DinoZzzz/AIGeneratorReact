using Common;
using Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Security.Policy;
using System.Text;
using System.Threading.Tasks;

namespace Services
{
    public class FTPService : IFTPService
    {
        //public string DownloadFile(string fileName)
        //{
        //    string filePath = Path.Combine(AppData.TEMP_FOLDER_PATH, Path.GetFileNameWithoutExtension(fileName) + Guid.NewGuid().ToString() + Path.GetExtension(fileName));
        //    try
        //    {
        //        using (WebClient webClient = new WebClient())
        //        {
        //            webClient.Credentials = new NetworkCredential(username, password);
        //            webClient.DownloadFile(AppData.FTP_HOST + "/" + fileName, filePath);
        //        }
        //        return filePath;
        //    }
        //    catch { return ""; }
        //}

        public string DownloadInstaller()
        {
            string serverVersion = GetServerVersion();
            return DownloadFile($"AIGeneratorSetup{serverVersion}.msi");
        }

        public string DownloadUpdater(string version)
        {
            return DownloadFile($"AIGeneratorUpdater{version}.exe");
        }

        public bool UploadToAIServer(string customerName, string workOrder, string fileName)
        {
            try
            {
                if (string.IsNullOrEmpty(customerName)) customerName = "Default";
                else if(customerName.EndsWith(".")) customerName = customerName.Remove(customerName.Length - 1, 1);
                if (fileName.EndsWith(".")) fileName = fileName.Remove(fileName.Length - 1, 1);
                ServicePointManager.ServerCertificateValidationCallback = delegate { return true; };
                string root = AppData.APP_FOLDER_NAME;
                string folder = root + "/" + customerName + "/" + workOrder;
                if (!CreateFolderOnFTPServer("", root)) return false;
                if (!CreateFolderOnFTPServer(root, customerName)) return false;
                if (!CreateFolderOnFTPServer(root + "/" + customerName, workOrder)) return false;
                FtpWebRequest request = (FtpWebRequest)WebRequest.Create(AppData.AI_FTP_HOST + "/" + folder + "/" + Path.GetFileName(fileName));
                request.Method = WebRequestMethods.Ftp.UploadFile;
                request.Credentials = new NetworkCredential(AppData.AI_FTP_USERNAME, AppData.AI_FTP_PASSWORD);
                request.EnableSsl = true;
                request.UsePassive = true;

                using (StreamReader sourceStream = new StreamReader(fileName))
                {
                    byte[] fileContents = Encoding.UTF8.GetBytes(sourceStream.ReadToEnd());
                    request.ContentLength = fileContents.Length;

                    using (Stream requestStream = request.GetRequestStream())
                    {
                        requestStream.Write(fileContents, 0, fileContents.Length);
                    }
                }
                using (FtpWebResponse response = (FtpWebResponse)request.GetResponse())
                {
                    return response.StatusCode == FtpStatusCode.ClosingData;
                }
            }
            catch { return false; }
        }

        public string GetServerVersion()
        {
            //string version = "";
            //ServicePointManager.SecurityProtocol = SecurityProtocolType.Ssl3;
            //using (WebClient webClient = new WebClient())
            //{
            //    webClient.Credentials = new NetworkCredential(username, password);
            //    version = webClient.DownloadString(AppData.FTP_HOST + "/version.txt");
            //}

            return GetFileText(AppData.FTP_HOST + "/version.txt");
        }

        public string GetUpdaterVersion()
        {
            //string version = "";
            //using (WebClient webClient = new WebClient())
            //{
            //    webClient.Credentials = new NetworkCredential(username, password);
            //    version = webClient.DownloadString(AppData.FTP_HOST + "/updater_version.txt");
            //}
            //return version;
            return GetFileText(AppData.FTP_HOST + "/updater_version.txt");
        }

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

        private bool CreateFolderOnFTPServer(string path, string folderName)
        {
            try
            {
                if (CheckIfFTPFolderExists(path, folderName)) return true;
                FtpWebRequest request = (FtpWebRequest)WebRequest.Create(AppData.AI_FTP_HOST + "/" + path + "/" + folderName + "/");
                request.Method = WebRequestMethods.Ftp.MakeDirectory;
                request.Credentials = new NetworkCredential(AppData.AI_FTP_USERNAME, AppData.AI_FTP_PASSWORD);
                request.EnableSsl = true;
                request.UsePassive = true;

                using (FtpWebResponse response = (FtpWebResponse)request.GetResponse())
                {
                    return response.StatusCode == FtpStatusCode.PathnameCreated;
                }
            }
            catch (WebException ex)
            {
                FtpWebResponse resp = (FtpWebResponse)ex.Response;
                if (resp == null) return false;
                return resp.StatusCode == FtpStatusCode.ActionNotTakenFileUnavailable;
            }
            catch
            {
                return false;
            }
        }

        private bool CheckIfFTPFolderExists(string path, string folderName)
        {
            try
            {
                FtpWebRequest request = (FtpWebRequest)WebRequest.Create(AppData.AI_FTP_HOST + "/" + path + "/");
                request.Method = WebRequestMethods.Ftp.ListDirectory;
                request.Credentials = new NetworkCredential(AppData.AI_FTP_USERNAME, AppData.AI_FTP_PASSWORD);
                request.EnableSsl = true;
                request.UsePassive = true;

                using (FtpWebResponse response = (FtpWebResponse)request.GetResponse())
                {
                    using (StreamReader streamReader = new StreamReader(response.GetResponseStream()))
                    {
                        string str = streamReader.ReadToEnd();
                        using (StreamWriter sw = new StreamWriter("log.txt", true))
                        {
                            sw.WriteLine(AppData.AI_FTP_HOST + "/" + path + "/");
                            sw.WriteLine(folderName);
                            sw.WriteLine("Reader: " + str);
                        }

                        List<string> directories = str.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();

                        if (directories.Any(x => x.ToLower() == folderName.ToLower()))
                        {
                            // Folder already exists
                            return true;
                        }
                    }
                }
            }
            catch { }
            return false;
        }
    }
}
