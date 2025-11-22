using Interfaces;
using Models;
using Repositories;
using System.Collections.Generic;
using System.Linq;

namespace Services
{
    public class MaterialService : IMaterial
    {
        public MaterialService(AppDbContext context) => repo = new MaterialRepository(context);

        private readonly MaterialRepository repo;

        public void Add(Material material) => repo.Add(material);

        public void AddRange(List<Material> materials) => repo.AddRange(materials);

        public Material GetById(int id) => repo.GetById(id);

        public IQueryable<Material> GetByType(int typeId) => repo.GetAll().Where(x => x.TypeId == typeId);
        
        public IQueryable<Material> GetAll() => repo.GetAll();

        public bool Any(int id) => repo.GetAll().Any(x => x.Id == id);

        public bool Any(Material material) => repo.GetAll().Any(x => x.Id != material.Id && x.Name.ToLower() == material.Name.ToLower() && x.TypeId == material.TypeId);

        public bool AnyName(string name, int id) => repo.GetAll().Any(x => x.Name.ToLower() == name.ToLower() && x.Id != id);

        public void Remove(int id) => repo.Remove(GetById(id));

        public void RemoveRange(IEnumerable<Material> materials) => repo.RemoveRange(materials);

        public void SaveChanges() => repo.SaveChanges();
    }
}
