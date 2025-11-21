using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using AIGeneratorWebApp.Models;
using AIGeneratorWebApp.Services.Contracts;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Linq;

namespace AIGeneratorWebApp.Services.Implementations
{
    public class InMemoryUserService : IUserService
    {
        private readonly IReadOnlyList<UserProfile> users;

        public InMemoryUserService(ISeedDataProvider seedDataProvider)
        {
            users = seedDataProvider.Users;
        }

        public Task<UserProfile?> AuthenticateAsync(string username, string password)
        {
            var user = users.SingleOrDefault(u =>
                u.Username.Equals(username, StringComparison.OrdinalIgnoreCase) &&
                u.Password == password);
            return Task.FromResult(user);
        }

        public Task<UserProfile?> GetByIdAsync(string id)
        {
            var user = users.SingleOrDefault(u => u.Id == id);
            return Task.FromResult(user);
        }

        public ClaimsPrincipal CreatePrincipal(UserProfile user)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id),
                new(ClaimTypes.Name, user.DisplayName),
                new("username", user.Username),
                new("isDarkMode", user.IsDarkMode.ToString().ToLowerInvariant()),
                new(ClaimTypes.Role, user.IsAdmin ? "Admin" : "User")
            };
            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            return new ClaimsPrincipal(identity);
        }
    }
}
