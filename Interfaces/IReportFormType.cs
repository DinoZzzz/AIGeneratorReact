using Models;
using System.Collections.Generic;
using System.Linq;

namespace Interfaces
{
    public interface IReportFormType
    {
        void Add(ReportFormType reportFormType);
        void AddRange(List<ReportFormType> reportFormTypes);
        ReportFormType GetById(int id);
        IQueryable<ReportFormType> GetAll();
        bool Any(int id);
        void Remove(int id);
        void RemoveRange(IEnumerable<ReportFormType> reportFormTypes);
        void SaveChanges();
    }
}
