using AIGenerator.Common;
using Common;
using Models;
using System;
using System.Drawing;
using System.Windows.Forms;

namespace AIGenerator.UserControls
{
    public partial class ReportFileUserControl : UserControl
    {
        public ReportFile ReportFile { get; set; }
        public bool IsReadOnly { get; set; }
        public Action<ReportFile> OnDelete;
        public Action<ReportFile> OnEdit;
        //public event MouseEventHandler Control_MouseMove;
        //public event MouseEventHandler Control_MouseUp;
        //public event MouseEventHandler Control_MouseDown;

        public ReportFileUserControl()
        {
            InitializeComponent();
        }

        public bool IsDesignerHosted
        {
            get
            {
                Control ctrl = this;
                while (ctrl != null)
                {
                    if ((ctrl.Site != null) && ctrl.Site.DesignMode)
                        return true;
                    ctrl = ctrl.Parent;
                }
                return false;
            }
        }

        private void ReportFileUserControl_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            //MouseMove += Control_MouseMove;
            //MouseUp += Control_MouseUp;
            //MouseDown += Control_MouseDown;
            lblDescription.Text = ReportFile.Description;
            if (ReportFile.IsLocal && ReportFile.Extension.ToLower() == ".pdf") pbImage.BackgroundImage = Properties.Resources.pdf;
            else
            {
                if (ReportFile.IsLocal) pbImage.BackgroundImage = new Bitmap(ReportFile.Name);
                else
                {
                    pbImage.BackgroundImage = ImageClass.GetThumbnail(ReportFile);
                    pbPDF.Visible = ReportFile.Extension.ToLower() == ".pdf";
                }
            }
            if (IsReadOnly)
            {
                btnDelete.Visible = btnEdit.Visible = false;
            }
            btnEdit.ForeColor = lblDescription.ForeColor = CustomColor.Text1;
            btnDelete.ForeColor = CustomColor.Red;
            btnDelete.BackColor = btnEdit.BackColor = CustomColor.PrimaryBackground;
            BackColor = CustomColor.PrimaryBackground;
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            OnDelete(ReportFile);
        }

        private void btnEdit_Click(object sender, EventArgs e)
        {
            OnEdit(ReportFile);
        }
    }
}
