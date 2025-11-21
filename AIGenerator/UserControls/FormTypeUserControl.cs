using AIGenerator.Common;
using Models;
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
    public partial class FormTypeUserControl : UserControl
    {
        private readonly ReportFormType reportFormType = null;
        private readonly ReportType reportType = null;
        private bool isSelected;

        public event Action<string> OnSelected;
        public bool IsSelected
        {
            get { return isSelected; }
            set
            {
                isSelected = value;
                Invalidate();
            }
        }
        public ReportFormType GetFormType { get { return reportFormType; } }
        public ReportType GetReportType { get { return reportType; } }


        public FormTypeUserControl(ReportFormType reportFormType)
        {
            InitializeComponent();
            this.reportFormType = reportFormType;
            lblType.Text = reportFormType.Name;
        }

        public FormTypeUserControl(ReportType reportType)
        {
            InitializeComponent();
            this.reportType = reportType;
            lblType.Text = reportType.Type;
        }

        private void FormTypeUserControl_Paint(object sender, PaintEventArgs e)
        {
            UserControl userControl = sender as UserControl;
            ControlPaint.DrawBorder(e.Graphics, userControl.DisplayRectangle, isSelected ? CustomColor.Green : CustomColor.White10, ButtonBorderStyle.Solid);
        }

        private void FormTypeUserControl_Load(object sender, EventArgs e)
        {
            lblType.ForeColor = CustomColor.Text1;
        }

        private void SelectionChanged(object sender, EventArgs e)
        {
            OnSelected(Name);
        }
    }
}
