using Models;
using Interfaces;
using Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services
{
    public class CustomerService : ICustomer
    {
        public CustomerService(AppDbContext context) => repo = new CustomerRepository(context);

        private readonly CustomerRepository repo;

        public void Add(Customer customer) => repo.Add(customer);

        public void AddRange(List<Customer> customers) => repo.AddRange(customers);

        public Customer GetById(string id) => repo.GetById(id);

        public Customer GetByName(string name) => repo.GetAll().SingleOrDefault(x => x.Name.ToLower() == name.ToLower());

        public IQueryable<Customer> GetAll() => repo.GetAll();

        public bool Any(string id) => repo.GetAll().Any(x => x.Id == id);

        public bool AnyWorkOrder(string workOrder, string id) => repo.GetAll().Any(x => x.WorkOrder == workOrder && x.Id != id);

        public bool AnyName(string name, string id) => repo.GetAll().Any(x => x.Name.ToLower() == name.ToLower() && x.Id != id);

        public int Count() => repo.GetAll().Count();

        public void Remove(string id) => repo.Remove(GetById(id));

        public void RemoveRange(IEnumerable<Customer> customers) => repo.RemoveRange(customers);

        public void SaveChanges() => repo.SaveChanges();
    }
}
