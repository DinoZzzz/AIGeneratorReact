using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.Common
{
    public class MessageClass
    {
        public static DialogResult ShowInfoBox(string message) => MessageBox.Show(message, "Informacija", MessageBoxButtons.OK, MessageBoxIcon.Information);
        
        public static DialogResult ShowQuestionBox(string message) => MessageBox.Show(message, "Pitanje", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
        
        public static DialogResult ShowErrorBox(string message) => MessageBox.Show(message, "Greška", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
}
