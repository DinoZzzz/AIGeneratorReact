using AIGenerator.Common;
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
    public partial class FormHeaderUserControl : UserControl
    {
        public int TypeId { get; set; } = 1;
        public string WorkOrder
        {
            get => lblWorkOrder.Text;
            set => lblWorkOrder.Text = value;
        }

        public FormHeaderUserControl()
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

        private void FormHeaderUserControl_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            lblEdition.ForeColor = lblUrl.ForeColor = lblAddress.ForeColor = lblLab.ForeColor = lblCompany.ForeColor = lblType.ForeColor = lblDate.ForeColor = lblKey.ForeColor = lblWorkOrder.ForeColor = CustomColor.Text1;
            BackColor = CustomColor.PrimaryBackground;
            lblType.Text = MethodFormHelper.GetTypeText(TypeId);
        }
    }
}
