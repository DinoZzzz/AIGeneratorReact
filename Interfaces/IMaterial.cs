using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Interfaces
{
    public interface IMaterial
    {
        void Add(Material material);
        void AddRange(List<Material> materials);
        Material GetById(int id);
        IQueryable<Material> GetByType(int typeId);
        IQueryable<Material> GetAll();
        bool Any(int id);
        bool Any(Material material);
        bool AnyName(string name, int id);
        void Remove(int id);
        void RemoveRange(IEnumerable<Material> materials);
        void SaveChanges();
    }
}
