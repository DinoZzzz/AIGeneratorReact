using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Interfaces
{
    public interface IReportExportForm
    {
        void Add(ReportExportForm reportExportForm);
        void AddRange(List<ReportExportForm> reportExportForms);
        void Update(List<ReportExportForm> reportExportForms, string exportId);
        ReportExportForm GetById(string id);
        IQueryable<ReportExportForm> GetByExport(string exportId);
        IQueryable<ReportExportForm> GetAll();
        int GetLastOrdinal(string exportId, int typeId);
        bool Any(string id);
        void Remove(string id);
        void RemoveByForm(string formId);
        void RemoveRange(IEnumerable<ReportExportForm> reportExportForms);
        void RemoveByExport(string exportId);
        void SaveChanges();
    }
}
