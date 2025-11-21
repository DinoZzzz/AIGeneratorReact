using AIGenerator.Common;
using AIGenerator.Forms;
using AIGenerator.UserControls;
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

namespace AIGenerator.Dialogs
{
    public partial class SelectReportTypeDialog : Form
    {
        private readonly IReportType IReportType;
        private readonly IUserReportAccreditation IUserAccreditation;
        private readonly ICustomer ICustomer;
        private readonly List<FormTypeUserControl> formTypeUserControls = new List<FormTypeUserControl>();
        private readonly CustomerConstruction customerConstruction;
        public ReportType selectedType;

        public SelectReportTypeDialog(IReportType reportType, ICustomer iCustomer, IUserReportAccreditation iUserAccreditation, CustomerConstruction customerConstruction)
        {
            IReportType = reportType;
            InitializeComponent();
            this.customerConstruction = customerConstruction;
            ICustomer = iCustomer;
            IUserAccreditation = iUserAccreditation;
        }

        private void SelectFormTypeDialog_Load(object sender, EventArgs e)
        {
            btnSave.ForeColor = CustomColor.MainColor;
            btnSave.BackColor = CustomColor.PrimaryBackground;
            lblSelect.ForeColor = CustomColor.MainColor;
            lblInfoText.ForeColor = CustomColor.Text2;
            BackColor = CustomColor.Background;
            lblConstructionText.ForeColor = lblCustomerText.ForeColor = lblConstructionText.ForeColor = lblWorkOrderText.ForeColor = CustomColor.Text2;
            lblConstruction.ForeColor = lblCustomer.ForeColor = lblWorkOrder.ForeColor = CustomColor.Text1;
            lblCustomer.Text = ICustomer.GetById(customerConstruction.CustomerId).Name;
            lblWorkOrder.Text = customerConstruction.WorkOrder;
            lblConstruction.Text = customerConstruction.Construction;
            flpTypes.Controls.Clear();
            bool start = true;
            formTypeUserControls.Clear();
            try
            {
                List<int> reportFormIds = IUserAccreditation.GetByUser(LoginForm.currentUser.Id).Select(x => x.ReportTypeId).ToList();
                foreach (ReportType reportType in IReportType.GetAll().Where(x => reportFormIds.Contains(x.Id)))
                {
                    FormTypeUserControl formTypeUserControl = new FormTypeUserControl(reportType);
                    formTypeUserControl.OnSelected += OnSelected;
                    formTypeUserControl.Name = reportType.Id.ToString();
                    formTypeUserControl.Size = new Size(flpTypes.Width - 6, formTypeUserControl.Size.Height);
                    formTypeUserControl.IsSelected = start;
                    if (start)
                    {
                        selectedType = reportType;
                        start = false;
                    }
                    formTypeUserControls.Add(formTypeUserControl);
                    flpTypes.Controls.Add(formTypeUserControl);
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                formTypeUserControls.Clear();
                flpTypes.Controls.Clear();
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja tipova obrazaca... Molimo pokušajte ponovo kasnije!");
                Close();
            }
        }

        private void OnSelected(string name)
        {
            foreach (FormTypeUserControl formTypeUserControl in formTypeUserControls)
            {
                if (formTypeUserControl.Name == name)
                {
                    formTypeUserControl.IsSelected = true;
                    selectedType = formTypeUserControl.GetReportType;
                }
                else formTypeUserControl.IsSelected = false;
            }
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            if (formTypeUserControls.Count == 0)
            {
                MessageClass.ShowInfoBox("Odaberite tip izvještaja prije nego što nastavite!");
                return;
            }
            DialogResult = DialogResult.OK;
            Close();
        }
    }
}
