using Models;
using System.Collections.Generic;
using System.Linq;

namespace Repositories
{
    public class MaterialTypeRepository
    {
        public MaterialTypeRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(MaterialType materialType) => db.MaterialTypes.Add(materialType);

        public void AddRange(List<MaterialType> materialTypes) => db.MaterialTypes.AddRange(materialTypes);

        public MaterialType GetById(int id) => db.MaterialTypes.SingleOrDefault(x => x.Id == id);

        public IQueryable<MaterialType> GetAll() => db.MaterialTypes;

        public void Remove(MaterialType materialType) => db.MaterialTypes.Remove(materialType);

        public void RemoveRange(IEnumerable<MaterialType> materialTypes) => db.MaterialTypes.RemoveRange(materialTypes);

        public void SaveChanges() => db.SaveChanges();
    }
}
