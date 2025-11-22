using System.ComponentModel.DataAnnotations;

namespace Models
{
    public class AuthUser
    {
        [Required]
        public string Username { get; set; } = "";
        [Required]
        public string Password { get; set; } = "";
        [Required]
        public string Email { get; set; } = "";
    }
}
