using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models
{
    public class Contact
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Description { get; set; }
        public string ApplicationPart { get; set; }
        public DateTime CreationTime { get; set; } = DateTime.Now;
        public string Version { get; set; }
        public bool Fixed { get; set; }
    }
}
