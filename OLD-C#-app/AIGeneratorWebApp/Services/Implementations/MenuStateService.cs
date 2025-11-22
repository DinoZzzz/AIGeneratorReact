using System.Collections.Generic;
using AIGeneratorWebApp.Models;
using AIGeneratorWebApp.Services.Contracts;

namespace AIGeneratorWebApp.Services.Implementations
{
    public class MenuStateService : IMenuStateService
    {
        private static readonly IReadOnlyList<MenuItem> items = new List<MenuItem>
        {
            new() { DisplayName = "Dashboard", Controller = "Dashboard", Action = "Index", Icon = "bi-speedometer" },
            new() { DisplayName = "Customers", Controller = "Customers", Action = "Index", Icon = "bi-people" }
        };

        public IReadOnlyList<MenuItem> GetMenu() => items;
    }
}
