using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class MaterialRepository
    {
        public MaterialRepository(AppDbContext context) => db = context;

        private readonly AppDbContext db;

        public void Add(Material material) => db.Materials.Add(material);

        public void AddRange(List<Material> materials) => db.Materials.AddRange(materials);

        public Material GetById(int id) => db.Materials.SingleOrDefault(x => x.Id == id);

        public IQueryable<Material> GetAll() => db.Materials;

        public void Remove(Material material) => db.Materials.Remove(material);

        public void RemoveRange(IEnumerable<Material> materials) => db.Materials.RemoveRange(materials);

        public void SaveChanges() => db.SaveChanges();
    }
}
