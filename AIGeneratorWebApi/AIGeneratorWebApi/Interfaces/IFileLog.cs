using Models;

namespace AIGeneratorWebApi.Interfaces
{
    public interface IFileLog
    {
        Task Add(FileLog log);
        IQueryable<FileLog> GetAll();
        Task SaveChanges();
    }
}
