using System.Collections.Generic;
using System.Threading.Tasks;
using AIGeneratorWebApp.Models;

namespace AIGeneratorWebApp.Services.Contracts
{
    public interface IReportService
    {
        Task<IReadOnlyList<ReportRecord>> GetByConstructionAsync(string constructionId, int page, int pageSize, string? search = null);
        Task<int> CountByConstructionAsync(string constructionId, string? search = null);
        Task<IReadOnlyList<ExaminerStats>> GetTopExaminersAsync(int top = 3);
        Task<IReadOnlyList<(CustomerRecord customer, int reports)>> GetTopCustomersAsync(int top = 3);
    }
}
