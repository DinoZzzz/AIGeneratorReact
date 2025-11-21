using Models;
using System.Collections.Generic;
using System.Linq;

namespace Repositories
{
    public class ReportDraftRepository
    {
        public ReportDraftRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(ReportDraft reportDraft) => db.ReportDrafts.Add(reportDraft);

        public void AddRange(List<ReportDraft> reportDrafts) => db.ReportDrafts.AddRange(reportDrafts);

        public ReportDraft GetById(int id) => db.ReportDrafts.SingleOrDefault(x => x.Id == id);

        public IQueryable<ReportDraft> GetAll() => db.ReportDrafts;

        public void Remove(ReportDraft reportDraft) => db.ReportDrafts.Remove(reportDraft);

        public void RemoveRange(IEnumerable<ReportDraft> reportDrafts) => db.ReportDrafts.RemoveRange(reportDrafts);

        public void SaveChanges() => db.SaveChanges();
    }
}
