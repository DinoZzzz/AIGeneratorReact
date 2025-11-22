using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Remoting.Metadata.W3cXsd2001;
using System.Text;
using System.Threading.Tasks;

namespace Interfaces
{
    public interface ICustomerConstruction
    {
        void Add(CustomerConstruction customerConstruction);
        void AddRange(List<CustomerConstruction> customerConstructions);
        void Update(List<CustomerConstruction> customerConstructions, string customerId);
        CustomerConstruction GetById(string id);
        IQueryable<CustomerConstruction> GetByCustomer(string customerId);
        IQueryable<CustomerConstruction> GetAll();
        CustomerConstruction GetByName(string name);
        bool Any(string id);
        bool AnyName(string name, string id);
        bool AnyWorkOrder(string workOrder, string id);
        bool IsActive(string id);
        void Remove(string id);
        void RemoveRange(IEnumerable<CustomerConstruction> customerConstructions);
        void RemoveByCustomer(string customerId);
        void SaveChanges();
    }
}
