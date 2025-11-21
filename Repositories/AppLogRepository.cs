using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class AppLogRepository
    {
        public AppLogRepository(AppDbContext context) => db = context;
        
        private readonly AppDbContext db;

        public void Add(AppLog appLog) => db.AppLogs.Add(appLog);

        public void SaveChanges() => db.SaveChanges();
    }
}
