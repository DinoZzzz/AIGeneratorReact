using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Dialogs;
using Interfaces;
using Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;

namespace AIGenerator.Forms
{
    public partial class ReportsForm : BaseForm
    {
        #region Variables
        private static ReportsForm privateReportsForm;
        public static ReportsForm reportsForm
        {
            get
            {
                update = true;
                LoadingScreenHelper.EndScreen();
                return privateReportsForm;
            }
        }
        private IUser IUser;
        private readonly ICustomer ICustomer;
        private IReportExport IReportExport;
        private readonly IReportExportForm IReportExportForm;
        private readonly IAppLog IAppLog;
        private CustomerConstruction customerConstruction;
        private static bool update = false;
        private List<ReportExport> reports = new List<ReportExport>();
        private int currentPage = 0;
        private int pageSize = 50;
        private bool lastPage = false;
        public bool dataSourceChanged = true;
        private string search = "";
        #endregion

        public ReportsForm(CustomerConstruction customerConstruction, IUser iUser, ICustomer iCustomer, IReportExport iReportExport, IReportExportForm iReportExportForm, IAppLog iAppLog) : base()
        {
            privateReportsForm = this;
            this.customerConstruction = customerConstruction;
            IUser = iUser;
            IReportExport = iReportExport;
            IReportExportForm = iReportExportForm;
            ICustomer = iCustomer;
            InitializeComponent();
            IAppLog = iAppLog;
        }

        private void ReportsForm_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            DataGridHelper.SetDefaultStyle(dtReports);
            AddColumns();
            BackColor = CustomColor.Background;
            lblReports.ForeColor = CustomColor.Text1;
            btnBack.ForeColor = btnAddNew.ForeColor = CustomColor.MainColor;
            btnBack.BackColor = btnAddNew.BackColor = CustomColor.PrimaryBackground;
            lblCustomer.ForeColor = lblConstruction.ForeColor = CustomColor.Text1;
            txtSearch.BackColor = CustomColor.White10;
            txtSearch.ForeColor = CustomColor.Text1;
            try
            {
                lblCustomer.Text = ICustomer.GetById(customerConstruction.CustomerId).Name;
            }
            catch
            {
                lblCustomer.Text = "";
            }
            lblConstruction.Text = customerConstruction.WorkOrder + ", " + customerConstruction.Construction;
            containerPanel.Size = pnBody.Size;
            LoadReports();
        }

        private void AddColumns()
        {
            if (!dtReports.Columns.Contains("EditColumn"))
            {
                DataGridHelper.CreateButtonColumn(dtReports, "EditColumn", "Otvori");
                dtReports.Columns["EditColumn"].DefaultCellStyle.ForeColor = CustomColor.MainColor;
            }
            if (LoginForm.currentUser.IsAdmin && !dtReports.Columns.Contains("RemoveColumn"))
            {
                DataGridHelper.CreateButtonColumn(dtReports, "RemoveColumn", "Ukloni");
                dtReports.Columns["RemoveColumn"].DefaultCellStyle.ForeColor = CustomColor.Red;
            }
        }

        private void ReportFillingForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            FormHelper.CloseApp();
        }

        private void LoadReports()
        {
            try
            {
                if (dataSourceChanged)
                {
                    dataSourceChanged = lastPage = false;
                    currentPage = 0;
                    dtReports.Rows.Clear();
                    reports.Clear();
                }
                if (lastPage) return;
                LoadingScreenHelper.StartLoadingScreen();
                IQueryable<ReportExport> reportQuery = IReportExport.GetByConstruction(customerConstruction.Id);
                if (!string.IsNullOrEmpty(search))
                {
                    reportQuery = reportQuery.Where(x => x.ConstructionPart.ToLower().Contains(search));
                }
                reportQuery = SortReportExports(reportQuery).Skip(currentPage * pageSize).Take(pageSize);
                lastPage = reportQuery.Count() < pageSize;
                foreach (ReportExport reportExport in reportQuery)
                {
                    if (reports.Any(x => x.Id == reportExport.Id)) continue;
                    reports.Add(reportExport);
                    int rowIndex = dtReports.Rows.Add();
                    dtReports["Id", rowIndex].Value = reportExport.Id;
                    User user = IUser.GetById(reportExport.CertifierId);
                    dtReports["Certifier", rowIndex].Value = user == null ? "" : user.GetName();
                    dtReports["CreatedBy", rowIndex].Value = IUser.GetById(reportExport.UserId).GetName();
                    dtReports["Construction", rowIndex].Value = reportExport.ConstructionPart;
                    dtReports["FormsCount", rowIndex].Value = IReportExportForm.GetByExport(reportExport.Id).Count();
                    dtReports["CreationTime", rowIndex].Value = reportExport.CreationTime.ToString("dd.MM.yyyy.");
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                dtReports.Rows.Clear();
                reports.Clear();
                LoadingScreenHelper.EndScreen();
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja izvještaja... Molimo pokušajte ponovo kasnije!");
            }
            LoadingScreenHelper.EndScreen();
        }

        private IQueryable<ReportExport> SortReportExports(IQueryable<ReportExport> reportExports)
        {
            DataGridViewColumn column = dtReports.SortedColumn;
            SortOrder order = dtReports.SortOrder;
            if (column == null)
            {
                reportExports = reportExports.OrderByDescending(x => x.CreationTime);
            }
            else if (dtReports.Columns[0].Name == column.Name)
            {
                if (order == SortOrder.Descending) reportExports = reportExports.OrderByDescending(x => x.ConstructionPart);
                else reportExports = reportExports.OrderBy(x => x.ConstructionPart);
            }
            else if ("CreationTime" == column.Name)
            {
                if (order == SortOrder.Descending) reportExports = reportExports.OrderByDescending(x => x.CreationTime);
                else reportExports = reportExports.OrderBy(x => x.CreationTime);
            }
            return reportExports;
        }

        private void ReportDataForm_Activated(object sender, EventArgs e)
        {
            if (!update) return;
            update = false;
            ReloadForm();
            if (dataSourceChanged)
            {
                IReportExport = CompositionRoot.Resolve<IReportExport>();
                LoadReports();
            }
        }

        private void dtReports_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;
            string reportExportId = Convert.ToString(dtReports["Id", e.RowIndex].Value);
            if (e.ColumnIndex == dtReports.Columns["EditColumn"].Index)
            {
                LoadingScreenHelper.StartLoadingScreen();
                ReportExport report = reports.SingleOrDefault(x => x.Id == reportExportId);
                ShowExportForm(report);
            }
            else if (LoginForm.currentUser.IsAdmin && e.ColumnIndex == dtReports.Columns["RemoveColumn"].Index)
            {
                Enabled = false;

                if (MessageClass.ShowQuestionBox("Jeste li sigurni da želite ukloniti ovaj izvještaj?") == DialogResult.Yes)
                {
                    try
                    {
                        IReportExportForm.RemoveByExport(reportExportId);
                        IReportExportForm.SaveChanges();
                        IReportExport.Remove(reportExportId);
                        IReportExport.SaveChanges();
                    }
                    catch (Exception ex)
                    {
                        ExceptionHelper.SaveLog(ex);
                        MessageClass.ShowErrorBox("Došle je do pogreške prilikom uklanjanja izvještaja... Molimo pokušajte ponovo kasnije!");
                        Enabled = true;
                        return;
                    }
                    dataSourceChanged = true;
                    LoadReports();
                }
                Enabled = true;
            }
        }

        private void dtReports_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;
            LoadingScreenHelper.StartLoadingScreen();
            string reportExportId = Convert.ToString(dtReports["Id", e.RowIndex].Value);
            ShowExportForm(reports.SingleOrDefault(x => x.Id == reportExportId));
        }

        private void ShowExportForm(ReportExport reportExport)
        {
            loaded = false;
            Hide();
            WindowState = FormWindowState.Normal;
            loaded = true;
            CompositionRoot.Resolve<ExportForm>(new Dictionary<string, object> { { "reportExport", reportExport }, { "customerConstruction", customerConstruction }, { "fromHistory", false } }).Show();
        }

        private void pnReports_Paint(object sender, PaintEventArgs e)
        {
            Panel p = sender as Panel;
            p.BackColor = CustomColor.PrimaryBackground;
            ControlPaint.DrawBorder(e.Graphics, p.DisplayRectangle, CustomColor.MainColor20, ButtonBorderStyle.Solid);
        }

        private void btnAddNew_Click(object sender, EventArgs e)
        {
            SelectReportTypeDialog selectReportTypeDialog = CompositionRoot.Resolve<SelectReportTypeDialog>("customerConstruction", customerConstruction);
            if (selectReportTypeDialog.ShowDialog() != DialogResult.OK) return;
            try
            {
                LoadingScreenHelper.StartLoadingScreen();
                ReportExport exportForm = new ReportExport()
                {
                    TypeId = selectReportTypeDialog.selectedType.Id,
                    ConstructionId = customerConstruction.Id,
                    CustomerId = customerConstruction.CustomerId,
                    UserId = LoginForm.currentUser.Id
                };
                exportForm.CreationTime = exportForm.UpdateTime = DateTime.Now;
                IReportExport.Add(exportForm);
                IReportExport.SaveChanges();
                dataSourceChanged = true;
                loaded = false;
                Hide();
                WindowState = FormWindowState.Normal;
                loaded = true;
                ShowExportForm(exportForm);
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                LoadingScreenHelper.EndScreen();
                MessageClass.ShowErrorBox("Došle je do pogreške prilikom dodavanja novog izvještaja... Molimo pokušajte ponovo kasnije!");
            }
        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            Close();
            ReportDataForm.reportDataForm.Show();
        }

        private void dtReports_Scroll(object sender, ScrollEventArgs e)
        {
            if (dtReports.DisplayedRowCount(true) + e.NewValue >= dtReports.Rows.Count - 5)
            {
                currentPage++;
                LoadReports();
            }
        }

        private void pbSearch_Click(object sender, EventArgs e)
        {
            Enabled = false;
            search = txtSearch.Text.ToLower();
            dataSourceChanged = true;
            LoadReports();
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

        private void dtReports_Sorted(object sender, EventArgs e)
        {
            pbSearch_Click(pbSearch, e);
        }

        private void ReportsForm_Resize(object sender, EventArgs e)
        {
            if (WindowState == FormWindowState.Minimized) return;
            Size newSize = minimumSize;
            if (Size.Width > minimumSize.Width) newSize.Width = Size.Width;
            if (Size.Height > minimumSize.Height) newSize.Height = Size.Height;
            pnReports.Size = new Size(newSize.Width - pnReports.Location.X - rightMargin, newSize.Height - pnReports.Location.Y - bottomMargin);
            dtReports.Size = new Size(pnReports.Size.Width - 2 * dtReports.Left, pnReports.Size.Height - dtReports.Location.Y - 2 * btnAddNew.Location.Y);
            btnAddNew.Location = new Point(pnReports.Size.Width - dtReports.Left - btnAddNew.Size.Width, btnAddNew.Location.Y);
            pbSearch.Location = new Point(btnAddNew.Location.X - pbSearch.Width - 6, pbSearch.Location.Y);
            txtSearch.Location = new Point(pbSearch.Location.X - 6 - txtSearch.Width, txtSearch.Location.Y);
        }
    }
}
