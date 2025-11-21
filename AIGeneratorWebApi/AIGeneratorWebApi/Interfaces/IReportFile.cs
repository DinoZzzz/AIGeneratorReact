using Models;

namespace AIGeneratorWebApi.Interfaces
{
    public interface IReportFile
    {
        Task Add(ReportFile reportFile);
        Task Update(List<ReportFile> reportFiles, string reportId, string contentRootPath);
        IQueryable<ReportFile> GetByReport(string reportId);
        IQueryable<ReportFile> GetByPdf(string pdfId);
        void RemoveByReport(string reportId, string contentRootPath);
        void RemoveByPdf(string pdfId, string contentRootPath);
        Task SaveChanges();
    }
}
