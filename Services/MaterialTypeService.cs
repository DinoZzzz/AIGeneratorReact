using Interfaces;
using Models;
using Repositories;
using System.Collections.Generic;
using System.Linq;

namespace Services
{
    public class MaterialTypeService : IMaterialType
    {
        public MaterialTypeService(AppDbContext context) => repo = new MaterialTypeRepository(context);

        private readonly MaterialTypeRepository repo;

        public void Add(MaterialType materialType) => repo.Add(materialType);

        public void AddRange(List<MaterialType> materialTypes) => repo.AddRange(materialTypes);

        public MaterialType GetById(int id) => repo.GetById(id);

        public IQueryable<MaterialType> GetAll() => repo.GetAll();

        public bool Any(int id) => repo.GetAll().Any(x => x.Id == id);

        public bool AnyName(string name, int id) => repo.GetAll().Any(x => x.Name.ToLower() == name.ToLower() && x.Id != id);

        public void Remove(int id) => repo.Remove(GetById(id));

        public void RemoveRange(IEnumerable<MaterialType> materialTypes) => repo.RemoveRange(materialTypes);

        public void SaveChanges() => repo.SaveChanges();
    }
}
