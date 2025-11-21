using Models;
using System.Collections.Generic;
using System.Linq;

namespace Interfaces
{
    public interface ICustomer
    {
        void Add(Customer customer);
        void AddRange(List<Customer> customers);
        Customer GetById(string id);
        Customer GetByName(string name);
        IQueryable<Customer> GetAll();
        bool Any(string id);
        bool AnyWorkOrder(string workOrder, string id);
        bool AnyName(string name, string id);
        int Count();
        void Remove(string id);
        void RemoveRange(IEnumerable<Customer> customers);
        void SaveChanges();
    }
}
