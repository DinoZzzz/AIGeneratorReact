using System.Collections.Generic;

namespace AIGeneratorWebApp.ViewModels.Customers
{
    public class CustomerDetailsViewModel
    {
        public string CustomerId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string WorkOrder { get; set; } = string.Empty;
        public List<ConstructionRowViewModel> Constructions { get; set; } = new();
    }

    public class ConstructionRowViewModel
    {
        public string Id { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}
