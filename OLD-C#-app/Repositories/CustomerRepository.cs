using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class CustomerRepository
    {
        public CustomerRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(Customer customer) => db.Customers.Add(customer);

        public void AddRange(List<Customer> customers) => db.Customers.AddRange(customers);

        public Customer GetById(string id) => db.Customers.SingleOrDefault(x => x.Id == id);

        public IQueryable<Customer> GetAll() => db.Customers;

        public void Remove(Customer customer) => db.Customers.Remove(customer);

        public void RemoveRange(IEnumerable<Customer> customers) => db.Customers.RemoveRange(customers);

        public void SaveChanges() => db.SaveChanges();
    }
}
