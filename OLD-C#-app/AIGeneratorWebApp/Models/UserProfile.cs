using System;

namespace AIGeneratorWebApp.Models
{
    public class UserProfile
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public bool IsAdmin { get; set; }
        public bool IsDarkMode { get; set; }

        public string DisplayName => $"{FirstName} {LastName}".Trim();
    }
}
