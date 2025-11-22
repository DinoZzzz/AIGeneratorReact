using AIGeneratorWebApi.Models;
using Models;

namespace AIGeneratorWebApi.Repositories
{
    public class ReportFileRepository
    {
        public ReportFileRepository(ApiDbContext context) => db = context;

        private readonly ApiDbContext db;

        public async Task Add(ReportFile reportFile) => await db.ReportFiles.AddAsync(reportFile);

        public IQueryable<ReportFile> GetAll() => db.ReportFiles;

        public void Remove(ReportFile reportFile) => db.ReportFiles.Remove(reportFile);

        public async Task SaveChanges() => await db.SaveChangesAsync();
    }
}
