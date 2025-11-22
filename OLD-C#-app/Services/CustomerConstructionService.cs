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
    public class CustomerConstructionService : ICustomerConstruction
    {
        public CustomerConstructionService(AppDbContext context) => repo = new CustomerConstructionRepository(context);

        private readonly CustomerConstructionRepository repo;

        public void Add(CustomerConstruction customerConstruction) => repo.Add(customerConstruction);

        public void AddRange(List<CustomerConstruction> customerConstructions) => repo.AddRange(customerConstructions);

        public void Update(List<CustomerConstruction> customerConstructions, string customerId)
        {
            DateTime now = DateTime.Now;
            foreach(CustomerConstruction customerConstruction in GetByCustomer(customerId))
            {
                if (customerConstructions.Any(x => x.Id == customerConstruction.Id))
                {
                    CustomerConstruction c = customerConstructions.SingleOrDefault(x => x.Id == customerConstruction.Id);
                    customerConstruction.Construction = c.Construction;
                    customerConstruction.Location = c.Location;
                    customerConstruction.UpdateTime = now;
                    customerConstructions.Remove(c);
                }
                else Remove(customerConstruction.Id);
            }
            foreach(CustomerConstruction customerConstruction in customerConstructions)
            {
                customerConstruction.CreationTime = customerConstruction.UpdateTime = now;
                Add(customerConstruction);
            }
        }

        public CustomerConstruction GetById(string id) => repo.GetById(id);

        public CustomerConstruction GetByName(string name) => repo.GetAll().FirstOrDefault(x => x.Construction.ToLower() == name.ToLower());

        public IQueryable<CustomerConstruction> GetByCustomer(string customerId) => repo.GetAll().Where(x => x.CustomerId == customerId);
        
        public IQueryable<CustomerConstruction> GetAll() => repo.GetAll();

        public bool Any(string id) => repo.GetAll().Any(x => x.Id == id);

        public bool AnyName(string name, string id) => repo.GetAll().Any(x => x.Construction.ToLower() == name.ToLower() && x.Id != id);

        public bool AnyWorkOrder(string workOrder, string id) => repo.GetAll().Any(x => x.WorkOrder.ToLower() == workOrder.ToLower() && x.Id != id);

        public bool IsActive(string id) => GetById(id).IsActive;

        public void Remove(string id) => repo.Remove(GetById(id));

        public void RemoveRange(IEnumerable<CustomerConstruction> customerConstructions) => repo.RemoveRange(customerConstructions);

        public void RemoveByCustomer(string customerId) => repo.RemoveRange(GetByCustomer(customerId));

        public void SaveChanges() => repo.SaveChanges();
    }
}
