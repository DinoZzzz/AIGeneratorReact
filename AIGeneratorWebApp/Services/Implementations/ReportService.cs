using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AIGeneratorWebApp.Models;
using AIGeneratorWebApp.Services.Contracts;

namespace AIGeneratorWebApp.Services.Implementations
{
    public class ReportService : IReportService
    {
        private readonly IReadOnlyList<ReportRecord> reports;
        private readonly IReadOnlyList<CustomerRecord> customers;
        private readonly IReadOnlyList<UserProfile> users;

        public ReportService(ISeedDataProvider seedDataProvider)
        {
            reports = seedDataProvider.Reports;
            customers = seedDataProvider.Customers;
            users = seedDataProvider.Users;
        }

        public Task<IReadOnlyList<ReportRecord>> GetByConstructionAsync(string constructionId, int page, int pageSize, string? search = null)
        {
            var query = FilterReports(constructionId, search);
            var data = query.Skip(page * pageSize).Take(pageSize).ToList();
            return Task.FromResult<IReadOnlyList<ReportRecord>>(data);
        }

        public Task<int> CountByConstructionAsync(string constructionId, string? search = null)
        {
            var query = FilterReports(constructionId, search);
            return Task.FromResult(query.Count());
        }

        public Task<IReadOnlyList<ExaminerStats>> GetTopExaminersAsync(int top = 3)
        {
            var stats = reports
                .GroupBy(x => x.UserId)
                .OrderByDescending(g => g.Count())
                .Take(top)
                .Select(g => new ExaminerStats
                {
                    UserId = g.Key,
                    DisplayName = users.SingleOrDefault(u => u.Id == g.Key)?.DisplayName ?? "Unknown",
                    ReportsCreated = g.Count()
                })
                .ToList();
            return Task.FromResult<IReadOnlyList<ExaminerStats>>(stats);
        }

        public Task<IReadOnlyList<(CustomerRecord customer, int reports)>> GetTopCustomersAsync(int top = 3)
        {
            var stats = reports
                .GroupBy(x => x.CustomerId)
                .OrderByDescending(g => g.Count())
                .Take(top)
                .Select(g => (customer: customers.Single(c => c.Id == g.Key), reports: g.Count()))
                .ToList();
            return Task.FromResult<IReadOnlyList<(CustomerRecord customer, int reports)>>(stats);
        }

        private IQueryable<ReportRecord> FilterReports(string constructionId, string? search)
        {
            var query = reports.Where(x => x.ConstructionId == constructionId).AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLowerInvariant();
                query = query.Where(x => x.ConstructionPart.ToLower().Contains(search));
            }
            return query.OrderByDescending(x => x.CreationTime);
        }
    }
}
