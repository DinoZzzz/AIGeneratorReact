using Models;
using System.Collections.Generic;
using System.Linq;

namespace Interfaces
{
    public interface IReportExport
    {
        void Add(ReportExport reportExport);
        void AddRange(List<ReportExport> reportExports);
        ReportExport GetById(string id);
        IQueryable<ReportExport> GetAll();
        IQueryable<ReportExport> GetByUser(string userId);
        IQueryable<ReportExport> GetByConstruction(string constructionId);
        IQueryable<ReportExport> GetByCustomer(string customerId);
        void Remove(string id);
        void Remove(ReportExport reportExport);
        void RemoveRange(IEnumerable<ReportExport> reportExports);
        void RemoveByUser(string userId);
        void SaveChanges();
    }
}
