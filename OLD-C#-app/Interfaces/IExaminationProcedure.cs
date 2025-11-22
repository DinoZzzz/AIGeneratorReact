using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Interfaces
{
    public interface IExaminationProcedure
    {
        void Add(ExaminationProcedure examinationProcedure);
        void AddRange(List<ExaminationProcedure> examinationProcedures);
        ExaminationProcedure GetById(int id);
        IQueryable<ExaminationProcedure> GetAll();
        bool Any(int id);
        void Remove(ExaminationProcedure examinationProcedure);
        void RemoveRange(IEnumerable<ExaminationProcedure> examinationProcedures);
        void SaveChanges();
    }
}
