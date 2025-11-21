using System.Collections.Generic;
using System.Threading.Tasks;
using AIGeneratorWebApp.Models;

namespace AIGeneratorWebApp.Services.Contracts
{
    public interface ICustomerService
    {
        Task<IReadOnlyList<CustomerRecord>> GetPagedAsync(int page, int pageSize, string? searchTerm = null);
        Task<CustomerRecord?> GetByIdAsync(string id);
        Task<int> CountAsync(string? searchTerm = null);
    }
}
