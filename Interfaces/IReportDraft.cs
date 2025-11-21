using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Interfaces
{
    public interface IReportDraft
    {
        void Add(ReportDraft reportDraft);
        void AddRange(List<ReportDraft> reportDrafts);
        ReportDraft GetById(int id);
        IQueryable<ReportDraft> GetAll();
        IQueryable<ReportDraft> GetByType(int typeId);
        void Remove(int id);
        void RemoveRange(IEnumerable<ReportDraft> reportDrafts);
        void SaveChanges();
    }
}
