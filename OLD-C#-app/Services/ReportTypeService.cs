using Interfaces;
using Models;
using Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services
{
    public class ReportTypeService : IReportType
    {
        public ReportTypeService(AppDbContext context) => repo = new ReportTypeRepository(context);

        private readonly ReportTypeRepository repo;

        public void Add(ReportType reportType) => repo.Add(reportType);

        public void AddRange(List<ReportType> reportTypes) => repo.AddRange(reportTypes);

        public ReportType GetById(int id) => repo.GetById(id);

        public IQueryable<ReportType> GetAll() => repo.GetAll();

        public void Remove(int id) => repo.Remove(GetById(id));

        public void RemoveRange(IEnumerable<ReportType> reportTypes) => repo.RemoveRange(reportTypes);

        public void SaveChanges() => repo.SaveChanges();
    }
}
