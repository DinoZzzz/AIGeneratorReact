using Interfaces;
using Models;
using Repositories;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Services
{
    public class UserReportAccreditationService : IUserReportAccreditation
    {
        public UserReportAccreditationService(AppDbContext context) => repo = new UserReportAccreditationRepository(context);

        private readonly UserReportAccreditationRepository repo;

        public void Add(UserReportAccreditation userAccreditation) => repo.Add(userAccreditation);

        public void AddRange(List<UserReportAccreditation> userAccreditations) => repo.AddRange(userAccreditations);

        public void Update(List<ReportType> reportTypes, string userId)
        {
            DateTime now = DateTime.Now;
            foreach (UserReportAccreditation userAccreditation in GetByUser(userId))
            {
                if (!reportTypes.Any(x => x.Id == userAccreditation.ReportTypeId)) repo.Remove(userAccreditation);
                else reportTypes.Remove(reportTypes.SingleOrDefault(x => x.Id == userAccreditation.ReportTypeId));
            }
            foreach (ReportType reportType in reportTypes)
            {
                Add(new UserReportAccreditation
                {
                    UserId = userId,
                    ReportTypeId = reportType.Id,
                    CreationTime = now
                });
            }
        }

        public UserReportAccreditation GetById(string id) => repo.GetById(id);

        public IQueryable<UserReportAccreditation> GetByUser(string userId) => repo.GetAll().Where(x => x.UserId == userId);

        public IQueryable<UserReportAccreditation> GetByAccreditation(int accreditationId) => repo.GetAll().Where(x => x.ReportTypeId == accreditationId);

        public bool Any(int accreditationId, string userId) => repo.GetAll().Any(x => x.UserId == userId && x.ReportTypeId == accreditationId);

        public void Remove(string id) => repo.Remove(GetById(id));

        public void RemoveByUser(string userId) => repo.RemoveRange(GetByUser(userId));

        public void RemoveRange(IEnumerable<UserReportAccreditation> userAccreditations) => repo.RemoveRange(userAccreditations);

        public void SaveChanges() => repo.SaveChanges();
    }
}
