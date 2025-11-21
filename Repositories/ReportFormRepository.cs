using Models;
using System.Collections.Generic;
using System.Linq;

namespace Repositories
{
    public class ReportFormRepository
    {
        public ReportFormRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(ReportForm reportForm) => db.ReportForms.Add(reportForm);

        public void AddRange(List<ReportForm> reportForms) => db.ReportForms.AddRange(reportForms);

        public ReportForm GetById(string id) => db.ReportForms.SingleOrDefault(x => x.Id == id);

        public IQueryable<ReportForm> GetAll() => db.ReportForms;

        public void Remove(ReportForm reportForm) => db.ReportForms.Remove(reportForm);

        public void RemoveRange(IEnumerable<ReportForm> reportForms) => db.ReportForms.RemoveRange(reportForms);

        public void SaveChanges() => db.SaveChanges();
    }
}
