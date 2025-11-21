using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Interfaces
{
    public interface IAppLog
    {
        void AddAndSave(AppLog appLog);
        void SaveChanges();
    }
}
