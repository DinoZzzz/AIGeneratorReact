using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class ExaminationProcedureRepository
    {
        public ExaminationProcedureRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(ExaminationProcedure examinationProcedure) => db.ExaminationProcedures.Add(examinationProcedure);

        public void AddRange(List<ExaminationProcedure> examinationProcedures) => db.ExaminationProcedures.AddRange(examinationProcedures);

        public ExaminationProcedure GetById(int id) => db.ExaminationProcedures.SingleOrDefault(x => x.Id == id);

        public IQueryable<ExaminationProcedure> GetAll() => db.ExaminationProcedures;

        public void Remove(ExaminationProcedure examinationProcedure) => db.ExaminationProcedures.Remove(examinationProcedure);

        public void RemoveRange(IEnumerable<ExaminationProcedure> examinationProcedures) => db.ExaminationProcedures.RemoveRange(examinationProcedures);

        public void SaveChanges() => db.SaveChanges();
    }
}
