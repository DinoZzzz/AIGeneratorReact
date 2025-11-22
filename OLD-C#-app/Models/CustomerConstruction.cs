using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models
{
    public class CustomerConstruction
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string WorkOrder { get; set; }
        public string CustomerId { get; set; }
        public string Location { get; set; }
        public string Construction { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreationTime { get; set; } = DateTime.Now;
        public DateTime UpdateTime { get; set; } = DateTime.Now;

        public override string ToString()
        {
            return WorkOrder + " " + Construction;
        }
    }
}
