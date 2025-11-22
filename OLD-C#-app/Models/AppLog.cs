using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models
{
    public class AppLog
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Version { get; set; }
        public string Userid { get; set; }
        public string Message { get; set; }
        public DateTime CreationTime { get; set; } = DateTime.Now;
    }
}
