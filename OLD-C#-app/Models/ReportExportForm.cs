using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models
{
    public class ReportExportForm
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public int TypeId { get; set; }
        public string FormId { get; set; }
        [NotMapped]
        public ReportForm ReportForm { get; set; }
        public string ExportId { get; set; }
        public int Ordinal { get; set; }
        public DateTime CreationTime { get; set; }
        public DateTime UpdateTime { get; set; }
    }
}
