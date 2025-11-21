using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models
{
    public class ActionLog
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Action { get; set; }
        public string DataType { get; set; }
        public string DataId { get; set; }
        public bool Finished { get; set; }
        public DateTime CreationTime { get; set; } = DateTime.Now;
    }
}
