using AIGenerator.AppBindings;
using AIGenerator.Common;
using Interfaces;
using Models;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Xml.Linq;

namespace AIGenerator.Forms
{
    public partial class HistoryForm : BaseForm
    {
        private readonly ICustomerConstruction ICustomerConstruction;
        private readonly IUser IUser;
        private readonly IReportExport IReportExport;
        private readonly IReportExportForm IReportExportForm;
        private readonly List<ReportExport> reportExports = new List<ReportExport>();
        private int currentPage = 0;
        private int pageSize = 50;
        private bool lastPage = false;
        private bool dataSourceChanged = true;
        private string search = "";

        public HistoryForm(IUser user, ICustomerConstruction iCustomerConstruction, IReportExportForm iReportExportForm, IReportExport iReportExport) : base()
        {
            IUser = user;
            InitializeComponent();
            menuUserControl1.SetSelectedItem(MenuItems.History);
            ICustomerConstruction = iCustomerConstruction;
            IReportExportForm = iReportExportForm;
            IReportExport = iReportExport;
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
                    reportExports.Clear();
                }
                if (lastPage) return;
                LoadingScreenHelper.StartLoadingScreen();
                IQueryable<ReportExport> data = IReportExport.GetAll();
                if (!string.IsNullOrEmpty(search)) data = data.Where(x => x.ConstructionPart.ToLower().Contains(search));
                data = SortReportExports(data).Skip(currentPage * pageSize).Take(pageSize);
                lastPage = data.Count() < pageSize;
                foreach (ReportExport reportExport in data)
                {
                    reportExports.Add(reportExport);
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
                reportExports.Clear();
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

        private void HistoryForm_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            BackColor = CustomColor.Background;
            DataGridHelper.SetDefaultStyle(dtReports);
            AddColumns();
            lblShortView.ForeColor = CustomColor.Text1;
            txtSearch.BackColor = CustomColor.White10;
            txtSearch.ForeColor = CustomColor.Text1;
            containerPanel.Size = pnBody.Size;
            LoadReports();
            Invalidate();            
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
            //dtForms.Columns["EditColumn"].Visible = dtForms.Columns["RemoveColumn"].Visible = (LoginForm.currentUser.IsAdmin || LoginForm.currentUser.Id == report.UserId) && string.IsNullOrEmpty(report.CertifierId);
        }

        private void HistoryForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            FormHelper.CloseApp();
        }

        private void txtSearch_TextChanged(object sender, EventArgs e)
        {
            LoadReports();
        }

        private void dtReports_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;
            string reportExportId = Convert.ToString(dtReports["Id", e.RowIndex].Value);
            ShowExportForm(reportExports.SingleOrDefault(x => x.Id == reportExportId));
        }

        private void ShowExportForm(ReportExport reportExport)
        {
            loaded = false;
            LoadingScreenHelper.StartLoadingScreen();
            Hide();
            WindowState = FormWindowState.Normal;
            loaded = true;
            try
            {
                CustomerConstruction customerConstruction = ICustomerConstruction.GetById(reportExport.ConstructionId);
                CompositionRoot.Resolve<ExportForm>(new Dictionary<string, object> { { "reportExport", reportExport }, { "customerConstruction", customerConstruction }, { "fromHistory", true } }).Show();
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom otvaranja izvještaja... Molimo pokušajte ponovo kasnije!");
            }
        }

        private void pnReports_Paint(object sender, PaintEventArgs e)
        {
            Panel p = sender as Panel;
            p.BackColor = CustomColor.PrimaryBackground;
            ControlPaint.DrawBorder(e.Graphics, p.DisplayRectangle, CustomColor.MainColor20, ButtonBorderStyle.Solid);
        }

        private void dtReports_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;
            string reportExportId = Convert.ToString(dtReports["Id", e.RowIndex].Value);
            if (e.ColumnIndex == dtReports.Columns["EditColumn"].Index)
            {
                ReportExport report = reportExports.SingleOrDefault(x => x.Id == reportExportId);
                //if (!LoginForm.currentUser.IsAdmin && LoginForm.currentUser.Id != report.UserId) return;
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
                        MessageClass.ShowErrorBox("Došlo je do pogreške prilikom uklanjanja izvještaja... Molimo pokušajte ponovo kasnije!");
                        Enabled = true;
                        return;
                    }
                    dataSourceChanged = true;
                    LoadReports();
                }
                Enabled = true;
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

        private void dtReports_Scroll(object sender, ScrollEventArgs e)
        {
            if (dtReports.DisplayedRowCount(true) + e.NewValue >= dtReports.Rows.Count - 5)
            {
                currentPage++;
                LoadReports();
            }
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

        private void HistoryForm_Resize(object sender, EventArgs e)
        {
            Size newSize = minimumSize;
            if (Size.Width > minimumSize.Width) newSize.Width = Size.Width;
            if (Size.Height > minimumSize.Height) newSize.Height = Size.Height;
            pnReports.Size = new Size(newSize.Width - pnReports.Location.X - rightMargin, newSize.Height - pnReports.Location.Y - bottomMargin);
            dtReports.Size = new Size(pnReports.Size.Width - 2 * dtReports.Left, pnReports.Size.Height - dtReports.Location.Y - 2 * lblShortView.Location.Y);
            pbSearch.Location = new Point(pnReports.Size.Width - dtReports.Left - pbSearch.Size.Width, pbSearch.Location.Y);
            txtSearch.Location = new Point(pbSearch.Location.X - 20 - txtSearch.Width, txtSearch.Location.Y);
        }
    }
}
