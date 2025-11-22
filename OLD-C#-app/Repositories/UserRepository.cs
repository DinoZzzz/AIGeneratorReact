using Models;
using System.Collections.Generic;
using System.Linq;

namespace Repositories
{
    public class UserRepository
    {
        public UserRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(User user) => db.Users.Add(user);

        public void AddRange(List<User> users) => db.Users.AddRange(users);

        public User GetById(string id) => db.Users.SingleOrDefault(x => x.Id == id);

        public IQueryable<User> GetAll() => db.Users;

        public void Remove(User user) => db.Users.Remove(user);

        public void RemoveRange(IEnumerable<User> users) => db.Users.RemoveRange(users);

        public void SaveChanges() => db.SaveChanges();
    }
}
