using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(string connectionString) : base(connectionString) { }

        public AppDbContext() { }

        public DbSet<AppLog> AppLogs { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Contact> BugReports { get; set; }
        public DbSet<UserReportAccreditation> UserAccreditations { get; set; }
        public DbSet<ReportForm> ReportForms { get; set; }
        public DbSet<ReportExport> ReportExports { get; set; }
        public DbSet<ReportFormType> ReportFormTypes { get; set; }
        public DbSet<ReportDraft> ReportDrafts { get; set; }
        public DbSet<Material> Materials { get; set; }
        public DbSet<MaterialType> MaterialTypes { get; set; }
        public DbSet<CustomerConstruction> CustomerConstructions { get; set; }
        public DbSet<ReportExportForm> ReportExportForms { get; set; }
        public DbSet<ReportFile> ReportFiles { get; set; }
        public DbSet<ExaminationProcedure> ExaminationProcedures { get; set; }
        public DbSet<FileLog> FileLogs { get; set; }
        public DbSet<ReportType> ReportTypes { get; set; }
    }
}
