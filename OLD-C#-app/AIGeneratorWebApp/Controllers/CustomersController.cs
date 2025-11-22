using System;
using System.Linq;
using System.Threading.Tasks;
using AIGeneratorWebApp.Services.Contracts;
using AIGeneratorWebApp.ViewModels.Customers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIGeneratorWebApp.Controllers
{
    [Authorize]
    public class CustomersController : Controller
    {
        private readonly ICustomerService customerService;

        public CustomersController(ICustomerService customerService)
        {
            this.customerService = customerService;
        }

        public async Task<IActionResult> Index(int page = 0, string? search = null)
        {
            const int pageSize = 10;
            var customers = await customerService.GetPagedAsync(page, pageSize, search);
            var totalCount = await customerService.CountAsync(search);

            var viewModel = new CustomerListViewModel
            {
                Search = search,
                CurrentPage = page,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Items = customers.Select(c => new CustomerRowViewModel
                {
                    Id = c.Id,
                    Name = c.Name,
                    Location = c.Location,
                    WorkOrder = c.WorkOrder,
                    ActiveConstructions = c.ActiveConstructions
                        .OrderBy(x => x.Construction)
                        .Select(x => $"{x.WorkOrder} – {x.Construction}")
                        .ToList()
                }).ToList()
            };

            return View(viewModel);
        }

        public async Task<IActionResult> Details(string id)
        {
            var customer = await customerService.GetByIdAsync(id);
            if (customer == null)
            {
                return NotFound();
            }

            var viewModel = new CustomerDetailsViewModel
            {
                CustomerId = customer.Id,
                Name = customer.Name,
                Location = customer.Location,
                WorkOrder = customer.WorkOrder,
                Constructions = customer.Constructions
                    .OrderByDescending(x => x.IsActive)
                    .Select(x => new ConstructionRowViewModel
                    {
                        Id = x.Id,
                        Label = $"{x.WorkOrder} – {x.Construction}",
                        IsActive = x.IsActive
                    }).ToList()
            };

            return View(viewModel);
        }
    }
}
