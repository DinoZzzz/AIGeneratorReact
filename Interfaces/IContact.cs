using Models;
using System.Collections.Generic;
using System.Linq;

namespace Interfaces
{
    public interface IContact
    {
        void Add(Contact bugReport);
        void AddRange(List<Contact> bugReports);
        Contact GetById(string id);
        IQueryable<Contact> GetAll();
        void Remove(string id);
        void RemoveRange(IEnumerable<Contact> bugReports);
        void SaveChanges();
    }
}
