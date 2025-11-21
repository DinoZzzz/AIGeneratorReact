using AIGeneratorWebApi.Interfaces;
using Models;
using AIGeneratorWebApi.Repositories;
using AIGeneratorWebApi.Models;

namespace AIGeneratorWebApi.Services
{
    public class FileLogService : IFileLog
    {
        public FileLogService(ApiDbContext context) => repo = new(context);

        private readonly FileLogRepository repo;

        public async Task Add(FileLog log) => await repo.Add(log);

        public IQueryable<FileLog> GetAll() => repo.GetAll();

        public async Task SaveChanges() => await repo.SaveChanges();
    }
}
