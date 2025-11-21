using Interfaces;
using Models;
using Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services
{
    public class AppLogService : IAppLog
    {
        public AppLogService(AppDbContext context) => repo = new AppLogRepository(context);

        private readonly AppLogRepository repo;

        public void AddAndSave(AppLog appLog)
        {
            try 
            { 
                repo.Add(appLog);
                repo.SaveChanges();
            }
            catch { }
        }

        public void SaveChanges() => repo.SaveChanges();
    }
}
