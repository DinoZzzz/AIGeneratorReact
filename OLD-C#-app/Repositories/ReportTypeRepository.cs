using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class ReportTypeRepository
    {
        public ReportTypeRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(ReportType reportType) => db.ReportTypes.Add(reportType);

        public void AddRange(List<ReportType> reportTypes) => db.ReportTypes.AddRange(reportTypes);

        public ReportType GetById(int id) => db.ReportTypes.SingleOrDefault(x => x.Id == id);

        public IQueryable<ReportType> GetAll() => db.ReportTypes;

        public void Remove(ReportType reportType) => db.ReportTypes.Remove(reportType);

        public void RemoveRange(IEnumerable<ReportType> reportTypes) => db.ReportTypes.RemoveRange(reportTypes);

        public void SaveChanges() => db.SaveChanges();
    }
}
