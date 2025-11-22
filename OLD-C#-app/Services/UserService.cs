using Interfaces;
using Models;
using Repositories;
using System.Collections.Generic;
using System.Linq;

namespace Services
{
    public class UserService : IUser
    {
        public UserService(AppDbContext context) => repo = new UserRepository(context);

        private readonly UserRepository repo;

        public void Add(User user) => repo.Add(user);

        public void AddRange(List<User> users) => repo.AddRange(users);

        public User GetById(string id) => repo.GetById(id);

        public User GetUser(string username, string password) => repo.GetAll().SingleOrDefault(x => x.Username.ToLower() == username.ToLower() && x.Password == password);

        public IQueryable<User> GetAll() => repo.GetAll();

        public bool Any(string id) => repo.GetAll().Any(x => x.Id == id);

        public bool AnyUsername(string username, string userId) => repo.GetAll().Any(x => x.Username.ToLower() == username.ToLower() && x.Id != userId);

        public int Count() => repo.GetAll().Count();

        public void Remove(string id) => repo.Remove(GetById(id));

        public void RemoveRange(IEnumerable<User> users) => repo.RemoveRange(users);

        public void SaveChanges() => repo.SaveChanges();
    }
}
