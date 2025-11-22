using AIGenerator.Common;
using AIGenerator.Forms;
using Interfaces;
using Models;
using System;
using System.Linq;
using System.Windows.Forms;

namespace AIGenerator.Dialogs
{
    public partial class AddCustomerConstructionDialog : Form
    {
        private readonly CustomerConstruction customerConstruction;
        private readonly bool IsEdit = false;
        private readonly ICustomerConstruction ICustomerConstruction;

        public AddCustomerConstructionDialog(CustomerConstruction customerConstruction, string customerId, ICustomerConstruction iCustomerConstruction)
        {
            InitializeComponent();
            ICustomerConstruction = iCustomerConstruction;
            IsEdit = customerConstruction != null;
            this.customerConstruction = customerConstruction ?? new CustomerConstruction() { CustomerId = customerId };
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

        private void AddCustomerConstructionDialog_Load(object sender, EventArgs e)
        {
            if (!IsDesignerHosted)
            {
                BackColor = CustomColor.PrimaryBackground;
                if (!IsDesignerHosted)
                {
                    lblAddExaminer.Text = IsEdit ? "Uređivanje gradilišta" : "Dodavanje gradilišta";
                    BackColor = CustomColor.PrimaryBackground;
                    lblLocation.ForeColor = lblWorkOrder.ForeColor = lblUsername.ForeColor = CustomColor.Text2;
                    lblAddExaminer.ForeColor = CustomColor.MainColor;
                    btnSave.ForeColor = CustomColor.MainColor;
                    btnSave.BackColor = CustomColor.PrimaryBackground;
                    txtName.BackColor = txtLocation.BackColor = txtWorkOrder.BackColor = txtName.BackColor = CustomColor.White10;
                    txtName.ForeColor = txtLocation.ForeColor = txtWorkOrder.ForeColor = txtName.ForeColor = CustomColor.Text1;
                    if (IsEdit)
                    {
                        txtLocation.Text = customerConstruction.Location;
                        txtWorkOrder.Text = customerConstruction.WorkOrder;
                        txtName.Text = customerConstruction.Construction;
                    }
                }
            }
        }

        private bool Check()
        {
            if (string.IsNullOrEmpty(txtWorkOrder.Text))
            {
                MessageClass.ShowInfoBox("Unesite radni nalog gradilišta!");
                return false;
            }
            if (ICustomerConstruction.AnyWorkOrder(txtWorkOrder.Text, customerConstruction.Id))
            {
                MessageClass.ShowInfoBox("Već postoji gradilište sa unesenim radnim nalogom!");
                return false;
            }
            if (string.IsNullOrEmpty(txtName.Text))
            {
                MessageClass.ShowInfoBox("Unesite naziv gradilišta!");
                return false;
            }
            if (string.IsNullOrEmpty(txtLocation.Text))
            {
                MessageClass.ShowInfoBox("Unesite lokaciju gradilišta!");
                return false;
            }
            return true;
        }

        private void TextBox_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter)
            {
                e.Handled = true;
                btnSave_Click(btnSave, e);
            }
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            Enabled = false;
            try
            {
                if (Check())
                {
                    DateTime now = DateTime.Now;
                    customerConstruction.Construction = txtName.Text;
                    customerConstruction.WorkOrder = txtWorkOrder.Text;
                    customerConstruction.Location = txtLocation.Text;
                    if (IsEdit)
                    {
                        CustomerConstruction oldCustomer = ICustomerConstruction.GetById(customerConstruction.Id);
                        oldCustomer.Location = customerConstruction.Location;
                        oldCustomer.WorkOrder = customerConstruction.WorkOrder;
                        oldCustomer.Construction = customerConstruction.Construction;
                        oldCustomer.UpdateTime = now;
                    }
                    else
                    {
                        customerConstruction.CreationTime = customerConstruction.UpdateTime = now;
                        ICustomerConstruction.Add(customerConstruction);
                    }
                    ICustomerConstruction.SaveChanges();
                    DialogResult = DialogResult.OK;
                    Close();
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom dodavanja gradilišta... Molimo pokušajte ponovo kasnije!");
            }
            Enabled = true;
        }
    }
}
