using Models;
using System.Collections.Generic;
using System.Linq;

namespace Repositories
{
    public class ReportFormTypeRepository
    {
        public ReportFormTypeRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(ReportFormType reportFormType) => db.ReportFormTypes.Add(reportFormType);

        public void AddRange(List<ReportFormType> reportFormTypes) => db.ReportFormTypes.AddRange(reportFormTypes);

        public ReportFormType GetById(int id) => db.ReportFormTypes.SingleOrDefault(x => x.Id == id);

        public IQueryable<ReportFormType> GetAll() => db.ReportFormTypes;

        public void Remove(ReportFormType reportFormType) => db.ReportFormTypes.Remove(reportFormType);

        public void RemoveRange(IEnumerable<ReportFormType> reportFormTypes) => db.ReportFormTypes.RemoveRange(reportFormTypes);

        public void SaveChanges() => db.SaveChanges();
    }
}
