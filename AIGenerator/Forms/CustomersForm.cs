using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Dialogs;
using Interfaces;
using Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;

namespace AIGenerator.Forms
{
    public partial class CustomersForm : BaseForm
    {
        private readonly ICustomer ICustomer;
        private readonly ICustomerConstruction ICustomerConstruction;
        private readonly IReportForm IReportForm;
        private readonly IReportExport IReportExport;
        private readonly IReportExportForm IReportExportForm;
        private List<Customer> customers = new List<Customer>();
        private int currentPage = 0;
        private int pageSize = 50;
        private bool dataSourceChanged = true;
        private bool lastPage = false;
        private string search = "";

        public CustomersForm(ICustomer customer, IReportForm iReportForm, ICustomerConstruction iCustomerConstruction, IReportExport iReportExport, IReportExportForm iReportExportForm) : base()
        {
            ICustomer = customer;
            InitializeComponent();
            menuUserControl1.SetSelectedItem(MenuItems.Customers);
            IReportForm = iReportForm;
            ICustomerConstruction = iCustomerConstruction;
            IReportExport = iReportExport;
            IReportExportForm = iReportExportForm;
        }

        private void LoadCustomers()
        {
            try
            {
                if (dataSourceChanged)
                {
                    lastPage = dataSourceChanged = false;
                    currentPage = 0;
                    dtCustomers.Rows.Clear();
                    customers.Clear();
                }
                if (lastPage) return;
                LoadingScreenHelper.StartLoadingScreen();
                IQueryable<Customer> customersQuery = ICustomer.GetAll();
                if (!string.IsNullOrEmpty(search))
                {
                    customersQuery = customersQuery.Where(x => x.Name.ToLower().Contains(search) || x.Location.ToLower().Contains(search));
                }
                customersQuery = SortCustomers(customersQuery).Skip(currentPage * pageSize).Take(pageSize);
                lastPage = customersQuery.Count() < pageSize;
                foreach (Customer customer in customersQuery)
                {
                    if (customers.Any(x => x.Id == customer.Id)) continue;
                    customers.Add(customer);
                    int rowIndex = dtCustomers.Rows.Add();
                    List<string> constructions = ICustomerConstruction.GetByCustomer(customer.Id).Where(x => x.IsActive).Select(x => x.WorkOrder + ", " + x.Construction).OrderBy(x => x).ToList();
                    dtCustomers["Id", rowIndex].Value = customer.Id;
                    dtCustomers["FullName", rowIndex].Value = customer.Name;
                    dtCustomers["WorkOrder", rowIndex].Value = customer.WorkOrder;
                    dtCustomers["CustomerLocation", rowIndex].Value = customer.Location;
                    dtCustomers["Address", rowIndex].Value = customer.Address;
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                if (dataSourceChanged)
                {
                    dtCustomers.Rows.Clear();
                    customers.Clear();
                }
                LoadingScreenHelper.EndScreen();
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja naručitelja... Molimo pokušajte ponovo kasnije!");
            }
            LoadingScreenHelper.EndScreen();
        }

        private IQueryable<Customer> SortCustomers(IQueryable<Customer> customers)
        {
            DataGridViewColumn column = dtCustomers.SortedColumn;
            SortOrder order = dtCustomers.SortOrder;
            if (column == null)
            {
                customers = customers.OrderBy(x => x.Name);
            }
            else if (dtCustomers.Columns[0].Name == column.Name)
            {
                if (order == SortOrder.Descending) customers = customers.OrderByDescending(x => x.WorkOrder);
                else customers = customers.OrderBy(x => x.WorkOrder);
            }
            else if (dtCustomers.Columns[1].Name == column.Name)
            {
                if (order == SortOrder.Descending) customers = customers.OrderByDescending(x => x.Name);
                else customers = customers.OrderBy(x => x.Name);
            }
            else if (dtCustomers.Columns[2].Name == column.Name)
            {
                if (order == SortOrder.Descending) customers = customers.OrderByDescending(x => x.Address);
                else customers = customers.OrderBy(x => x.Address);
            }
            else if (dtCustomers.Columns[3].Name == column.Name)
            {
                if (order == SortOrder.Descending) customers = customers.OrderByDescending(x => x.Location);
                else customers = customers.OrderBy(x => x.Location);
            }
            return customers;
        }

        private void CustomersForm_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            BackColor = CustomColor.Background;
            DataGridHelper.SetDefaultStyle(dtCustomers);
            DataGridHelper.CreateButtonColumn(dtCustomers, "EditColumn", "Uredi");
            DataGridHelper.CreateButtonColumn(dtCustomers, "RemoveColumn", "Ukloni");
            dtCustomers.Columns["EditColumn"].DefaultCellStyle.ForeColor = CustomColor.MainColor;
            dtCustomers.Columns["RemoveColumn"].DefaultCellStyle.ForeColor = CustomColor.Red;
            lblExaminers.ForeColor = CustomColor.Text1;
            btnAddNew.ForeColor = CustomColor.MainColor;
            btnAddNew.BackColor = CustomColor.PrimaryBackground;
            txtSearch.BackColor = CustomColor.White10;
            txtSearch.ForeColor = CustomColor.Text1;
            containerPanel.Size = pnBody.Size;
            LoadCustomers();
        }

        private void CustomersForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            FormHelper.CloseApp();
        }

        private void dtCustomers_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0 || !LoginForm.currentUser.IsAdmin) return;
            string customerId = Convert.ToString(dtCustomers["Id", e.RowIndex].Value);
            if (e.ColumnIndex == dtCustomers.Columns["EditColumn"].Index)
            {
                Enabled = false;
                OpenDialog(customerId);
                Enabled = true;
            }
            else if (e.ColumnIndex == dtCustomers.Columns["RemoveColumn"].Index)
            {
                Enabled = false;
                if (MessageClass.ShowQuestionBox("Uklanjanjem ovog naručitelja uklonit će se i svi izvještaji vezani uz njega. Želite li nastaviti?") == DialogResult.Yes)
                {
                    try
                    {
                        IReportForm.RemoveByCustomer(customerId);
                        IReportForm.SaveChanges();
                        ICustomerConstruction.RemoveByCustomer(customerId);
                        ICustomerConstruction.SaveChanges();
                        foreach (ReportExport reportExport in IReportExport.GetByCustomer(customerId))
                        {
                            IReportExportForm.RemoveByExport(reportExport.Id);
                            IReportExport.Remove(reportExport);
                        }
                        IReportExportForm.SaveChanges();
                        IReportExport.SaveChanges();
                        ICustomer.Remove(customerId);
                        ICustomer.SaveChanges();
                    }
                    catch (Exception ex)
                    {
                        ExceptionHelper.SaveLog(ex);
                        MessageClass.ShowErrorBox("Došlo je do pogreške prilikom uklanjanja naručitelja... Molimo pokušajte ponovo kasnije!");
                        Enabled = true;
                        return;
                    }
                    dataSourceChanged = true;
                    LoadCustomers();
                }
                Enabled = true;
            }
        }

        private void pnReports_Paint(object sender, PaintEventArgs e)
        {
            Panel p = sender as Panel;
            p.BackColor = CustomColor.PrimaryBackground;
            ControlPaint.DrawBorder(e.Graphics, p.DisplayRectangle, CustomColor.MainColor20, ButtonBorderStyle.Solid);
        }

        private void dtCustomers_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0 || !LoginForm.currentUser.IsAdmin) return;
            string customerId = Convert.ToString(dtCustomers["Id", e.RowIndex].Value);
            Enabled = false;
            OpenDialog(customerId);
            Enabled = true;
        }

        private void OpenDialog(string customerId)
        {
            Customer customer = customers.SingleOrDefault(x => x.Id == customerId);
            if (CompositionRoot.Resolve<AddCustomerDialog>("customer", customer).ShowDialog() == DialogResult.OK)
            {
                dataSourceChanged = true;
                LoadCustomers();
            }
        }

        private void btnAddNew_Click(object sender, EventArgs e)
        {
            Enabled = false;
            if (CompositionRoot.Resolve<AddCustomerDialog>("customer", null).ShowDialog() == DialogResult.OK)
            {
                dataSourceChanged = true;
                LoadCustomers();
            }
            Enabled = true;
        }

        private void pbSearch_Click(object sender, EventArgs e)
        {
            Enabled = false;
            search = txtSearch.Text.ToLower();
            dataSourceChanged = true;
            LoadCustomers();
            Enabled = true;
        }

        private void txtSearch_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter)
            {
                e.Handled = true;
                pbSearch_Click(pbSearch, e);
            }
        }

        private void dtCustomers_Scroll(object sender, ScrollEventArgs e)
        {
            if (dtCustomers.DisplayedRowCount(true) + e.NewValue >= dtCustomers.Rows.Count - 5)
            {
                currentPage++;
                LoadCustomers();
            }
        }

        private void dtCustomers_Sorted(object sender, EventArgs e)
        {
            pbSearch_Click(pbSearch, e);
        }

        private void CustomersForm_Resize(object sender, EventArgs e)
        {
            Size newSize = minimumSize;
            if (Size.Width > minimumSize.Width) newSize.Width = Size.Width;
            if (Size.Height > minimumSize.Height) newSize.Height = Size.Height;
            pnReports.Size = new Size(newSize.Width - pnReports.Location.X - rightMargin, newSize.Height - pnReports.Location.Y - bottomMargin);
            dtCustomers.Size = new Size(pnReports.Size.Width - 2 * dtCustomers.Left, pnReports.Size.Height - dtCustomers.Location.Y - 2 * btnAddNew.Location.Y);
            btnAddNew.Location = new Point(pnReports.Size.Width - dtCustomers.Left - btnAddNew.Size.Width, btnAddNew.Location.Y);
            pbSearch.Location = new Point(btnAddNew.Location.X - pbSearch.Width - 6, pbSearch.Location.Y);
            txtSearch.Location = new Point(pbSearch.Location.X - 6 - txtSearch.Width, txtSearch.Location.Y);
        }
    }
}
