using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models
{
    public class Setting
    {
        public int Id { get; set; }
        public bool DarkMode { get; set; } = false;
        public bool Maximized { get; set; } = true;
        public int LocationX { get; set; } = 0;
        public int LocationY { get; set; } = 0;
        public int Width { get; set; } = 1435;
        public int Height { get; set; } = 680;
    }
}
