using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    public class User
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; }
        public string LastName { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string Title { get; set; } = "";
        public bool IsAdmin { get; set; }
        public bool IsDarkMode { get; set; }
        public string Version { get; set; } = "";
        [NotMapped]
        public string Token { get; set; }
        public DateTime CreationTime { get; set; } = DateTime.Now;
        public DateTime UpdateTime { get; set; } = DateTime.Now;
        public DateTime? LastLogin { get; set; }

        public string GetName()
        {
            return Name + " " + LastName + (string.IsNullOrEmpty(Title) ? "" : " " + Title);
        }

        public override string ToString()
        {
            return GetName();
        }
    }
}
