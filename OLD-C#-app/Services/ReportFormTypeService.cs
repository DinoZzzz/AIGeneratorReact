using Models;
using Interfaces;
using Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services
{
    public class ReportFormTypeService : IReportFormType
    {
        public ReportFormTypeService(AppDbContext context) => repo = new ReportFormTypeRepository(context);

        private readonly ReportFormTypeRepository repo;

        public void Add(ReportFormType reportFormType) => repo.Add(reportFormType);

        public void AddRange(List<ReportFormType> reportFormTypes) => repo.AddRange(reportFormTypes);

        public ReportFormType GetById(int id) => repo.GetById(id);

        public IQueryable<ReportFormType> GetAll() => repo.GetAll();

        public bool Any(int id) => repo.GetAll().Any(x => x.Id == id);

        public void Remove(int id) => repo.Remove(GetById(id));

        public void RemoveRange(IEnumerable<ReportFormType> reportFormTypes) => repo.RemoveRange(reportFormTypes);

        public void SaveChanges() => repo.SaveChanges();
    }
}
