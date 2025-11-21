using Models;
using Interfaces;
using Repositories;
using System.Collections.Generic;
using System.Linq;

namespace Services
{
    public class ReportExportService : IReportExport
    {
        public ReportExportService(AppDbContext context) => repo = new ReportExportRepository(context);

        private readonly ReportExportRepository repo;

        public void Add(ReportExport reportExport) => repo.Add(reportExport);

        public void AddRange(List<ReportExport> reportExports) => repo.AddRange(reportExports);

        public ReportExport GetById(string id) => repo.GetById(id);

        public IQueryable<ReportExport> GetAll() => repo.GetAll();

        public IQueryable<ReportExport> GetByUser(string userId) => repo.GetAll().Where(x => x.UserId == userId);

        public IQueryable<ReportExport> GetByCustomer(string customerId) => repo.GetAll().Where(x => x.CustomerId == customerId);
        
        public IQueryable<ReportExport> GetByConstruction(string constructionId) => repo.GetAll().Where(x => x.ConstructionId == constructionId);

        public void Remove(string id) => repo.Remove(GetById(id));

        public void Remove(ReportExport reportExport) => repo.Remove(reportExport);

        public void RemoveRange(IEnumerable<ReportExport> reportExports) => repo.RemoveRange(reportExports);

        public void RemoveByUser(string userId) => repo.RemoveRange(GetByUser(userId));

        public void SaveChanges() => repo.SaveChanges();
    }
}
