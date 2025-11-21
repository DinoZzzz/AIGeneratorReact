using Models;
using System.Collections.Generic;
using System.Linq;

namespace Interfaces
{
    public interface IUser
    {
        void Add(User user);
        void AddRange(List<User> users);
        User GetById(string id);
        User GetUser(string username, string password);
        IQueryable<User> GetAll();
        bool Any(string id);
        bool AnyUsername(string username, string userId);
        int Count();
        void Remove(string id);
        void RemoveRange(IEnumerable<User> users);
        void SaveChanges();
    }
}
