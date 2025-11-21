using System;

namespace Models
{
    public class FileLog
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = "";
        public string ReportId { get; set; } = "";
        public DateTime CreationTime { get; set; } = DateTime.Now;
    }
}
