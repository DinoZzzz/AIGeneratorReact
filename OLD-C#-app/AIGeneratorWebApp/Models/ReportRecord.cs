using System;

namespace AIGeneratorWebApp.Models
{
    public class ReportRecord
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string CustomerId { get; set; } = string.Empty;
        public string ConstructionId { get; set; } = string.Empty;
        public string ConstructionPart { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string CertifierId { get; set; } = string.Empty;
        public int FormsCount { get; set; }
        public bool Satisfies { get; set; } = true;
        public DateTime CreationTime { get; set; } = DateTime.UtcNow;
    }
}
