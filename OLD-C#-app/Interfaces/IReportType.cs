using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Interfaces
{
    public interface IReportType
    {
        void Add(ReportType reportType);
        void AddRange(List<ReportType> reportTypes);
        ReportType GetById(int id);
        IQueryable<ReportType> GetAll();
        void Remove(int id);
        void RemoveRange(IEnumerable<ReportType> reportTypes);
        void SaveChanges();
    }
}
