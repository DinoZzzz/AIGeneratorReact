using AIGeneratorWebApi.Models;
using Microsoft.AspNetCore.Identity;
using Models;

namespace AIGeneratorWebApi.Interfaces
{
    public interface IJwtService
    {
        AuthResponse CreateToken(IdentityUser user);
    }
}
