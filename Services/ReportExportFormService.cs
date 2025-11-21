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
    public class ReportExportFormService : IReportExportForm
    {
        public ReportExportFormService(AppDbContext context) => repo = new ReportExportFormRepository(context);

        private readonly ReportExportFormRepository repo;

        public void Add(ReportExportForm reportExportForm) => repo.Add(reportExportForm);

        public void AddRange(List<ReportExportForm> reportExportForms) => repo.AddRange(reportExportForms);

        public void Update(List<ReportExportForm> reportExportForms, string exportId)
        {
            DateTime now = DateTime.Now;
            foreach (ReportExportForm reportExportForm in GetByExport(exportId))
            {
                if (reportExportForms.Any(x => x.Id == reportExportForm.Id))
                {
                    ReportExportForm form = reportExportForms.SingleOrDefault(x => x.Id == reportExportForm.Id);
                    reportExportForm.Ordinal = form.Ordinal;
                    reportExportForm.UpdateTime = now;
                    reportExportForms.Remove(form);
                }
                else Remove(reportExportForm.Id);
            }
            foreach (ReportExportForm reportExportForm in reportExportForms)
            {
                reportExportForm.CreationTime = reportExportForm.UpdateTime = now;
                Add(reportExportForm);
            }
        }

        public ReportExportForm GetById(string id) => repo.GetById(id);

        public IQueryable<ReportExportForm> GetByExport(string exportId) => repo.GetAll().Where(x => x.ExportId == exportId);

        public IQueryable<ReportExportForm> GetAll() => repo.GetAll();

        public int GetLastOrdinal(string exportId, int typeId)
        {
            IQueryable<ReportExportForm> reportExportForms = GetByExport(exportId).Where(x => x.TypeId == typeId);
            if (reportExportForms.Count() == 0) return 1;
            return reportExportForms.Max(x => x.Ordinal) + 1;
        }

        public bool Any(string id) => repo.GetAll().Any(x => x.Id == id);

        public void Remove(string id) => repo.Remove(GetById(id));

        public void RemoveByForm(string formId) => repo.RemoveRange(repo.GetAll().Where(x => x.FormId == formId));

        public void RemoveRange(IEnumerable<ReportExportForm> reportExportForms) => repo.RemoveRange(reportExportForms);

        public void RemoveByExport(string exportId) => repo.RemoveRange(GetByExport(exportId));

        public void SaveChanges() => repo.SaveChanges();
    }
}
