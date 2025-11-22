using System.Collections.Generic;
using AIGeneratorWebApp.Models;

namespace AIGeneratorWebApp.Services.Contracts
{
    public interface IMenuStateService
    {
        IReadOnlyList<MenuItem> GetMenu();
    }
}
