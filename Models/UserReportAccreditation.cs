using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models
{
    public class UserReportAccreditation
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; }
        public int ReportTypeId { get; set; }
        public DateTime CreationTime { get; set; } = DateTime.Now;
    }
}
