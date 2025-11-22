using Models;
using Interfaces;
using Repositories;
using System.Collections.Generic;
using System.Linq;

namespace Services
{
    public class ReportDraftService : IReportDraft
    {
        public ReportDraftService(AppDbContext context) => repo = new ReportDraftRepository(context);

        private readonly ReportDraftRepository repo;

        public void Add(ReportDraft reportDraft) => repo.Add(reportDraft);

        public void AddRange(List<ReportDraft> reportDrafts) => repo.AddRange(reportDrafts);

        public ReportDraft GetById(int id) => repo.GetById(id);

        public IQueryable<ReportDraft> GetAll() => repo.GetAll();

        public IQueryable<ReportDraft> GetByType(int typeId) => repo.GetAll().Where(x => x.ReportFormTypeId == typeId);

        public void Remove(int id) => repo.Remove(GetById(id));

        public void RemoveRange(IEnumerable<ReportDraft> reportDrafts) => repo.RemoveRange(reportDrafts);

        public void SaveChanges() => repo.SaveChanges();
    }
}
