using AIGeneratorWebApi.Models;
using Models;

namespace AIGeneratorWebApi.Repositories
{
    public class FileLogRepository
    {
        public FileLogRepository(ApiDbContext context) => db = context;

        private readonly ApiDbContext db;

        public async Task Add(FileLog log) => await db.AddAsync(log);

        public IQueryable<FileLog> GetAll() => db.FileLogs;

        public async Task SaveChanges() => await db.SaveChangesAsync();
    }
}
