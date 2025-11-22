using AIGenerator.Common;
using AIGenerator.Forms;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.UserControls
{
    public partial class LoadingUserControl : UserControl
    {
        public string DisplayedText
        {
            get => lblText.Text;
            set => lblText.Text = value;
        }

        public LoadingUserControl()
        {
            InitializeComponent();
        }

        public bool IsDesignerHosted
        {
            get
            {
                Control control = this;
                while (control != null)
                {
                    if ((control.Site != null) && control.Site.DesignMode)
                        return true;
                    control = control.Parent;
                }
                return false;
            }
        }

        private void LoadingUserControl_Load(object sender, EventArgs e)
        {
            BackColor = CustomColor.Background;
            lblText.ForeColor = CustomColor.Text1;
            progressBar1.ForeColor = CustomColor.MainColor;
            progressBar1.BackColor = CustomColor.White10;
            pbLogo.BackgroundImage = LoginForm.DarkMode ? Properties.Resources.logo_dark : Properties.Resources.logo;
            if (IsDesignerHosted) return;
            timer.Start();
        }

        private void timer_Tick(object sender, EventArgs e)
        {
            progressBar1.Value += 1;
            if (progressBar1.Value >= progressBar1.Maximum) progressBar1.Value = 0;
        }

        public void Stop()
        {
            Visible = false;
            timer.Stop();
        }
    }
}
