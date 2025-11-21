using System;

namespace AIGeneratorWebApp.Models
{
    public class CustomerConstructionRecord
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string CustomerId { get; set; } = string.Empty;
        public string WorkOrder { get; set; } = string.Empty;
        public string Construction { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }
}
