using Models;
using Interfaces;
using Repositories;
using System.Collections.Generic;
using System.Linq;

namespace Services
{
    public class ContactService : IContact
    {
        public ContactService(AppDbContext context) => repo = new ContactRepository(context);

        private readonly ContactRepository repo;

        public void Add(Contact bugReport) => repo.Add(bugReport);

        public void AddRange(List<Contact> bugReports) => repo.AddRange(bugReports);

        public Contact GetById(string id) => repo.GetById(id);

        public IQueryable<Contact> GetAll() => repo.GetAll();

        public void Remove(string id) => repo.Remove(GetById(id));

        public void RemoveRange(IEnumerable<Contact> bugReports) => repo.RemoveRange(bugReports);

        public void SaveChanges() => repo.SaveChanges();
    }
}
