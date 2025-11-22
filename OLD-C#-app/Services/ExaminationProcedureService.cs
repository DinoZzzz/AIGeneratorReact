using Interfaces;
using Models;
using Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services
{
    public class ExaminationProcedureService : IExaminationProcedure
    {
        public ExaminationProcedureService(AppDbContext context) => repo = new ExaminationProcedureRepository(context);

        private readonly ExaminationProcedureRepository repo;

        public void Add(ExaminationProcedure examinationProcedure) => repo.Add(examinationProcedure);

        public void AddRange(List<ExaminationProcedure> examinationProcedures) => repo.AddRange(examinationProcedures);

        public ExaminationProcedure GetById(int id) => repo.GetById(id);

        public IQueryable<ExaminationProcedure> GetAll() => repo.GetAll();

        public bool Any(int id) => repo.GetAll().Any(x => x.Id == id);

        public void Remove(ExaminationProcedure examinationProcedure) => repo.Remove(examinationProcedure);

        public void RemoveRange(IEnumerable<ExaminationProcedure> examinationProcedures) => repo.RemoveRange(examinationProcedures);

        public void SaveChanges() => repo.SaveChanges();
    }
}
