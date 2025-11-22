using AIGenerator.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator
{
    public partial class LoadingDialog : Form
    {
        public LoadingDialog(string text)
        {
            InitializeComponent();
            loadingUserControl1.DisplayedText = text;
            TopMost = true;
        }

        private void LoadingDialog_Load(object sender, EventArgs e)
        {
            BackColor = CustomColor.Background;
        }
    }
}
