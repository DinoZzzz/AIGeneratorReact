using Common;
using Interfaces;
using Models;
using Newtonsoft.Json;
using Repositories;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Services
{
    public class ReportFileService : IReportFile
    {
        private readonly string SERVER_URL_PATH = AppData.SERVER_URL + "api/Files/";

        public ReportFileService(AppDbContext context, IAuthService iAuthService, IAppLog appLog)
        {
            repo = new ReportFileRepository(context);
            IAuthService = iAuthService;
            IAppLog = appLog;
        }

        private readonly ReportFileRepository repo;
        private readonly IAuthService IAuthService;
        private readonly IAppLog IAppLog;

        public async Task<bool> Upload(List<ReportFile> reportFiles, string reportId, User user)
        {
            try
            {
                bool attempt = false;
                HttpResponseMessage response;
                do
                {
                    if (attempt || string.IsNullOrEmpty(user.Token)) user.Token = (await IAuthService.GetToken()).Token;
                    HttpClient client = new HttpClient();
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user.Token);
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    string jsonData = JsonConvert.SerializeObject(reportFiles.OrderBy(x => x.Ordinal));
                    StringContent stringContent = new StringContent(jsonData, Encoding.UTF8, "application/json");
                    response = await client.PostAsync(new Uri(SERVER_URL_PATH + $"Update?reportId={reportId}&userId={user.Id}"), stringContent);
                    attempt = !attempt;
                } while (attempt && response.StatusCode == HttpStatusCode.Unauthorized);
                return response.StatusCode == HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                IAppLog.AddAndSave(new AppLog { Message = ex.Message, Version = "file upload" });
                return false;
            }
        }

        public IQueryable<ReportFile> GetByReport(string reportId) => repo.GetAll().Where(x => x.ReportExportId == reportId);

        public IQueryable<ReportFile> GetByPdf(string pdfId) => repo.GetAll().Where(x => x.PdfId == pdfId);

        public void SaveChanges() => repo.SaveChanges();

        public void Add(ReportFile reportFile) => repo.Add(reportFile);

        public void Update(List<ReportFile> reportFiles, string reportId, string contentRootPath)
        {
            foreach (ReportFile reportFile in GetByReport(reportId))
            {
                if (reportFiles.Any(x => x.Id == reportFile.Id))
                {
                    ReportFile rf = reportFiles.Single(x => x.Id == reportFile.Id);
                    reportFile.Ordinal = rf.Ordinal;
                    reportFile.UpdateTime = rf.UpdateTime;
                    reportFile.CreationTime = rf.CreationTime;
                    reportFile.Description = rf.Description;
                    reportFile.Name = rf.Name;
                    reportFile.Path = rf.Path;
                    reportFiles.Remove(rf);
                }
                else
                {
                    if(!string.IsNullOrEmpty(reportFile.PdfId))
                    {
                        foreach (ReportFile rf in GetByPdf(reportFile.Id))
                        {
                            RemoveFiles(rf, contentRootPath);
                            repo.Remove(rf);
                        }
                    }
                    RemoveFiles(reportFile, contentRootPath);
                    repo.Remove(reportFile);
                }
            }
            foreach (ReportFile reportFile in reportFiles.Where(x => string.IsNullOrEmpty(x.PdfId))) Add(reportFile);
        }

        public void RemoveByReport(string reportId, string contentRootPath)
        {
            foreach (ReportFile file in GetByReport(reportId))
            {
                RemoveFiles(file, contentRootPath);
                repo.Remove(file);
            }
        }

        public async Task SaveChangesAsync() => await repo.SaveChangesAsync();

        private void RemoveFiles(ReportFile reportFile, string contentRootPath)
        {
            contentRootPath = Path.Combine(contentRootPath, "Files");
            if (File.Exists(Path.Combine(contentRootPath, reportFile.Name))) File.Delete(Path.Combine(contentRootPath, reportFile.Name));
            if (File.Exists(Path.Combine(contentRootPath, "thumb_" + reportFile.Name))) File.Delete(Path.Combine(contentRootPath, "thumb_" + reportFile.Name));
        }
    }
}
