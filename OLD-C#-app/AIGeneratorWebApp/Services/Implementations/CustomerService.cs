using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AIGeneratorWebApp.Models;
using AIGeneratorWebApp.Services.Contracts;

namespace AIGeneratorWebApp.Services.Implementations
{
    public class CustomerService : ICustomerService
    {
        private readonly IReadOnlyList<CustomerRecord> customers;

        public CustomerService(ISeedDataProvider seedDataProvider)
        {
            customers = seedDataProvider.Customers;
        }

        public Task<IReadOnlyList<CustomerRecord>> GetPagedAsync(int page, int pageSize, string? searchTerm = null)
        {
            var query = ApplySearch(customers.AsQueryable(), searchTerm);
            var result = query
                .Skip(page * pageSize)
                .Take(pageSize)
                .ToList();
            return Task.FromResult<IReadOnlyList<CustomerRecord>>(result);
        }

        public Task<CustomerRecord?> GetByIdAsync(string id)
        {
            var customer = customers.SingleOrDefault(x => x.Id == id);
            return Task.FromResult(customer);
        }

        public Task<int> CountAsync(string? searchTerm = null)
        {
            var query = ApplySearch(customers.AsQueryable(), searchTerm);
            return Task.FromResult(query.Count());
        }

        private static IQueryable<CustomerRecord> ApplySearch(IQueryable<CustomerRecord> query, string? search)
        {
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLowerInvariant();
                query = query.Where(x =>
                    x.Name.ToLower().Contains(search) ||
                    x.Location.ToLower().Contains(search) ||
                    x.WorkOrder.ToLower().Contains(search));
            }
            return query.OrderBy(x => x.Name);
        }
    }
}
