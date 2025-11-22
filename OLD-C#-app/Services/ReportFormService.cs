using Models;
using Interfaces;
using Repositories;
using System.Collections.Generic;
using System.Linq;
using System;

namespace Services
{
    public class ReportFormService : IReportForm
    {
        public ReportFormService(AppDbContext context) => repo = new ReportFormRepository(context);

        private readonly ReportFormRepository repo;

        public void Add(ReportForm reportForm) => repo.Add(reportForm);

        public ReportForm CopyAdd(ReportForm reportForm)
        {
            ReportForm rf = ReportForm.CreateCopy(reportForm);
            repo.Add(rf);
            return rf;
        }


        public void AddRange(List<ReportForm> reportForms) => repo.AddRange(reportForms);

        public void UpdateOrdinals(List<ReportForm> reportForms, string constructionId)
        {
            foreach(ReportForm reportForm in GetByConstruction(constructionId))
            {
                ReportForm rf = reportForms.SingleOrDefault(x => x.Id == reportForm.Id);
                if (rf == null) continue;
                reportForm.Ordinal = rf.Ordinal;
            }
        }

        public ReportForm GetById(string id) => repo.GetById(id);

        public IQueryable<ReportForm> GetAll() => repo.GetAll();
        
        public IQueryable<ReportForm> GetByCustomer(string customerId) => repo.GetAll().Where(x => x.CustomerId == customerId);

        public IQueryable<ReportForm> GetByConstruction(string constructionId) => repo.GetAll().Where(x => x.ConstructionId == constructionId);

        public bool Any(string id) => repo.GetAll().Any(x => x.Id == id);

        public bool AnyMaterial(int materialId) => repo.GetAll().Any(x => x.PaneMaterialId == materialId || x.PipeMaterialId == materialId);

        public bool AnyMaterialType(int materialTypeId) => repo.GetAll().Any(x => x.MaterialTypeId == materialTypeId);

        public void Remove(string id) => repo.Remove(GetById(id));

        public void RemoveRange(IEnumerable<ReportForm> reportForms) => repo.RemoveRange(reportForms);

        public void RemoveByCustomer(string customerId) => repo.RemoveRange(GetByCustomer(customerId));

        public void RemoveByConstruction(string constructionId) => repo.RemoveRange(GetByConstruction(constructionId));

        public void SaveChanges() => repo.SaveChanges();
    }
}
