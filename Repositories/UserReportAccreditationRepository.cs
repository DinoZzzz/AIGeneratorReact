using Models;
using System.Collections.Generic;
using System.Linq;

namespace Repositories
{
    public class UserReportAccreditationRepository
    {
        public UserReportAccreditationRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(UserReportAccreditation userAccreditation) => db.UserAccreditations.Add(userAccreditation);

        public void AddRange(List<UserReportAccreditation> userAccreditations) => db.UserAccreditations.AddRange(userAccreditations);

        public UserReportAccreditation GetById(string id) => db.UserAccreditations.SingleOrDefault(x => x.Id == id);

        public IQueryable<UserReportAccreditation> GetAll() => db.UserAccreditations;

        public void Remove(UserReportAccreditation userAccreditation) => db.UserAccreditations.Remove(userAccreditation);

        public void RemoveRange(IEnumerable<UserReportAccreditation> userAccreditations) => db.UserAccreditations.RemoveRange(userAccreditations);

        public void SaveChanges() => db.SaveChanges();
    }
}
