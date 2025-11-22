using System.Security.Claims;
using System.Threading.Tasks;
using AIGeneratorWebApp.Models;

namespace AIGeneratorWebApp.Services.Contracts
{
    public interface IUserService
    {
        Task<UserProfile?> AuthenticateAsync(string username, string password);
        Task<UserProfile?> GetByIdAsync(string id);
        ClaimsPrincipal CreatePrincipal(UserProfile user);
    }
}
