using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class ReportFileRepository
    {
        public ReportFileRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(ReportFile reportFile) => db.ReportFiles.Add(reportFile);

        public IQueryable<ReportFile> GetAll() => db.ReportFiles;

        public void Remove(ReportFile reportFile) => db.ReportFiles.Remove(reportFile);

        public void SaveChanges() => db.SaveChanges();

        public async Task SaveChangesAsync() => await db.SaveChangesAsync();
    }
}
