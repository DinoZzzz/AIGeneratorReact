using AIGeneratorWebApi.Interfaces;
using Models;
using AIGeneratorWebApi.Repositories;
using AIGeneratorWebApi.Models;

namespace AIGeneratorWebApi.Services
{
    public class ReportFileService : IReportFile
    {
        public ReportFileService(ApiDbContext context) => repo = new ReportFileRepository(context);

        private readonly ReportFileRepository repo;

        public async Task Add(ReportFile reportFile) => await repo.Add(reportFile);

        public async Task Update(List<ReportFile> reportFiles, string reportId, string contentRootPath)
        {
            foreach(ReportFile reportFile in GetByReport(reportId))
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
                    if (reportFile.Extension.ToLower() == ".pdf") RemoveByPdf(reportFile.Id, contentRootPath);
                    RemoveFiles(reportFile, contentRootPath);
                    repo.Remove(reportFile);
                }
            }
            foreach (ReportFile reportFile in reportFiles) await Add(reportFile);
        }

        public IQueryable<ReportFile> GetByReport(string reportId) => repo.GetAll().Where(x => x.ReportExportId == reportId);

        public IQueryable<ReportFile> GetByPdf(string pdfId) => repo.GetAll().Where(x => x.PdfId == pdfId);

        public void RemoveByReport(string reportId, string contentRootPath)
        {
            foreach(ReportFile file in GetByReport(reportId))
            {
                if (file.Extension.ToLower() == ".pdf") RemoveByPdf(file.Id, contentRootPath);
                RemoveFiles(file, contentRootPath);
                repo.Remove(file);
            }
        }

        public void RemoveByPdf(string pdfId, string contentRootPath)
        {
            foreach (ReportFile file in GetByPdf(pdfId))
            {
                RemoveFiles(file, contentRootPath);
                repo.Remove(file);
            }
        }

        public async Task SaveChanges() => await repo.SaveChanges();

        private void RemoveFiles(ReportFile reportFile, string contentRootPath)
        {
            contentRootPath = Path.Combine(contentRootPath, "Files");
            if (File.Exists(Path.Combine(contentRootPath, reportFile.Name))) File.Delete(Path.Combine(contentRootPath, reportFile.Name));
            if (File.Exists(Path.Combine(contentRootPath, "thumb_" + reportFile.Name))) File.Delete(Path.Combine(contentRootPath, "thumb_" + reportFile.Name));
        }
    }
}
