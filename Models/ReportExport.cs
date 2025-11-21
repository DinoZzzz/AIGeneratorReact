using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models
{
    public class ReportExport
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public int TypeId { get; set; }
        public string ConstructionId { get; set; }
        public string CustomerId { get; set; }
        public string CertifierId { get; set; } = "";
        public string UserId { get; set; }
        public string Drainage { get; set; }
        public string WaterRemark { get; set; }
        public string WaterDeviation { get; set; }
        public string AirRemark { get; set; }
        public string AirDeviation { get; set; }
        public bool IsFinished { get; set; }
        public DateTime CertificationTime { get; set; } = DateTime.Today;
        public DateTime ExaminationDate { get; set; } = DateTime.Today;
        public string ConstructionPart { get; set; } = "";
        public DateTime CreationTime { get; set; } = DateTime.Now;
        public DateTime UpdateTime { get; set; } = DateTime.Now;
        [NotMapped]
        public List<ReportFile> ReportFiles { get; set; } = new List<ReportFile>();
    }
}
