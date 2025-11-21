using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Dialogs;
using Interfaces;
using Models;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Windows.Forms.DataVisualization.Charting;

namespace AIGenerator.Forms
{
    public partial class PlatformForm : BaseForm
    {
        private readonly IUser IUser;
        private readonly IReportExport IReportExport;
        private readonly ICustomer ICustomer;
        private readonly ICustomerConstruction ICustomerConstruction;
        private readonly List<Customer> customers = new List<Customer>();
        private static PlatformForm privatePlatformForm;
        public static bool update = false;
        private bool start = true;
        private int currentPage = 0;
        private int pageSize = 40;
        private bool dataSourceChanged = false;
        private bool lastPage = false;
        private string search = "";
        public static PlatformForm platformForm
        {
            get
            {
                update = true;
                return privatePlatformForm;
            }
        }

        public PlatformForm(IUser user, ICustomer customer, ICustomerConstruction iCustomerConstruction, IReportExport iReportExport) : base()
        {
            IUser = user;
            ICustomer = customer;
            privatePlatformForm = this;
            InitializeComponent();
            BackColor = CustomColor.Background;
            menuUserControl1.SetSelectedItem(MenuItems.Platform);
            ICustomerConstruction = iCustomerConstruction;
            IReportExport = iReportExport;
        }

        private void LoadCustomers()
        {
            try
            {
                if (start || dataSourceChanged)
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
                    customersQuery = customersQuery.Where(x => x.Name.ToLower().Contains(search) || x.Location.ToLower().Contains(search) || x.WorkOrder.ToLower().Contains(search));
                }
                customersQuery = SortCustomers(customersQuery).Skip(currentPage * pageSize).Take(pageSize);
                lastPage = customersQuery.Count() < pageSize;
                foreach (Customer customer in customersQuery)
                {
                    if (customers.Any(x => x.Id == customer.Id)) continue;
                    customers.Add(customer);
                    int rowIndex = dtCustomers.Rows.Add();
                    IQueryable<CustomerConstruction> customerConstructions = ICustomerConstruction.GetByCustomer(customer.Id);
                    List<string> constructions = customerConstructions.Where(x => x.IsActive).Take(3).Select(x => x.WorkOrder + ", " + x.Construction).OrderBy(x => x).ToList();
                    dtCustomers["Id", rowIndex].Value = customer.Id;
                    dtCustomers["Number", rowIndex].Value = customer.WorkOrder;
                    dtCustomers["Customer", rowIndex].Value = customer.Name;
                    dtCustomers["ActiveWorkOrders", rowIndex].Value = string.Join("\n", constructions) + (customerConstructions.Count() > 3 ? "\n..." : "");
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                if (start || dataSourceChanged)
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
            else if (dtCustomers.Columns[1].Name == column.Name || dtCustomers.Columns[2].Name == column.Name)
            {
                if (order == SortOrder.Descending) customers = customers.OrderByDescending(x => x.Name);
                else customers = customers.OrderBy(x => x.Name);
            }
            return customers;
        }

        private void DashboardForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            FormHelper.CloseApp();
        }

        private void DashboardForm_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            DataGridHelper.CreateButtonColumn(dtCustomers, "Edit", "Uredi");
            dtCustomers.Columns["Edit"].MinimumWidth = dtCustomers.Columns["Edit"].Width = 140;
            DataGridHelper.CreateButtonColumn(dtCustomers, "AddConstruction", "Dodaj građevinu");
            dtCustomers.Columns["AddConstruction"].Width = dtCustomers.Columns["AddConstruction"].MinimumWidth = 140;
            DrawForm();
            containerPanel.Size = pnBody.Size;
            UpdateStatistics();
            LoadCustomers();
            Activate();
            start = false;
        }

        private void DrawForm()
        {
            DataGridHelper.SetDefaultStyle(dtCustomers);
            BackColor = CustomColor.Background;
            lblCustomersTable.ForeColor = CustomColor.Text1;
            lblWelcome.ForeColor = CustomColor.Text3;
            lblName.ForeColor = CustomColor.Text1;
            lblName.Text = LoginForm.currentUser.GetName();
            lblName.Location = new Point(lblWelcome.Location.X + lblWelcome.Width, lblWelcome.Location.Y);
            lblInfoText.ForeColor = CustomColor.Text3;
            lblCustomers.ForeColor = lblExaminers.ForeColor = CustomColor.Text1;
            lblExaminerOne.ForeColor = lblExaminerTwo.ForeColor = lblExaminerThree.ForeColor = CustomColor.Text1;
            lblExaminerOneCount.ForeColor = lblExaminerTwoCount.ForeColor = lblExaminerThreeCount.ForeColor = CustomColor.Text3;
            chartCustomers.BackColor = CustomColor.PrimaryBackground;
            pbNotification.BackgroundImage = LoginForm.currentUser.IsDarkMode ? Properties.Resources.notification_dark : Properties.Resources.notification;
            btnAddNew.ForeColor = btnCheckAllCustomers.ForeColor = btnCheckAllExaminers.ForeColor = CustomColor.MainColor;
            btnAddNew.BackColor = btnCheckAllCustomers.BackColor = btnCheckAllExaminers.BackColor = CustomColor.PrimaryBackground;
            txtSearch.BackColor = CustomColor.White10;
            txtSearch.ForeColor = CustomColor.Text1;
            if (LoginForm.currentUser.IsAdmin) dtCustomers.Columns["Edit"].DefaultCellStyle.ForeColor = LoginForm.DarkMode ? Color.White : CustomColor.Green;
            dtCustomers.Columns["AddConstruction"].DefaultCellStyle.ForeColor = LoginForm.DarkMode ? Color.White : CustomColor.Green;
            menuUserControl1.RedrawControl();
        }

        private void UpdateStatistics()
        {
            try
            {
                chartCustomers.Series.Clear();
                chartCustomers.Series.Add(new Series { Name = "Customers", ChartType = SeriesChartType.Pie, Color = CustomColor.PrimaryBackground });
                chartCustomers.Series["Customers"]["PieLabelStyle"] = "Disabled";
                chartCustomers.BackColor = CustomColor.PrimaryBackground;
                chartCustomers.ChartAreas[0].BackColor = CustomColor.PrimaryBackground;
                chartCustomers.Legends[0].BackColor = CustomColor.PrimaryBackground;
                chartCustomers.Legends[0].ForeColor = CustomColor.Text1;
                int count = IReportExport.GetAll().Count();
                foreach (var item in IReportExport.GetAll().GroupBy(x => x.CustomerId).OrderByDescending(x => x.Count()).Take(3))
                {
                    chartCustomers.Series["Customers"].Points.AddXY(ICustomer.GetById(item.Key).Name + " (" + Math.Round(item.Count() * 100.0 / count) + "%)", item.Count());
                }
                int i = 0;
                foreach (var item in IReportExport.GetAll().GroupBy(x => x.UserId).OrderByDescending(x => x.Count()).Take(3))
                {
                    if (i == 0) UpdateExaminerStats(lblExaminerOne, lblExaminerOneCount, item.Key, item.Count());
                    else if (i == 1) UpdateExaminerStats(lblExaminerTwo, lblExaminerTwoCount, item.Key, item.Count());
                    else if (i == 2) UpdateExaminerStats(lblExaminerThree, lblExaminerThreeCount, item.Key, item.Count());
                    i++;
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                chartCustomers.Series.Clear();
                lblExaminerOne.Visible = lblExaminerOneCount.Visible = false;
                lblExaminerTwo.Visible = lblExaminerTwoCount.Visible = false;
                lblExaminerThree.Visible = lblExaminerThreeCount.Visible = false;
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja statistike... Molimo pokušajte ponovo kasnije!");

            }
        }

        private void UpdateExaminerStats(Label examiner, Label examinerCount, string userId, int count)
        {
            examiner.Visible = examinerCount.Visible = true;
            examiner.Text = IUser.GetById(userId).GetName();
            examinerCount.Text = $"Kreirao {count} izvještaj" + (count == 1 ? "" : "a");
        }

        private void Panel_Paint(object sender, PaintEventArgs e)
        {
            Panel p = sender as Panel;
            p.BackColor = CustomColor.PrimaryBackground;
            ControlPaint.DrawBorder(e.Graphics, p.DisplayRectangle, CustomColor.MainColor, ButtonBorderStyle.Solid);
        }

        private void pnReports_Paint(object sender, PaintEventArgs e)
        {
            Panel p = sender as Panel;
            p.BackColor = CustomColor.PrimaryBackground;
            ControlPaint.DrawBorder(e.Graphics, p.DisplayRectangle, CustomColor.White10, ButtonBorderStyle.Solid);
        }

        private void dtCustomers_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;
            string customerId = Convert.ToString(dtCustomers["Id", e.RowIndex].Value);
            if (LoginForm.currentUser.IsAdmin && e.ColumnIndex == dtCustomers.Columns["Edit"].Index)
            {
                Enabled = false;
                Customer customer = customers.SingleOrDefault(x => x.Id == customerId);
                if (CompositionRoot.Resolve<AddCustomerDialog>("customer", customer).ShowDialog() == DialogResult.OK)
                {
                    dataSourceChanged = true;
                    LoadCustomers();
                }
                Enabled = true;
            }
            else if (e.ColumnIndex == dtCustomers.Columns["AddConstruction"].Index)
            {
                Enabled = false;
                if (CompositionRoot.Resolve<AddCustomerConstructionDialog>(new Dictionary<string, object> { { "customerConstruction", null }, { "customerId", customerId } }).ShowDialog() == DialogResult.OK)
                {
                    dataSourceChanged = true;
                    LoadCustomers();
                }
                Enabled = true;
            }
        }

        private void dtCustomers_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;
            LoadingScreenHelper.StartLoadingScreen();
            string customerId = Convert.ToString(dtCustomers["Id", e.RowIndex].Value);
            loaded = false;
            WindowState = FormWindowState.Normal;
            Hide();
            loaded = true;
            CompositionRoot.Resolve<ConstructionsForm>("customerId", customerId).Show();
        }

        private void PlatformForm_Activated(object sender, EventArgs e)
        {
            if (!update || start) return;
            update = false;
            DrawForm();
            ReloadForm();
            UpdateStatistics();
        }

        private void btnCheckAllExaminers_Click(object sender, EventArgs e)
        {
            ShowNext(CompositionRoot.Resolve<ExaminersForm>());
        }

        private void btnCheckAllCustomers_Click(object sender, EventArgs e)
        {
            ShowNext(CompositionRoot.Resolve<CustomersForm>());
        }

        private void ShowNext(Form form)
        {
            LoadingScreenHelper.StartLoadingScreen();
            loaded = false;
            WindowState = FormWindowState.Normal;
            Hide();
            loaded = true;
            form.Show();
        }

        private void btnAddNew_Click(object sender, EventArgs e)
        {
            if (CompositionRoot.Resolve<AddCustomerDialog>("customer", null).ShowDialog() == DialogResult.OK)
            {
                dataSourceChanged = true;
                LoadCustomers();
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

        private void dtCustomers_Sorted(object sender, EventArgs e)
        {
            pbSearch_Click(pbSearch, e);
        }

        private void PlatformForm_Resize(object sender, EventArgs e)
        {
            if (WindowState == FormWindowState.Minimized) return;
            Size newSize = minimumSize;
            if (Size.Width >= minimumSize.Width) newSize.Width = Size.Width;
            if (Size.Height >= minimumSize.Height) newSize.Height = Size.Height;
            pnReports.Size = new Size(newSize.Width - pnReports.Location.X - rightMargin, newSize.Height - pnReports.Location.Y - bottomMargin);
            pbProfile.Location = new Point(newSize.Width - pbProfile.Width - rightMargin, pbProfile.Location.Y);
            pbNotification.Location = new Point(pbProfile.Location.X - pbNotification.Width - 15, pbNotification.Location.Y);
            dtCustomers.Size = new Size(pnReports.Size.Width - 2 * dtCustomers.Left, pnReports.Size.Height - dtCustomers.Location.Y - 2 * btnAddNew.Location.Y);
            btnAddNew.Location = new Point(pnReports.Size.Width - dtCustomers.Left - btnAddNew.Size.Width, btnAddNew.Location.Y);
            pbSearch.Location = new Point(btnAddNew.Location.X - pbSearch.Width - 6, pbSearch.Location.Y);
            txtSearch.Location = new Point(pbSearch.Location.X - 6 - txtSearch.Width, txtSearch.Location.Y);
        }
    }
}
