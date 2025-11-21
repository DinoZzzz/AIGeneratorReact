using Models;
using System.Collections.Generic;
using System.Linq;

namespace Interfaces
{
    public interface IUserReportAccreditation
    {
        void Add(UserReportAccreditation userAccreditation);
        void AddRange(List<UserReportAccreditation> userAccreditations);
        void Update(List<ReportType> reportTypes, string userId);
        UserReportAccreditation GetById(string id);
        IQueryable<UserReportAccreditation> GetByUser(string userId);
        IQueryable<UserReportAccreditation> GetByAccreditation(int accreditationId);
        bool Any(int accreditationId, string userId);
        void Remove(string id);
        void RemoveByUser(string userId);
        void RemoveRange(IEnumerable<UserReportAccreditation> userAccreditations);
        void SaveChanges();
    }
}
