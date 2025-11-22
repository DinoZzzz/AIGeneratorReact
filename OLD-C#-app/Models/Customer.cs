using System;
using System.CodeDom;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    public class Customer
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; }
        public string Address { get; set; }
        public string Location { get; set; }
        public string WorkOrder { get; set; }
        public string PostalCode { get; set; }
        public DateTime CreationTime { get; set; } = DateTime.Now;
        public DateTime UpdateTime { get; set; } = DateTime.Now;
        [NotMapped]
        public List<CustomerConstruction> CustomerConstructions { get; set; } = new List<CustomerConstruction>();
    }
}
