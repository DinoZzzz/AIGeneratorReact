using AIGenerator.Common;
using Interfaces;
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
using System.Xml.Linq;

namespace AIGenerator.Dialogs
{
    public partial class FormsFilterDialog : Form
    {
        private readonly FormsFilter formsFilter;
        private readonly string constructionId;
        private readonly IUser IUser;
        private readonly IReportForm IReportForm;
        private readonly IReportFormType IReportFormType;

        public FormsFilterDialog(FormsFilter formsFilter, string customerConstructionId, IReportFormType reportFormType, IReportForm iReportForm, IUser iUser)
        {
            InitializeComponent();
            this.formsFilter = formsFilter ?? new FormsFilter();
            constructionId = customerConstructionId;
            IUser = iUser;
            IReportForm = iReportForm;
            IReportFormType = reportFormType;
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

        private void FormsFilterDialog_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            BackColor = CustomColor.PrimaryBackground;
            lblExaminer.ForeColor = CustomColor.MainColor;
            lblType.ForeColor = lblEndDate.ForeColor = lblExaminer.ForeColor = lblStartDate.ForeColor = lblStock.ForeColor = gbDate.ForeColor = CustomColor.Text2;
            lblFilter.ForeColor = CustomColor.MainColor;
            btnFilter.ForeColor = CustomColor.MainColor;
            btnFilter.BackColor = CustomColor.PrimaryBackground;
            cbType.BackColor = cbExaminers.BackColor = txtStock.BackColor = dtEndDate.BackColor = dtStartDate.BackColor = CustomColor.White10;
            cbType.ForeColor = cbExaminers.ForeColor = txtStock.ForeColor = dtEndDate.ForeColor = dtStartDate.ForeColor = CustomColor.Text1;
            cbExaminers.Items.Clear();
            cbExaminers.Items.Add("Svi");
            cbExaminers.SelectedIndex = 0;
            IQueryable<ReportForm> reportForms = IReportForm.GetByConstruction(constructionId);
            List<string> userIds = reportForms.GroupBy(x => x.UserId).Select(x => x.Key).ToList();
            foreach (User user in IUser.GetAll().Where(x => userIds.Contains(x.Id)))
            {
                cbExaminers.Items.Add(user);
                if(user.Id == formsFilter.UserId) cbExaminers.SelectedItem = user;
            }
            cbType.Items.Clear();
            cbType.Items.Add("Sve");
            cbType.SelectedIndex = 0;
            foreach (ReportFormType type in IReportFormType.GetAll())
            {
                cbType.Items.Add(type);
                if (type.Id == formsFilter.TypeId) cbType.SelectedItem = type;
            }
            if (formsFilter.IsActive)
            {
                dtStartDate.Value = formsFilter.StartDate;
                dtEndDate.Value = formsFilter.EndDate;
            }
            else
            {
                dtStartDate.Value = reportForms.Min(x => x.ExaminationDate);
                dtEndDate.Value = reportForms.Max(x => x.ExaminationDate);
            }
            dtEndDate.MinDate = dtStartDate.Value;
        }

        private void btnFilter_Click(object sender, EventArgs e)
        {
            formsFilter.IsActive = true;
            formsFilter.Stock = txtStock.Text.ToLower();
            if (cbExaminers.SelectedIndex > 0) formsFilter.UserId = (cbExaminers.SelectedItem as User).Id;
            else formsFilter.UserId = "";
            if (cbType.SelectedIndex > 0) formsFilter.TypeId = (cbType.SelectedItem as ReportFormType).Id;
            else formsFilter.TypeId = 0;
            formsFilter.StartDate = dtStartDate.Value;
            formsFilter.EndDate = dtEndDate.Value;
            DialogResult = DialogResult.OK;
            Close();
        }

        private void dtStartDate_ValueChanged(object sender, EventArgs e)
        {
            dtEndDate.MinDate = dtStartDate.Value;
        }
    }
}
