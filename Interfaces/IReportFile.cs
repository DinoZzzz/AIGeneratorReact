using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Interfaces
{
    public interface IReportFile
    {
        Task<bool> Upload(List<ReportFile> reportFiles, string reportId, User user);
        IQueryable<ReportFile> GetByReport(string reportId);
        IQueryable<ReportFile> GetByPdf(string pdfId);
        void SaveChanges();
        void Add(ReportFile reportFile);
        void Update(List<ReportFile> reportFiles, string reportId, string contentRootPath);
        void RemoveByReport(string reportId, string contentRootPath);
        Task SaveChangesAsync();
    }
}
