using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Dialogs;
using Common;
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
    public partial class ExportForm : BaseForm
    {
        private static ExportForm privateExportForm;
        public static ExportForm exportForm
        {
            get
            {
                update = true;
                return privateExportForm;
            }
        }
        private readonly CustomerConstruction customerConstruction;
        private ReportExport reportExport;
        private readonly IReportExport IReportExport;
        private readonly IReportExportForm IReportExportForm;
        private IReportForm IReportForm;
        private readonly IReportFormType IReportFormType;
        private readonly IReportFile IReportFile;
        private readonly IUser IUser;
        private readonly ICustomer ICustomer;
        private readonly IFTPService IFTPService;
        private readonly List<ReportExportForm> exportForms = new List<ReportExportForm>();
        private readonly bool fromHistory;
        private static bool update = false;
        private Rectangle dragBoxFromMouseDown;
        private int rowIndexFromMouseDown;
        private int rowIndexOfItemUnderMouseToDrop;
        private readonly bool isReadOnly = false;
        private int currentPage = 0;
        private int pageSize = 50;
        private bool dataSourceChanged = true;
        private bool lastPage = false;

        public ExportForm(ReportExport reportExport, CustomerConstruction customerConstruction, bool fromHistory, IReportExport iReportExport, IReportExportForm iReportExportForm, IReportForm iREportForm, IReportFormType iReportFormType, IReportFile iReportFile, IUser iUser, ICustomer iCustomer, IFTPService iFTPService) : base()
        {
            privateExportForm = this;
            InitializeComponent();
            this.reportExport = reportExport;
            this.customerConstruction = customerConstruction;
            this.fromHistory = fromHistory;
            IReportExport = iReportExport;
            IReportExportForm = iReportExportForm;
            IReportForm = iREportForm;
            IReportFormType = iReportFormType;
            IUser = iUser;
            ICustomer = iCustomer;
            IFTPService = iFTPService;
            isReadOnly = !(LoginForm.currentUser.IsAdmin || reportExport.UserId == LoginForm.currentUser.Id);
            IReportFile = iReportFile;
        }

        private void SetReadonly()
        {
            dtExaminationDate.Enabled = txtDrainage.Enabled = txtConstructionPart.Enabled = !isReadOnly;
            txtAirDeviation.Enabled = txtAirRemark.Enabled = !isReadOnly;
            txtWaterDeviation.Enabled = txtWaterRemark.Enabled = !isReadOnly;
        }

        private void ExportForm_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            DataGridHelper.SetDefaultStyle(dtForms);
            AddColumns();
            foreach (DataGridViewColumn column in dtForms.Columns) column.SortMode = DataGridViewColumnSortMode.NotSortable;
            BackColor = CustomColor.Background;
            txtDrainage.BackColor = txtWaterDeviation.BackColor = txtWaterRemark.BackColor = txtAirDeviation.BackColor = txtAirRemark.BackColor = txtConstructionPart.BackColor = CustomColor.White10;
            txtDrainage.ForeColor = txtWaterDeviation.ForeColor = txtWaterRemark.ForeColor = txtAirDeviation.ForeColor = txtAirRemark.ForeColor = txtConstructionPart.ForeColor = CustomColor.Text1;
            gbAir.ForeColor = lblDrainage.ForeColor = gbWater.ForeColor = CustomColor.Text2;
            lblCertifier.ForeColor = lblDrainage.ForeColor = lblExaminationDate.ForeColor = lblWaterDeviation.ForeColor = lblWaterRemark.ForeColor = lblAirDeviation.ForeColor = lblAirRemark.ForeColor = lblConstructionPart.ForeColor = CustomColor.Text2;
            cbCertifier.ForeColor = CustomColor.Text1;
            cbCertifier.BackColor = CustomColor.White10;
            lblForms.ForeColor = CustomColor.Text1;
            btnPhotos.ForeColor = btnAddNew.ForeColor = btnSave.ForeColor = btnCertify.ForeColor = btnGenerate.ForeColor = CustomColor.MainColor;
            btnPhotos.BackColor = btnAddNew.BackColor = btnSave.BackColor = btnCertify.BackColor = btnGenerate.BackColor = CustomColor.PrimaryBackground;
            btnSave.Text = reportExport.UserId == LoginForm.currentUser.Id || LoginForm.currentUser.IsAdmin ? "Spremi i završi" : "Povratak";
            containerPanel.Size = pnBody.Size;
            SetReadonly();
            Activate();
            LoadData();
            LoadForms();
        }

        private void AddColumns()
        {
            if ((LoginForm.currentUser.IsAdmin || LoginForm.currentUser.Id == reportExport.UserId) && !dtForms.Columns.Contains("RemoveColumn"))
            {
                DataGridHelper.CreateButtonColumn(dtForms, "RemoveColumn", "Ukloni s popisa");
                dtForms.Columns["RemoveColumn"].DefaultCellStyle.ForeColor = CustomColor.Red;
                dtForms.Columns["RemoveColumn"].Width = 140;
            }
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
                    exportForms.Clear();
                }
                if (lastPage) return;
                LoadingScreenHelper.StartLoadingScreen();
                IQueryable<ReportExportForm> formsQuery = IReportExportForm.GetByExport(reportExport.Id).OrderBy(x => x.Ordinal).Skip(currentPage * pageSize).Take(pageSize);
                lastPage = formsQuery.Count() < pageSize;
                foreach (ReportExportForm exportForm in formsQuery)
                {
                    ReportForm reportForm = IReportForm.GetById(exportForm.FormId);
                    exportForm.ReportForm = reportForm;
                    exportForms.Add(exportForm);
                    int rowIndex = dtForms.Rows.Add();
                    dtForms["Id", rowIndex].Value = exportForm.Id;
                    dtForms["ExaminationDate", rowIndex].Value = reportForm.ExaminationDate.ToShortDateString();
                    dtForms["Method", rowIndex].Value = IReportFormType.GetById(reportForm.TypeId).Name;
                    dtForms["Stock", rowIndex].Value = reportForm.Stock;
                    dtForms["Satisfies", rowIndex].Value = reportForm.Satisfies ? "DA" : "NE";
                    rowIndex++;
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                dtForms.Rows.Clear();
                exportForms.Clear();
                LoadingScreenHelper.EndScreen();
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja obrazaca... Molimo pokušajte ponovo kasnije!"); ;
            }
            dtForms.AllowDrop = dtForms.Rows.Count > 1 && (LoginForm.currentUser.Id == reportExport.UserId || LoginForm.currentUser.IsAdmin);
            UpdateButtons();
            LoadingScreenHelper.EndScreen();
        }

        private void UpdateButtons()
        {
            if (dtForms.Rows.Count <= 0)
            {
                btnCertify.Visible = btnGenerate.Visible = false;
                return;
            }
            btnGenerate.Visible = true;
        }

        private void LoadData()
        {
            cbCertifier.Items.Clear();
            foreach(User user in IUser.GetAll().Where(x => !string.IsNullOrEmpty(x.Title) && x.IsAdmin))
            {
                cbCertifier.Items.Add(user);
                if (reportExport.CertifierId == user.Id) cbCertifier.SelectedItem = user;
            }
            if (cbCertifier.SelectedItem == null && cbCertifier.Items.Count > 0) cbCertifier.SelectedIndex = 0;
            txtConstructionPart.Text = reportExport.ConstructionPart;
            txtDrainage.Text = reportExport.Drainage;
            dtExaminationDate.Value = reportExport.ExaminationDate;
            txtWaterRemark.Text = reportExport.WaterRemark;
            txtWaterDeviation.Text = reportExport.WaterDeviation;
            txtAirRemark.Text = reportExport.AirRemark;
            txtAirDeviation.Text = reportExport.AirDeviation;
        }

        private bool SaveData()
        {
            try
            {
                ReportExport oldReportExport = IReportExport.GetById(reportExport.Id);
                reportExport.ConstructionPart = oldReportExport.ConstructionPart = txtConstructionPart.Text;
                reportExport.Drainage = oldReportExport.Drainage = txtDrainage.Text;
                reportExport.ExaminationDate = oldReportExport.ExaminationDate = dtExaminationDate.Value;
                reportExport.WaterRemark = oldReportExport.WaterRemark = txtWaterRemark.Text;
                reportExport.WaterDeviation = oldReportExport.WaterDeviation = txtWaterDeviation.Text;
                reportExport.AirRemark = oldReportExport.AirRemark = txtAirRemark.Text;
                reportExport.AirDeviation = oldReportExport.AirDeviation = txtAirDeviation.Text;
                if(cbCertifier.SelectedItem == null)  reportExport.CertifierId = oldReportExport.CertifierId = "";
                else reportExport.CertifierId = oldReportExport.CertifierId = (cbCertifier.SelectedItem as User).Id;
                reportExport.UpdateTime = oldReportExport.UpdateTime = DateTime.Now;
                IReportExport.SaveChanges();
                if (ReportsForm.reportsForm != null) ReportsForm.reportsForm.dataSourceChanged = true;
                return true;
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom spremanja izvještaja... Molimo pokušajte ponovo kasnije!");
                return false;
            }
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            Enabled = false;
            LoadingScreenHelper.StartLoadingScreen("Spremanje izvještaja...");
            if (SaveData()) GetBack();
            Enabled = true;
        }

        private void GetBack()
        {
            Close();
            if (fromHistory) CompositionRoot.Resolve<HistoryForm>().Show();
            else
            {
                ReportsForm.reportsForm.Show();
                ReportsForm.reportsForm.Activate();
            }
        }

        private void dtForms_MouseMove(object sender, MouseEventArgs e)
        {
            if ((e.Button & MouseButtons.Left) == MouseButtons.Left)
            {
                // If the mouse moves outside the rectangle, start the drag.
                if (dragBoxFromMouseDown != Rectangle.Empty && !dragBoxFromMouseDown.Contains(e.X, e.Y))
                {
                    // Proceed with the drag and drop, passing in the list item.                   
                    dtForms.DoDragDrop(dtForms.Rows[rowIndexFromMouseDown], DragDropEffects.Move);
                }
            }
        }

        private void dtForms_MouseDown(object sender, MouseEventArgs e)
        {
            // Get the index of the item the mouse is below.
            rowIndexFromMouseDown = dtForms.HitTest(e.X, e.Y).RowIndex;

            if (rowIndexFromMouseDown != -1)
            {
                // Remember the point where the mouse down occurred.
                // The DragSize indicates the size that the mouse can move
                // before a drag event should be started.               
                Size dragSize = SystemInformation.DragSize;

                // Create a rectangle using the DragSize, with the mouse position being
                // at the center of the rectangle.
                dragBoxFromMouseDown = new Rectangle(new Point(e.X - (dragSize.Width / 2), e.Y - (dragSize.Height / 2)), dragSize);
            }
            // Reset the rectangle if the mouse is not over an item in the ListBox.
            else dragBoxFromMouseDown = Rectangle.Empty;
        }

        private void dtForms_DragDrop(object sender, DragEventArgs e)
        {
            // The mouse locations are relative to the screen, so they must be
            // converted to client coordinates.
            Point clientPoint = dtForms.PointToClient(new Point(e.X, e.Y));

            // Get the row index of the item the mouse is below.
            rowIndexOfItemUnderMouseToDrop = dtForms.HitTest(clientPoint.X, clientPoint.Y).RowIndex;

            // If the drag operation was a move then remove and insert the row.
            if (e.Effect == DragDropEffects.Move)
            {
                try
                {
                    DataGridViewRow rowToMove = e.Data.GetData(typeof(DataGridViewRow)) as DataGridViewRow;
                    dtForms.Rows.RemoveAt(rowIndexFromMouseDown);
                    if (rowIndexOfItemUnderMouseToDrop == -1)
                    {
                        if (clientPoint.Y < 50) rowIndexOfItemUnderMouseToDrop = 0;
                        else rowIndexOfItemUnderMouseToDrop = dtForms.Rows.Count;
                    }
                    dtForms.Rows.Insert(rowIndexOfItemUnderMouseToDrop, rowToMove);
                    foreach (DataGridViewRow row in dtForms.Rows)
                    {
                        ReportExportForm form = exportForms.SingleOrDefault(x => x.Id == Convert.ToString(row.Cells["Id"].Value));
                        if (form == null) continue;
                        form.Ordinal = row.Index;
                    }
                    List<ReportExportForm> list = new List<ReportExportForm>();
                    list.AddRange(exportForms);
                    IReportExportForm.Update(list, reportExport.Id);
                    IReportExportForm.SaveChanges();
                }
                catch (Exception ex)
                {
                    ExceptionHelper.SaveLog(ex);
                    MessageClass.ShowErrorBox("Došlo je do pogreške prilikom mijenja redoslijeda obrazaca... Molimo pokušajte ponovo kasnije!");
                }
            }
        }

        private void dtForms_DragOver(object sender, DragEventArgs e)
        {
            e.Effect = DragDropEffects.Move;
        }

        private void ExportForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            FormHelper.CloseApp();
        }

        private void btnAddNew_Click(object sender, EventArgs e)
        {
            Enabled = false;
            if (CompositionRoot.Resolve<SelectFormsDialog>(new Dictionary<string, object> { { "constructionId", customerConstruction.Id }, { "reportExport", reportExport } }).ShowDialog() == DialogResult.OK)
            {
                dataSourceChanged = true;
                LoadForms();
                if (string.IsNullOrEmpty(txtAirDeviation.Text))
                {
                    txtWaterDeviation.Text = exportForms.Any(x => x.ReportForm.DraftId == 2 && x.ReportForm.WaterHeight - x.ReportForm.PipeDiameter < 100) ? "Kod pojedinih dionica h2<100cm" : "";
                }
            }
            Enabled = true;
        }

        private void dtForms_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;
            string formId = Convert.ToString(dtForms["Id", e.RowIndex].Value);
            if ((LoginForm.currentUser.IsAdmin || LoginForm.currentUser.Id == reportExport.UserId) && e.ColumnIndex == dtForms.Columns["RemoveColumn"].Index)
            {
                Enabled = false;
                if (MessageClass.ShowQuestionBox("Jeste li sigurni da želite ukloniti ovaj obrazac s popisa?") == DialogResult.Yes)
                {
                    try
                    {
                        IReportExportForm.Remove(formId);
                        IReportExportForm.SaveChanges();
                    }
                    catch (Exception ex)
                    {
                        ExceptionHelper.SaveLog(ex);
                        MessageClass.ShowErrorBox("Došlo je do pogreške prilikom uklanjanja obrazca sa liste... Molimo pokušajte ponovo kasnije!");
                        Enabled = true;
                        return;
                    }
                    dataSourceChanged = true;
                    LoadForms();
                }
                Enabled = true;
            }
        }

        private void dtForms_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;
            string exportId = Convert.ToString(dtForms["Id", e.RowIndex].Value);
            ReportExportForm reportExportForm = exportForms.SingleOrDefault(x => x.Id == exportId);
            if (reportExportForm == null) return;
            loaded = false;
            Hide();
            WindowState = FormWindowState.Normal;
            loaded = true;
            MethodFormHelper.OpenForm(reportExportForm.ReportForm, typeof(ExportForm).Name);
        }

        private void btnCertify_Click(object sender, EventArgs e)
        {
            Enabled = false;
            if (MessageClass.ShowQuestionBox("Nakon što ovjerite izvještaj, on se više neće moći uređivati. Želite li nastaviti?") == DialogResult.Yes)
            {
                if (SaveData())
                {
                    try
                    {
                        ReportExport oldReport = IReportExport.GetById(reportExport.Id);
                        oldReport.IsFinished = true;
                        oldReport.CertificationTime = oldReport.UpdateTime = DateTime.Now;
                        reportExport = oldReport;
                        IReportExport.SaveChanges();
                        LoadForms();
                        MessageClass.ShowInfoBox("Izvještaj je uspješno ovjeren!");
                        UpdateButtons();
                    }
                    catch (Exception ex)
                    {
                        ExceptionHelper.SaveLog(ex);
                        MessageClass.ShowErrorBox("Došlo je do pogreške prilikom ovjeravanja izvještaja... Molimo pokušajte ponovo kasnije!");
                    }
                }
            }
            Enabled = true;
        }

        private void btnGenerate_Click(object sender, EventArgs e)
        {
            Enabled = false;
            if (!SaveData())
            {
                Enabled = true;
                return;
            }
            SaveFileDialog saveFileDialog = new SaveFileDialog();
            saveFileDialog.Filter = "Word document (.doc)|*.doc";
            saveFileDialog.InitialDirectory = Path.GetFullPath(Environment.GetFolderPath(Environment.SpecialFolder.Desktop));
            saveFileDialog.RestoreDirectory = true;
            saveFileDialog.FileName = reportExport.ConstructionPart;
            if (saveFileDialog.ShowDialog() == DialogResult.OK)
            {
                string tempPath = Path.Combine(AppData.FILES_FOLDER_PATH, Path.GetFileNameWithoutExtension(saveFileDialog.FileName) + DateTime.Now.ToString("ddMMyyyyHHmmss") + Path.GetExtension(saveFileDialog.FileName));
                try
                {
                    LoadingScreenHelper.StartLoadingScreen("Generiranje izvještaja...");
                    MSWord msWord = CompositionRoot.Resolve<MSWord>();
                    reportExport.ReportFiles = new List<ReportFile>();
                    foreach (ReportFile reportFile in IReportFile.GetByReport(reportExport.Id).OrderBy(x => x.Ordinal))
                    {
                        reportExport.ReportFiles.Add(reportFile);
                        if (reportFile.Extension.ToLower() == ".pdf") reportExport.ReportFiles.AddRange(IReportFile.GetByPdf(reportFile.Id));
                    }
                    
                    bool result = msWord.Export(tempPath, reportExport);
                    if (result)
                    {
#if RELEASE
                        Customer customer = ICustomer.GetById(customerConstruction.CustomerId);
                        IFTPService.UploadToAIServer(customer == null ? "" : customer.WorkOrder + " " + customer.Name, customerConstruction.WorkOrder, tempPath);
#endif
                        File.Copy(tempPath, saveFileDialog.FileName, true);
                    }
                    if (File.Exists(tempPath)) File.Delete(tempPath);
                    LoadingScreenHelper.EndScreen();
                    Activate();
                    if (!result) MessageClass.ShowErrorBox("Došlo je do pogreške prilikom generiranja izvještaja. Molimo pokušajte ponovno kasnije!");
                    else MessageClass.ShowInfoBox("Izvještaj je uspješno generiran i spremljen na odabranu lokaciju.");
                }
                catch (Exception ex)
                {
                    ExceptionHelper.SaveLog(ex);
                    if (File.Exists(tempPath)) File.Delete(tempPath);
                    LoadingScreenHelper.EndScreen();
                    Activate();
                    MessageClass.ShowErrorBox("Došlo je do pogreške prilikom generiranja izvještaja. Molimo pokušajte ponovno kasnije!");
                }
            }
            Activate();
            Enabled = true;
        }

        private void pnReports_Paint(object sender, PaintEventArgs e)
        {
            Panel p = sender as Panel;
            p.BackColor = CustomColor.PrimaryBackground;
            ControlPaint.DrawBorder(e.Graphics, p.DisplayRectangle, CustomColor.MainColor20, ButtonBorderStyle.Solid);
        }

        private void ExportForm_Activated(object sender, EventArgs e)
        {
            if (!update) return;
            update = false;
            dataSourceChanged = true;
            IReportForm = CompositionRoot.Resolve<IReportForm>();
            ReloadForm();
            LoadForms();
        }

        private void btnPhotos_Click(object sender, EventArgs e)
        {
            loaded = false;
            LoadingScreenHelper.StartLoadingScreen();
            Hide();
            WindowState = FormWindowState.Normal;
            loaded = true;
            CompositionRoot.Resolve<ReportPhotosForm>(new Dictionary<string, object> { { "reportExport", reportExport }, { "isReadOnly", isReadOnly } }).Show();
        }

        private void dtForms_Scroll(object sender, ScrollEventArgs e)
        {
            if (dtForms.DisplayedRowCount(true) + e.NewValue >= dtForms.Rows.Count - 5)
            {
                currentPage++;
                LoadForms();
            }
        }

        private void ExportForm_Resize(object sender, EventArgs e)
        {
            Size newSize = minimumSize;
            if (Size.Width > minimumSize.Width) newSize.Width = Size.Width;
            if (Size.Height > minimumSize.Height) newSize.Height = Size.Height;
            pnReports.Size = new Size(newSize.Width - pnReports.Location.X - rightMargin, newSize.Height - pnReports.Location.Y - bottomMargin);
            btnGenerate.Location = btnCertify.Location = new Point(newSize.Width - btnGenerate.Width - rightMargin, btnGenerate.Location.Y);
            dtForms.Size = new Size(pnReports.Size.Width - 2 * dtForms.Left, pnReports.Size.Height - dtForms.Location.Y - 2 * btnAddNew.Location.Y);
            btnAddNew.Location = new Point(pnReports.Size.Width - dtForms.Left - btnAddNew.Size.Width, btnAddNew.Location.Y);
        }
    }
}
