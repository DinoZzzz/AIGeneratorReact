using System.Collections.Generic;

namespace AIGeneratorWebApp.ViewModels.Customers
{
    public class CustomerListViewModel
    {
        public List<CustomerRowViewModel> Items { get; set; } = new();
        public string? Search { get; set; }
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
    }

    public class CustomerRowViewModel
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string WorkOrder { get; set; } = string.Empty;
        public List<string> ActiveConstructions { get; set; } = new();
    }
}
