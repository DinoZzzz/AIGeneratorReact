using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AIGeneratorWebApp.Services.Contracts;
using AIGeneratorWebApp.ViewModels.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIGeneratorWebApp.Controllers
{
    [Authorize]
    public class ReportsController : Controller
    {
        private readonly IReportService reportService;
        private readonly ICustomerService customerService;
        private readonly IUserService userService;

        public ReportsController(IReportService reportService, ICustomerService customerService, IUserService userService)
        {
            this.reportService = reportService;
            this.customerService = customerService;
            this.userService = userService;
        }

        public async Task<IActionResult> Index(string customerId, string constructionId, int page = 0, string? search = null)
        {
            if (string.IsNullOrWhiteSpace(customerId) || string.IsNullOrWhiteSpace(constructionId))
            {
                return NotFound();
            }

            var customer = await customerService.GetByIdAsync(customerId);
            var construction = customer?.Constructions.SingleOrDefault(x => x.Id == constructionId);

            if (customer == null || construction == null)
            {
                return NotFound();
            }

            const int pageSize = 15;
            var reports = await reportService.GetByConstructionAsync(constructionId, page, pageSize, search);
            var total = await reportService.CountByConstructionAsync(constructionId, search);

            var viewModel = new ReportListViewModel
            {
                CustomerId = customer.Id,
                ConstructionId = construction.Id,
                CustomerName = customer.Name,
                ConstructionName = construction.Construction,
                Search = search,
                CurrentPage = page,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize),
                Reports = new List<ReportRowViewModel>()
            };

            foreach (var report in reports)
            {
                var createdBy = await userService.GetByIdAsync(report.UserId) ?? new Models.UserProfile { FirstName = "Unknown" };
                var certifier = await userService.GetByIdAsync(report.CertifierId) ?? new Models.UserProfile { FirstName = "Unknown" };
                viewModel.Reports.Add(new ReportRowViewModel
                {
                    Id = report.Id,
                    ConstructionPart = report.ConstructionPart,
                    CreatedBy = createdBy.DisplayName,
                    Certifier = certifier.DisplayName,
                    FormsCount = report.FormsCount,
                    Satisfies = report.Satisfies,
                    CreatedAt = report.CreationTime.ToString("dd.MM.yyyy.")
                });
            }

            return View(viewModel);
        }
    }
}
