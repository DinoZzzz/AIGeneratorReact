using Microsoft.SqlServer.Server;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    public class ReportFile
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ReportExportId { get; set; } = "";
        public string PdfId { get; set; } = "";
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public int Ordinal { get; set; }
        public bool IsImage { get; set; }
        public string Path { get; set; } = "";
        public string Thumbnail { get; set; } = "";
        public string Extension { get; set; } = "";
        [NotMapped]
        public string Bytes { get; set; } = "";
        [NotMapped]
        public bool IsLocal { get; set; } = false;
        public DateTime CreationTime { get; set; } = DateTime.Now;
        public DateTime UpdateTime { get; set; } = DateTime.Now;
    }
}