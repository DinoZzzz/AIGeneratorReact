using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models
{
    public class FormsFilter
    {
        public string Stock { get; set; } = "";
        public string UserId { get; set; } = "";
        public int TypeId { get; set; } = 0;
        public DateTime StartDate { get; set; } = DateTime.Today;
        public DateTime EndDate { get; set; } = DateTime.Today;
        public bool IsActive { get; set; }
    }
}
