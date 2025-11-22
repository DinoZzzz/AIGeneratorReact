using AIGenerator.Common;
using Interfaces;
using Models;
using AIGenerator.UserControls;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using AIGenerator.Forms;
using System.Linq;

namespace AIGenerator.Dialogs
{
    public partial class SelectFormTypeDialog : Form
    {
        private readonly IReportFormType IReportFormType;
        private readonly IUserReportAccreditation IUserReportAccreditation;
        private readonly ICustomer ICustomer;
        private readonly IReportType IReportType;
        private readonly List<FormTypeUserControl> formTypeUserControls = new List<FormTypeUserControl>();
        private readonly CustomerConstruction customerConstruction;
        public ReportFormType selectedFormType;
        private ReportType selectedType;
        private int page = 0;

        public SelectFormTypeDialog(IReportFormType reportFormType, ICustomer iCustomer, IUserReportAccreditation iUserReportAccreditation, IReportType reportType, CustomerConstruction customerConstruction)
        {
            IReportFormType = reportFormType;
            IReportType = reportType;
            InitializeComponent();
            this.customerConstruction = customerConstruction;
            ICustomer = iCustomer;
            IUserReportAccreditation = iUserReportAccreditation;
        }

        private void SelectFormTypeDialog_Load(object sender, EventArgs e)
        {
            btnBack.ForeColor = btnSave.ForeColor = CustomColor.MainColor;
            btnBack.BackColor = btnSave.BackColor = CustomColor.PrimaryBackground;
            lblSelect.ForeColor = CustomColor.MainColor;
            lblInfoText.ForeColor = CustomColor.Text2;
            BackColor = CustomColor.Background;
            lblConstructionText.ForeColor = lblCustomerText.ForeColor = lblConstructionText.ForeColor = lblWorkOrderText.ForeColor = CustomColor.Text2;
            lblConstruction.ForeColor = lblCustomer.ForeColor = lblWorkOrder.ForeColor = CustomColor.Text1;
            lblCustomer.Text = ICustomer.GetById(customerConstruction.CustomerId).Name;
            lblWorkOrder.Text = customerConstruction.WorkOrder;
            lblConstruction.Text = customerConstruction.Construction;
            LoadReportTypes();
        }

        private void OnSelectedFormType(string name)
        {
            foreach (FormTypeUserControl formTypeUserControl in formTypeUserControls)
            {
                if (formTypeUserControl.Name == name)
                {
                    formTypeUserControl.IsSelected = true;
                    selectedFormType = formTypeUserControl.GetFormType;
                }
                else formTypeUserControl.IsSelected = false;
            }
        }

        private void OnSelectedReportType(string name)
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
                MessageClass.ShowInfoBox("Odaberite " + (page == 0 ? "metodu" : "tip obrazca") + " prije nego što nastavite!");
            }
            else if (page == 0)
            {
                btnBack.Visible = true;
                page++;
                lblInfoText.Text = "Odaberite tip:";
                LoadReportFormTypes();
            }
            else
            {
                DialogResult = DialogResult.OK;
                Close();
            }
        }

        private void LoadReportTypes()
        {
            flpTypes.Controls.Clear();
            bool start = true;
            formTypeUserControls.Clear();
            try
            {
                List<int> reportFormIds = IUserReportAccreditation.GetByUser(LoginForm.currentUser.Id).Select(x => x.ReportTypeId).ToList();
                foreach (ReportType reportType in IReportType.GetAll().Where(x => reportFormIds.Contains(x.Id)))
                {
                    FormTypeUserControl formTypeUserControl = new FormTypeUserControl(reportType);
                    formTypeUserControl.OnSelected += OnSelectedReportType;
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
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja metoda... Molimo pokušajte ponovo kasnije!"); ;
            }
        }

        private void LoadReportFormTypes()
        {
            bool start = true;
            flpTypes.Controls.Clear();
            formTypeUserControls.Clear();
            try
            {
                foreach (ReportFormType reportFormType in IReportFormType.GetAll().Where(x => x.TypeId == selectedType.Id))
                {
                    FormTypeUserControl formTypeUserControl = new FormTypeUserControl(reportFormType);
                    formTypeUserControl.OnSelected += OnSelectedFormType;
                    formTypeUserControl.Name = reportFormType.Id.ToString();
                    formTypeUserControl.Size = new Size(flpTypes.Width - 6, formTypeUserControl.Size.Height);
                    formTypeUserControl.IsSelected = start;
                    if (start)
                    {
                        selectedFormType = reportFormType;
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
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja tipova obrazaca... Molimo pokušajte ponovo kasnije!"); ;
            }
        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            btnBack.Visible = false;
            page--;
            LoadReportTypes();
        }
    }
}
