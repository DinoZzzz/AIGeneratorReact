using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Dialogs;
using Interfaces;
using Models;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.Forms
{
    public partial class ConstructionsForm : BaseForm
    {
        private static ConstructionsForm privateConstructionsForm;
        public static ConstructionsForm constructionsForm
        {
            get
            {
                update = true;
                return privateConstructionsForm;
            }
        }
        private IReportForm IReportForm;
        private readonly ICustomer ICustomer;
        private readonly ICustomerConstruction ICustomerConstruction;
        private string customerId;
        private static bool update = false;
        private List<CustomerConstruction> customerConstructions = new List<CustomerConstruction>();
        private int currentPage = 0;
        private int pageSize = 50;
        private bool lastPage = false;
        private bool dataSourceChanged = true;
        private string search = "";

        public ConstructionsForm(string customerId, IReportForm reportForm, ICustomerConstruction customerConstruction, ICustomer iCustomer) : base()
        {
            privateConstructionsForm = this;
            this.customerId = customerId;
            IReportForm = reportForm;
            ICustomerConstruction = customerConstruction;
            ICustomer = iCustomer;
            InitializeComponent();
        }

        private void ReportForm_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            DataGridHelper.SetDefaultStyle(dtForms);
            AddColumns();
            lblCustomer.ForeColor = CustomColor.Text1;
            lblCustomer.Text = ICustomer.GetById(customerId).Name;
            BackColor = CustomColor.Background;
            lblConstructions.ForeColor = CustomColor.Text1;
            btnAddNew.ForeColor = CustomColor.MainColor;
            btnAddNew.BackColor = CustomColor.PrimaryBackground;
            btnBack.ForeColor = CustomColor.MainColor;
            btnBack.BackColor = CustomColor.PrimaryBackground;
            txtSearch.BackColor = CustomColor.White10;
            txtSearch.ForeColor = CustomColor.Text1;
            containerPanel.Size = pnBody.Size;
            Activate();
            LoadCustomerConstructions();
        }

        private void AddColumns()
        {
            if (!dtForms.Columns.Contains("EditColumn"))
            {
                DataGridHelper.CreateButtonColumn(dtForms, "EditColumn", "Uredi");
                dtForms.Columns["EditColumn"].DefaultCellStyle.ForeColor = CustomColor.MainColor;

            }
            if (!dtForms.Columns.Contains("RemoveColumn"))
            {
                DataGridHelper.CreateButtonColumn(dtForms, "RemoveColumn", "Ukloni");
                dtForms.Columns["RemoveColumn"].DefaultCellStyle.ForeColor = CustomColor.Red;
            }
        }

        private void ReportFillingForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            FormHelper.CloseApp();
        }

        private void LoadCustomerConstructions()
        {
            try
            {
                if (dataSourceChanged)
                {
                    dataSourceChanged = lastPage = false;
                    currentPage = 0;
                    dtForms.Rows.Clear();
                    customerConstructions.Clear();
                }
                if (lastPage) return;
                LoadingScreenHelper.StartLoadingScreen();
                IQueryable<CustomerConstruction> data = ICustomerConstruction.GetByCustomer(customerId);
                if (!string.IsNullOrEmpty(search)) data = data.Where(x => x.WorkOrder.ToLower().Contains(search) || x.Construction.ToLower().Contains(search));
                data = SortCustomerConstructions(data).Skip(currentPage * pageSize).Take(pageSize);
                lastPage = data.Count() < pageSize;
                foreach (CustomerConstruction customerConstruction in data)
                {
                    if (customerConstructions.Any(x => x.Id == customerConstruction.Id)) return;
                    customerConstructions.Add(customerConstruction);
                    int rowIndex = dtForms.Rows.Add();
                    dtForms["Id", rowIndex].Value = customerConstruction.Id;
                    dtForms["WorkOrder", rowIndex].Value = customerConstruction.WorkOrder;
                    dtForms["ConstructionSite", rowIndex].Value = customerConstruction.Construction;
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                dtForms.Rows.Clear();
                customerConstructions.Clear();
                LoadingScreenHelper.EndScreen();
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja gradilišta... Molimo pokušajte ponovo kasnije!");
            }
            LoadingScreenHelper.EndScreen();
        }

        private IQueryable<CustomerConstruction> SortCustomerConstructions(IQueryable<CustomerConstruction> customerConstructions)
        {
            DataGridViewColumn column = dtForms.SortedColumn;
            SortOrder order = dtForms.SortOrder;
            if (column == null)
            {
                customerConstructions = customerConstructions.OrderByDescending(x => x.IsActive).ThenBy(x => x.WorkOrder);
            }
            else if (dtForms.Columns[0].Name == column.Name)
            {
                if (order == SortOrder.Descending) customerConstructions = customerConstructions.OrderByDescending(x => x.WorkOrder);
                else customerConstructions = customerConstructions.OrderBy(x => x.WorkOrder);
            }
            else if (dtForms.Columns[1].Name == column.Name)
            {
                if (order == SortOrder.Descending) customerConstructions = customerConstructions.OrderByDescending(x => x.Construction);
                else customerConstructions = customerConstructions.OrderBy(x => x.Construction);
            }
            return customerConstructions;
        }

        private void ConstructionsForm_Activated(object sender, EventArgs e)
        {
            if (!update) return;
            update = false;
            dataSourceChanged = true;
            IReportForm = CompositionRoot.Resolve<IReportForm>();
            ReloadForm();
            LoadCustomerConstructions();
        }

        private void dtForms_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;
            string constructionId = Convert.ToString(dtForms["Id", e.RowIndex].Value);
            if (e.ColumnIndex == dtForms.Columns["EditColumn"].Index)
            {
                Enabled = false;
                ShowCustomerConstructionDialog(customerConstructions.SingleOrDefault(x => x.Id == constructionId));
                Enabled = true;
            }
            else if (e.ColumnIndex == dtForms.Columns["RemoveColumn"].Index)
            {
                Enabled = false;
                if (MessageClass.ShowQuestionBox("Jeste li sigurni da želite ukloniti ovu građevinu i sve obrazce vezane na nju?") == DialogResult.Yes)
                {
                    try
                    {
                        IReportForm.RemoveByConstruction(constructionId);
                        IReportForm.SaveChanges();
                        ICustomerConstruction.Remove(constructionId);
                        ICustomerConstruction.SaveChanges();
                    }
                    catch (Exception ex)
                    {
                        ExceptionHelper.SaveLog(ex);
                        MessageClass.ShowErrorBox("Došlo je do pogreške prilikom uklanjanja građevine... Molimo pokušajte ponovo kasnije!");
                        Enabled = true;
                        return;
                    }
                    dataSourceChanged = true;
                    LoadCustomerConstructions();
                }
                Enabled = true;
            }
        }

        private void dtForms_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;
            string constructionId = Convert.ToString(dtForms["Id", e.RowIndex].Value);
            CustomerConstruction customerConstruction = customerConstructions.SingleOrDefault(x => x.Id == constructionId);
            if (customerConstruction == null) return;
            LoadingScreenHelper.StartLoadingScreen();
            loaded = false;
            Hide();
            WindowState = FormWindowState.Normal;
            loaded = true;
            CompositionRoot.Resolve<ReportDataForm>("customerConstruction", customerConstruction).Show();
        }

        private void ShowCustomerConstructionDialog(CustomerConstruction customerConstruction)
        {
            Enabled = false;
            if (CompositionRoot.Resolve<AddCustomerConstructionDialog>(new Dictionary<string, object> { { "customerConstruction", customerConstruction }, { "customerId", customerId } }).ShowDialog() == DialogResult.OK)
            {
                dataSourceChanged = true;
                LoadCustomerConstructions();
            }
            Enabled = true;
        }

        private void pnReports_Paint(object sender, PaintEventArgs e)
        {
            Panel p = sender as Panel;
            p.BackColor = CustomColor.PrimaryBackground;
            ControlPaint.DrawBorder(e.Graphics, p.DisplayRectangle, CustomColor.MainColor20, ButtonBorderStyle.Solid);
        }

        private void btnAddNew_Click(object sender, EventArgs e)
        {
            ShowCustomerConstructionDialog(null);
        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            Close();
            PlatformForm.platformForm.Show();
        }

        private void dtForms_Scroll(object sender, ScrollEventArgs e)
        {
            if (dtForms.DisplayedRowCount(true) + e.NewValue >= dtForms.Rows.Count - 5)
            {
                currentPage++;
                LoadCustomerConstructions();
            }
        }

        private void pbSearch_Click(object sender, EventArgs e)
        {
            Enabled = false;
            search = txtSearch.Text.ToLower();
            dataSourceChanged = true;
            LoadCustomerConstructions();
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

        private void dtForms_Sorted(object sender, EventArgs e)
        {
            pbSearch_Click(pbSearch, e);
        }

        private void ConstructionsForm_Resize(object sender, EventArgs e)
        {
            if (WindowState == FormWindowState.Minimized) return;
            Size newSize = minimumSize;
            if (Size.Width > minimumSize.Width) newSize.Width = Size.Width;
            if (Size.Height > minimumSize.Height) newSize.Height = Size.Height;
            pnReports.Size = new Size(newSize.Width - pnReports.Location.X - rightMargin, newSize.Height - pnReports.Location.Y - bottomMargin);
            dtForms.Size = new Size(pnReports.Size.Width - 2 * dtForms.Left, pnReports.Size.Height - dtForms.Location.Y - 2 * btnAddNew.Location.Y);
            btnAddNew.Location = new Point(pnReports.Size.Width - dtForms.Left - btnAddNew.Size.Width, btnAddNew.Location.Y);
            pbSearch.Location = new Point(btnAddNew.Location.X - pbSearch.Width - 6, pbSearch.Location.Y);
            txtSearch.Location = new Point(pbSearch.Location.X - 6 - txtSearch.Width, txtSearch.Location.Y);
        }
    }
}
