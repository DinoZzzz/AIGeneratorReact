using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class ContactRepository
    {
        public ContactRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(Contact bugReport) => db.BugReports.Add(bugReport);

        public void AddRange(List<Contact> bugReports) => db.BugReports.AddRange(bugReports);

        public Contact GetById(string id) => db.BugReports.SingleOrDefault(x => x.Id == id);

        public IQueryable<Contact> GetAll() => db.BugReports;

        public void Remove(Contact bugReport) => db.BugReports.Remove(bugReport);

        public void RemoveRange(IEnumerable<Contact> bugReports) => db.BugReports.RemoveRange(bugReports);

        public void SaveChanges() => db.SaveChanges();
    }
}
