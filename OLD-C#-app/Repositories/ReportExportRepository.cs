using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class ReportExportRepository
    {
        public ReportExportRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(ReportExport reportExport) => db.ReportExports.Add(reportExport);

        public void AddRange(List<ReportExport> reportExports) => db.ReportExports.AddRange(reportExports);

        public ReportExport GetById(string id) => db.ReportExports.SingleOrDefault(x => x.Id == id);

        public IQueryable<ReportExport> GetAll() => db.ReportExports;

        public void Remove(ReportExport reportExport) => db.ReportExports.Remove(reportExport);

        public void RemoveRange(IEnumerable<ReportExport> reportExports) => db.ReportExports.RemoveRange(reportExports);

        public void SaveChanges() => db.SaveChanges();
    }
}
