using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class CustomerConstructionRepository
    {
        public CustomerConstructionRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(CustomerConstruction customerConstruction) => db.CustomerConstructions.Add(customerConstruction);

        public void AddRange(List<CustomerConstruction> customerConstructions) => db.CustomerConstructions.AddRange(customerConstructions);

        public CustomerConstruction GetById(string id) => db.CustomerConstructions.SingleOrDefault(x => x.Id == id);

        public IQueryable<CustomerConstruction> GetAll() => db.CustomerConstructions;

        public void Remove(CustomerConstruction customerConstruction) => db.CustomerConstructions.Remove(customerConstruction);

        public void RemoveRange(IEnumerable<CustomerConstruction> customerConstructions) => db.CustomerConstructions.RemoveRange(customerConstructions);

        public void SaveChanges() => db.SaveChanges();
    }
}
