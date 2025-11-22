using AIGenerator.Common;
using AIGenerator.Forms;
using Interfaces;
using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;

namespace AIGenerator.Dialogs
{
    public partial class AddCustomerDialog : Form
    {
        private readonly ICustomer ICustomer;
        private readonly ICustomerConstruction ICustomerConstruction;
        private readonly IAppLog IAppLog;
        private bool IsEdit;
        private Customer customer;

        public AddCustomerDialog(Customer customer, ICustomer iCustomer, ICustomerConstruction iCustomerConstruction, IAppLog iAppLog)
        {
            ICustomer = iCustomer;
            ICustomerConstruction = iCustomerConstruction;
            IsEdit = customer != null;
            this.customer = customer ?? new Customer();
            InitializeComponent();
            IAppLog = iAppLog;
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

        private void AddCustomerDialog_Load(object sender, EventArgs e)
        {
            if (!IsDesignerHosted)
            {
                BackColor = CustomColor.PrimaryBackground;
                if (!IsDesignerHosted)
                {
                    lblAddExaminer.Text = IsEdit ? "Uređivanje naručitelja" : "Dodavanje naručitelja";
                    BackColor = CustomColor.PrimaryBackground;
                    lblPostalCode.ForeColor = lblAddress.ForeColor = lblLocation.ForeColor = lblWorkOrder.ForeColor = lblUsername.ForeColor = CustomColor.Text2;
                    lblAddExaminer.ForeColor = CustomColor.MainColor;
                    btnSave.ForeColor = CustomColor.MainColor;
                    btnSave.BackColor = CustomColor.PrimaryBackground;
                    txtPostalCode.BackColor = txtAddress.BackColor = txtName.BackColor = txtLocation.BackColor = txtWorkOrder.BackColor = txtName.BackColor = CustomColor.White10;
                    txtPostalCode.ForeColor = txtAddress.ForeColor = txtName.ForeColor = txtLocation.ForeColor = txtWorkOrder.ForeColor = txtName.ForeColor = CustomColor.Text1;
                    if (IsEdit)
                    {
                        txtLocation.Text = customer.Location;
                        txtWorkOrder.Text = customer.WorkOrder;
                        txtName.Text = customer.Name;
                        txtAddress.Text = customer.Address;
                        txtPostalCode.Text = customer.PostalCode;
                    }
                }
            }
        }

        private bool Check()
        {
            if (string.IsNullOrEmpty(txtWorkOrder.Text))
            {
                MessageClass.ShowInfoBox("Unesite broj naručitelja!");
                return false;
            }
            if (ICustomer.AnyWorkOrder(txtWorkOrder.Text, customer.Id))
            {
                MessageClass.ShowInfoBox("Već postoji naručitelj sa unesenim brojem!");
                return false;
            }
            if (string.IsNullOrEmpty(txtName.Text))
            {
                MessageClass.ShowInfoBox("Unesite naziv naručitelja!");
                return false;
            }
            if (ICustomer.AnyName(txtName.Text, customer.Id))
            {
                MessageClass.ShowInfoBox("Već postoji naručitelj sa istim nazivom!");
                return false;
            }
            if (string.IsNullOrEmpty(txtPostalCode.Text))
            {
                MessageClass.ShowInfoBox("Unesite poštanski broj naručitelja!");
                return false;
            }
            if (string.IsNullOrEmpty(txtAddress.Text))
            {
                MessageClass.ShowInfoBox("Unesite adresu naručitelja!");
                return false;
            }
            if (string.IsNullOrEmpty(txtLocation.Text))
            {
                MessageClass.ShowInfoBox("Unesite lokaciju naručitelja!");
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
                    customer.Name = txtName.Text;
                    customer.WorkOrder = txtWorkOrder.Text;
                    customer.Location = txtLocation.Text;
                    customer.Address = txtAddress.Text;
                    customer.PostalCode = txtPostalCode.Text;
                    if (IsEdit)
                    {
                        Customer oldCustomer = ICustomer.GetById(customer.Id);
                        oldCustomer.Location = customer.Location;
                        oldCustomer.WorkOrder = customer.WorkOrder;
                        oldCustomer.Name = customer.Name;
                        oldCustomer.Address = customer.Address;
                        oldCustomer.PostalCode = customer.PostalCode;
                        oldCustomer.UpdateTime = now;
                    }
                    else
                    {
                        customer.CreationTime = customer.UpdateTime = now;
                        ICustomer.Add(customer);
                    }
                    ICustomer.SaveChanges();
                    DialogResult = DialogResult.OK;
                    Close();
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom dodavanja naručitelja... Molimo pokušajte ponovo kasnije!");
            }
            Enabled = true;
        }
    }
}
