using Models;
using System.Collections.Generic;
using System.Linq;

namespace Interfaces
{
    public interface IReportForm
    {
        void Add(ReportForm reportForm);
        ReportForm CopyAdd(ReportForm reportForm);
        void AddRange(List<ReportForm> reportForms);
        void UpdateOrdinals(List<ReportForm> reportForms, string constructionId);
        ReportForm GetById(string id);
        IQueryable<ReportForm> GetAll();
        IQueryable<ReportForm> GetByCustomer(string customerId);
        IQueryable<ReportForm> GetByConstruction(string constructionId);
        bool Any(string id);
        bool AnyMaterial(int materialId);
        bool AnyMaterialType(int materialTypeId);
        void Remove(string id);
        void RemoveRange(IEnumerable<ReportForm> reportForms);
        void RemoveByCustomer(string customerId);
        void RemoveByConstruction(string constructionId);
        void SaveChanges();
    }
}
