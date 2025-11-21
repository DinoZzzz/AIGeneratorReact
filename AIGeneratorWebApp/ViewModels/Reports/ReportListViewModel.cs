using System.Collections.Generic;

namespace AIGeneratorWebApp.ViewModels.Reports
{
    public class ReportListViewModel
    {
        public string CustomerName { get; set; } = string.Empty;
        public string ConstructionName { get; set; } = string.Empty;
        public string ConstructionId { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string? Search { get; set; }
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public List<ReportRowViewModel> Reports { get; set; } = new();
    }

    public class ReportRowViewModel
    {
        public string Id { get; set; } = string.Empty;
        public string ConstructionPart { get; set; } = string.Empty;
        public string CreatedBy { get; set; } = string.Empty;
        public string Certifier { get; set; } = string.Empty;
        public int FormsCount { get; set; }
        public bool Satisfies { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
    }
}
