using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Forms;
using Interfaces;
using Microsoft.Office.Interop.Word;
using Models;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Management;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.Dialogs
{
    public partial class SelectFormsDialog : Form
    {
        private readonly string constructionId;
        private readonly ReportExport reportExport;
        private readonly IReportForm IReportForm;
        private readonly IReportExportForm IReportExportForm;
        private readonly IReportFormType IReportFormType;
        private readonly List<ReportForm> reportForms = new List<ReportForm>();
        private readonly List<int> formTypes = new List<int>();
        private FormsFilter formsFilter = new FormsFilter();
        private int currentPage = 0;
        private int pageSize = 30;
        private bool lastPage = false;
        private bool dataSourceChanged = true;

        public SelectFormsDialog(string constructionId, ReportExport reportExport, IReportForm iReportForm, IReportExportForm iReportExportForm, IReportFormType iReportFormType)
        {
            InitializeComponent();
            this.constructionId = constructionId;
            this.reportExport = reportExport;
            IReportForm = iReportForm;
            IReportExportForm = iReportExportForm;
            IReportFormType = iReportFormType;
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

        private void SelectFormsDialog_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            dtForms.EnableHeadersVisualStyles = false;
            BackColor = CustomColor.PrimaryBackground;
            btnFilter.ForeColor = btnAdd.ForeColor = CustomColor.MainColor;
            btnFilter.BackColor = btnAdd.BackColor = CustomColor.White10;
            DataGridHelper.SetDefaultStyle(dtForms);
            dtForms.ColumnHeadersDefaultCellStyle.SelectionBackColor = dtForms.ColumnHeadersDefaultCellStyle.BackColor;
            BackColor = CustomColor.Background;
            lblForms.ForeColor = CustomColor.Text1;
            lblClearFilter.ForeColor = CustomColor.MainColor;
            formTypes.AddRange(IReportFormType.GetAll().Where(x => x.TypeId == reportExport.TypeId).Select(x => x.Id).ToList());
            LoadForms();
        }

        private void LoadForms()
        {
            try
            {
                if (dataSourceChanged)
                {
                    dataSourceChanged = lastPage = false;
                    currentPage = 0;
                    dtForms.Rows.Clear();
                    reportForms.Clear();
                }
                if (lastPage) return;
                LoadingScreenHelper.StartLoadingScreen();
                List<string> selectedForms = IReportExportForm.GetByExport(reportExport.Id).Select(x => x.FormId).ToList();
                IQueryable<ReportForm> data = FilterClass.FilterForms(formsFilter, IReportForm.GetByConstruction(constructionId).Where(x => formTypes.Contains(x.TypeId) && !selectedForms.Contains(x.Id))).OrderBy(x => x.Ordinal).Skip(currentPage * pageSize).Take(pageSize);
                lastPage = data.Count() < pageSize;

                foreach (ReportForm reportForm in data)
                {
                    reportForms.Add(reportForm);
                    int rowIndex = dtForms.Rows.Add();
                    dtForms["Id", rowIndex].Value = reportForm.Id;
                    dtForms["ExaminationDate", rowIndex].Value = reportForm.ExaminationDate.ToShortDateString();
                    dtForms["Method", rowIndex].Value = IReportFormType.GetById(reportForm.TypeId).Name;
                    dtForms["Stock", rowIndex].Value = reportForm.Stock;
                }
                LoadingScreenHelper.EndScreen();
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                dtForms.Rows.Clear();
                reportForms.Clear();
                LoadingScreenHelper.EndScreen();
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja obrazaca... Molimo pokušajte ponovo kasnije!");
            }
        }

        private void btnAdd_Click(object sender, EventArgs e)
        {
            Enabled = false;
            try
            {
                DateTime now = DateTime.Now;
                List<ReportExportForm> reportExportForms = new List<ReportExportForm>();
                int ordinal = IReportExportForm.GetLastOrdinal(reportExport.Id, reportExport.TypeId);
                foreach (DataGridViewRow row in dtForms.SelectedRows)
                {
                    string formId = Convert.ToString(row.Cells["Id"].Value);
                    ReportExportForm reportExportForm = new ReportExportForm()
                    {
                        ExportId = reportExport.Id,
                        FormId = formId,
                        Ordinal = ordinal,
                        TypeId = reportExport.TypeId
                    };
                    reportExportForm.CreationTime = reportExportForm.UpdateTime = now;
                    reportExportForms.Add(reportExportForm);
                    ordinal++;
                }
                if (reportExportForms.Count > 0)
                {
                    IReportExportForm.AddRange(reportExportForms);
                    IReportExportForm.SaveChanges();
                    DialogResult = DialogResult.OK;
                }
                Close();
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom spremanja obrazaca za odabrani izvještaj... Molimo pokušajte ponovo kasnije!");
            }
            Enabled = true;
        }

        private void btnFilter_Click(object sender, EventArgs e)
        {
            Enabled = false;
            if (CompositionRoot.Resolve<FormsFilterDialog>(new Dictionary<string, object>() { { "formsFilter", formsFilter }, { "customerConstructionId", constructionId } }).ShowDialog() == DialogResult.OK)
            {
                lblClearFilter.Visible = true;
                dataSourceChanged = true;
                LoadForms();
            }
            Enabled = true;
        }

        private void lblClearFilter_Click(object sender, EventArgs e)
        {
            Enabled = false;
            lblClearFilter.Visible = false;
            formsFilter = new FormsFilter();
            dataSourceChanged = true;
            LoadForms();
            Enabled = true;
        }

        private void dtForms_Scroll(object sender, ScrollEventArgs e)
        {
            if (dtForms.DisplayedRowCount(true) + e.NewValue >= dtForms.Rows.Count - 5)
            {
                currentPage++;
                LoadForms();
            }
        }
    }
}
