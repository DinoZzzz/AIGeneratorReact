using System;
using System.Collections.Generic;
using System.Linq;

namespace AIGeneratorWebApp.Models
{
    public class CustomerRecord
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string WorkOrder { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<CustomerConstructionRecord> Constructions { get; set; } = new();

        public IEnumerable<CustomerConstructionRecord> ActiveConstructions => Constructions.Where(x => x.IsActive);
    }
}
