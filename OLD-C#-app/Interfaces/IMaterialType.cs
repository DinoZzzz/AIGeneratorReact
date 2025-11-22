using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Interfaces
{
    public interface IMaterialType
    {
        void Add(MaterialType materialType);
        void AddRange(List<MaterialType> materialTypes);
        MaterialType GetById(int id);
        IQueryable<MaterialType> GetAll();
        bool Any(int id);
        bool AnyName(string name, int id);
        void Remove(int id);
        void RemoveRange(IEnumerable<MaterialType> materialTypes);
        void SaveChanges();
    }
}
