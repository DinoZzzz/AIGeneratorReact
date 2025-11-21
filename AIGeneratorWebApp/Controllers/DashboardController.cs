using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AIGeneratorWebApp.Services.Contracts;
using AIGeneratorWebApp.ViewModels.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIGeneratorWebApp.Controllers
{
    [Authorize]
    public class DashboardController : Controller
    {
        private readonly ICustomerService customerService;
        private readonly IReportService reportService;
        private readonly IUserService userService;

        public DashboardController(ICustomerService customerService, IReportService reportService, IUserService userService)
        {
            this.customerService = customerService;
            this.reportService = reportService;
            this.userService = userService;
        }

        public async Task<IActionResult> Index(int page = 0, string? search = null)
        {
            const int pageSize = 6;
            var customers = await customerService.GetPagedAsync(page, pageSize, search);
            var totalCount = await customerService.CountAsync(search);
            var currentUser = await userService.GetByIdAsync(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty);

            var viewModel = new DashboardViewModel
            {
                Greeting = currentUser == null
                    ? "Welcome back!"
                    : $"Welcome back, {currentUser.FirstName}!",
                InfoText = "Pregled najnovijih naručitelja i ispitivanja.",
                Customers = customers.Select(c => new CustomerCardViewModel
                {
                    CustomerId = c.Id,
                    Name = c.Name,
                    Location = c.Location,
                    WorkOrder = c.WorkOrder,
                    ActiveConstructions = c.ActiveConstructions
                        .OrderBy(x => x.Construction)
                        .Select(x => $"{x.WorkOrder} – {x.Construction}")
                        .ToList()
                }).ToList(),
                TopCustomers = (await reportService.GetTopCustomersAsync()).Select(x => new TopCustomerViewModel
                {
                    CustomerId = x.customer.Id,
                    Name = x.customer.Name,
                    Reports = x.reports
                }).ToList(),
                TopExaminers = (await reportService.GetTopExaminersAsync()).ToList()
            };

            ViewBag.Search = search;
            ViewBag.TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
            ViewBag.Page = page;

            return View(viewModel);
        }
    }
}
