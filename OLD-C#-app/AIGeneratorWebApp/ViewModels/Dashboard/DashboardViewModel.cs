using System.Collections.Generic;
using AIGeneratorWebApp.Models;

namespace AIGeneratorWebApp.ViewModels.Dashboard
{
    public class DashboardViewModel
    {
        public string Greeting { get; set; } = string.Empty;
        public string InfoText { get; set; } = string.Empty;
        public List<CustomerCardViewModel> Customers { get; set; } = new();
        public List<ExaminerStats> TopExaminers { get; set; } = new();
        public List<TopCustomerViewModel> TopCustomers { get; set; } = new();
    }

    public class CustomerCardViewModel
    {
        public string CustomerId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string WorkOrder { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public List<string> ActiveConstructions { get; set; } = new();
    }

    public class TopCustomerViewModel
    {
        public string CustomerId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Reports { get; set; }
    }
}
