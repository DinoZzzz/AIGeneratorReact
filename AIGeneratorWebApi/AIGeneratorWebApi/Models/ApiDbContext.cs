using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Models;

namespace AIGeneratorWebApi.Models
{
    public class ApiDbContext : IdentityUserContext<IdentityUser>
    {
        public ApiDbContext(DbContextOptions options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            //modelBuilder.Entity<ReportFile>().ToTable(nameof(ReportFile), t => t.ExcludeFromMigrations());
            //modelBuilder.Entity<FileLog>().ToTable(nameof(FileLog), t => t.ExcludeFromMigrations());
            var hasher = new PasswordHasher<IdentityUser>();
            IdentityUser user = new IdentityUser()
            {
                Id = "87f06431-de2e-41f4-b5e5-39e114d9a5b6",
                UserName = "user",
                NormalizedUserName = "user",
                Email = "user@aigenerator.com",
                NormalizedEmail = "user@aigenerator.com",
                EmailConfirmed = false,
                SecurityStamp = string.Empty
            };
            user.PasswordHash = hasher.HashPassword(user, "V(kMG*t%yxID5emE");
            modelBuilder.Entity<IdentityUser>().HasData(user);
        }

        public DbSet<ReportFile> ReportFiles => Set<ReportFile>();
        public DbSet<FileLog> FileLogs => Set<FileLog>();
    }
}
