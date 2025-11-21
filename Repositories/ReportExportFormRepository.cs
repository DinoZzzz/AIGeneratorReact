using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class ReportExportFormRepository
    {
        public ReportExportFormRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(ReportExportForm reportExportForm) => db.ReportExportForms.Add(reportExportForm);

        public void AddRange(List<ReportExportForm> reportExportForms) => db.ReportExportForms.AddRange(reportExportForms);

        public ReportExportForm GetById(string id) => db.ReportExportForms.SingleOrDefault(x => x.Id == id);

        public IQueryable<ReportExportForm> GetAll() => db.ReportExportForms;

        public void Remove(ReportExportForm reportExportForm) => db.ReportExportForms.Remove(reportExportForm);

        public void RemoveRange(IEnumerable<ReportExportForm> reportExportForms) => db.ReportExportForms.RemoveRange(reportExportForms);

        public void SaveChanges() => db.SaveChanges();
    }
}
