using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Dialogs;
using Common;
using Interfaces;
using Models;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Windows.Forms;

namespace AIGenerator.Forms
{
    public partial class ReportDataForm : BaseForm
    {
        #region Variables
        private static ReportDataForm privateReportDataForm;
        public static ReportDataForm reportDataForm
        {
            get
            {
                update = true;
                return privateReportDataForm;
            }
        }
        private IReportForm IReportForm;
        private readonly IReportDraft IReportDraft;
        private readonly IMaterial IMaterial;
        private readonly IMaterialType IMaterialType;
        private readonly IReportFormType IReportFormType;
        private readonly ICustomer ICustomer;
        private readonly ICustomerConstruction ICustomerConstruction;
        private readonly IExaminationProcedure IExaminationProcedure;
        private readonly IReportExportForm IReportExportForm;
        private readonly IFTPService IFTPService;
        private CustomerConstruction customerConstruction;
        private static bool update = false;
        private List<ReportForm> reportForms = new List<ReportForm>();
        private Rectangle dragBoxFromMouseDown;
        private int rowIndexFromMouseDown;
        private int rowIndexOfItemUnderMouseToDrop;
        private int currentPage = 0;
        private int pageSize = 50;
        private FormsFilter formsFilter = new FormsFilter();
        private bool lastPage = false;
        public bool dataSourceChanged = true;
        private bool? anyForms = null;
        #endregion

        public ReportDataForm(CustomerConstruction customerConstruction, IReportForm reportForm, IReportDraft reportDraft, IMaterial material, IMaterialType materialType, IReportFormType reportFormType, ICustomerConstruction iCustomerConstruction, IExaminationProcedure iExaminationProcedure, ICustomer iCustomer, IReportExportForm iReportExportForm, IFTPService iFTPService) : base()
        {
            privateReportDataForm = this;
            this.customerConstruction = customerConstruction;
            IReportForm = reportForm;
            IReportDraft = reportDraft;
            IMaterial = material;
            IMaterialType = materialType;
            IReportFormType = reportFormType;
            ICustomerConstruction = iCustomerConstruction;
            IExaminationProcedure = iExaminationProcedure;
            ICustomer = iCustomer;
            InitializeComponent();
            IReportExportForm = iReportExportForm;
            IFTPService = iFTPService;
        }

        private void ReportForm_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            DataGridHelper.SetDefaultStyle(dtForms);
            AddColumns();
            foreach (DataGridViewColumn column in dtForms.Columns) column.SortMode = DataGridViewColumnSortMode.NotSortable;
            BackColor = CustomColor.Background;
            lblClearFilter.ForeColor = CustomColor.MainColor;
            lblForms.ForeColor = CustomColor.Text1;
            btnFilter.ForeColor = btnSavePDF.ForeColor = btnAddNew.ForeColor = CustomColor.MainColor;
            btnFilter.BackColor = btnSavePDF.BackColor = btnAddNew.BackColor = CustomColor.PrimaryBackground;
            btnReports.ForeColor = btnCloseConstruction.ForeColor = btnBack.ForeColor = CustomColor.MainColor;
            btnReports.BackColor = btnCloseConstruction.BackColor = btnBack.BackColor = CustomColor.PrimaryBackground;
            lblCustomer.ForeColor = lblConstruction.ForeColor = CustomColor.Text1;
            try
            {
                lblCustomer.Text = ICustomer.GetById(customerConstruction.CustomerId).Name;
            }
            catch
            {
                lblCustomer.Text = "";
            }
            lblConstructionClosed.ForeColor = CustomColor.MainColor;
            lblConstruction.Text = customerConstruction.ToString();
            btnAddNew.Visible = customerConstruction.IsActive;
            if (!customerConstruction.IsActive)
            {
                btnFilter.Location = btnSavePDF.Location;
                lblClearFilter.Location = new Point(btnFilter.Location.X - lblClearFilter.Width - 8, lblClearFilter.Location.Y);
                btnSavePDF.Location = btnAddNew.Location;
            }
            containerPanel.Size = pnBody.Size;
            LoadForms();
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
                IQueryable<ReportForm> formsQuery = IReportForm.GetByConstruction(customerConstruction.Id);
                if (anyForms == null) anyForms = formsQuery.Count() > 0;
                formsQuery = FilterClass.FilterForms(formsFilter, formsQuery).OrderBy(x => x.Ordinal).Skip(currentPage * pageSize).Take(pageSize);
                lastPage = formsQuery.Count() < pageSize;
                foreach (ReportForm reportForm in formsQuery)
                {
                    if (reportForms.Any(x => x.Id == reportForm.Id)) continue;
                    reportForms.Add(reportForm);
                    int rowIndex = dtForms.Rows.Add();
                    dtForms["Id", rowIndex].Value = reportForm.Id;
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
                reportForms.Clear();
                LoadingScreenHelper.EndScreen();
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja obrazaca... Molimo pokušajte ponovo kasnije!");
            }
            dtForms.AllowDrop = dtForms.Rows.Count > 1;
            btnReports.Visible = anyForms.Value;
            btnCloseConstruction.Visible = anyForms.Value && customerConstruction.IsActive;
            lblConstructionClosed.Visible = !customerConstruction.IsActive;
            btnSavePDF.Visible = anyForms.Value;
            if (dtForms.Rows.Count > 0) btnFilter.Location = new Point(btnSavePDF.Location.X - btnFilter.Width - 6, btnSavePDF.Location.Y);
            else btnFilter.Location = btnSavePDF.Location;
            lblClearFilter.Location = new Point(btnFilter.Location.X - lblClearFilter.Width - 6, lblClearFilter.Location.Y);
            LoadingScreenHelper.EndScreen();
        }

        private void ReportDataForm_Activated(object sender, EventArgs e)
        {
            if (!update) return;
            update = false;
            ReloadForm();
            if (dataSourceChanged)
            {
                IReportForm = CompositionRoot.Resolve<IReportForm>();
                LoadForms();
            }
        }

        private void dtForms_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;
            string reportFormId = Convert.ToString(dtForms["Id", e.RowIndex].Value);
            if (e.ColumnIndex == dtForms.Columns["EditColumn"].Index)
            {
                ReportForm report = reportForms.SingleOrDefault(x => x.Id == reportFormId);
                //if (!LoginForm.currentUser.IsAdmin && LoginForm.currentUser.Id != report.UserId) return;
                ShowFillingForm(report);
            }
            else if (e.ColumnIndex == dtForms.Columns["RemoveColumn"].Index)
            {
                Enabled = false;
                if (MessageClass.ShowQuestionBox("Jeste li sigurni da želite ukloniti ovaj obrazac?") == DialogResult.Yes)
                {
                    try
                    {
                        IReportExportForm.RemoveByForm(reportFormId);
                        IReportExportForm.SaveChanges();
                        IReportForm.Remove(reportFormId);
                        IReportForm.SaveChanges();
                    }
                    catch (Exception ex)
                    {
                        ExceptionHelper.SaveLog(ex);
                        MessageClass.ShowErrorBox("Došlo je do pogreške prilikom uklanjanja obrazca... Molimo pokušajte ponovo kasnije!");
                        Enabled = true;
                        return;
                    }
                    anyForms = null;
                    dataSourceChanged = true;
                    LoadForms();
                    Activate();
                }
                Enabled = true;
            }
        }

        private void dtForms_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;
            LoadingScreenHelper.StartLoadingScreen();
            string reportFormId = Convert.ToString(dtForms["Id", e.RowIndex].Value);
            ShowFillingForm(reportForms.SingleOrDefault(x => x.Id == reportFormId));
        }

        private void ShowFillingForm(ReportForm reportForm)
        {
            if (reportForm == null) return;
            loaded = false;
            Hide();
            WindowState = FormWindowState.Normal;
            loaded = true;
            MethodFormHelper.OpenForm(reportForm, typeof(ReportDataForm).Name);
        }

        private void pnReports_Paint(object sender, PaintEventArgs e)
        {
            Panel p = sender as Panel;
            p.BackColor = CustomColor.PrimaryBackground;
            ControlPaint.DrawBorder(e.Graphics, p.DisplayRectangle, CustomColor.MainColor20, ButtonBorderStyle.Solid);
        }

        private void btnAddNew_Click(object sender, EventArgs e)
        {
            Enabled = false;
            SelectFormTypeDialog selectFormTypeDialog = CompositionRoot.Resolve<SelectFormTypeDialog>("customerConstruction", customerConstruction);
            if (selectFormTypeDialog.ShowDialog() == DialogResult.OK)
            {
                LoadingScreenHelper.StartLoadingScreen();
                try
                {
                    int materialType = IMaterialType.GetAll().First().Id;
                    Material material = IMaterial.GetByType(materialType).First();
                    IQueryable<ReportForm> forms = IReportForm.GetByConstruction(customerConstruction.Id);
                    int ordinal = forms.Count() == 0 ? 1 : forms.Max(x => x.Ordinal) + 1;
                    ReportForm reportForm = new ReportForm
                    {
                        UserId = LoginForm.currentUser.Id,
                        Ordinal = ordinal,
                        TypeId = selectFormTypeDialog.selectedFormType.Id,
                        WaterHeight = 0,
                        CustomerId = customerConstruction.CustomerId,
                        ConstructionId = customerConstruction.Id,
                        DraftId = IReportDraft.GetByType(selectFormTypeDialog.selectedFormType.Id).First().Id,
                        MaterialTypeId = materialType,
                        PaneMaterialId = material.Id,
                        PipeMaterialId = material.Id,
                        ExaminationProcedureId = 1
                    };
                    reportForm.CreationTime = reportForm.UpdateTime = DateTime.Now;
                    reportForm.IsSatisfying(reportForm.TypeId == 2 ? IExaminationProcedure.GetById(1) : null);
                    IReportForm.Add(reportForm);
                    IReportForm.SaveChanges();
                    anyForms = true;
                    dataSourceChanged = true;
                    loaded = false;
                    Hide();
                    WindowState = FormWindowState.Normal;
                    loaded = true;
                    MethodFormHelper.OpenForm(reportForm, typeof(ReportDataForm).Name);
                }
                catch (Exception ex)
                {
                    ExceptionHelper.SaveLog(ex);
                    LoadingScreenHelper.EndScreen();
                    MessageClass.ShowErrorBox("Došlo je do pogreške prilikom kreiranja novog obrazca... Molimo pokušajte ponovo kasnije!");
                }
            }
            Enabled = true;
        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            Close();
            ConstructionsForm.constructionsForm.Show();
        }

        private void btnCloseConstruction_Click(object sender, EventArgs e)
        {
            Enabled = false;
            if (MessageClass.ShowQuestionBox("Jeste li sigurni da želite arhivirati ovo gradilište?") == DialogResult.Yes)
            {
                try
                {
                    ICustomerConstruction.GetById(customerConstruction.Id).IsActive = false;
                    ICustomerConstruction.SaveChanges();
                    btnAddNew.Visible = customerConstruction.IsActive = false;
                    btnCloseConstruction.Visible = customerConstruction.IsActive;
                    lblConstructionClosed.Visible = !customerConstruction.IsActive;
                    btnFilter.Location = btnSavePDF.Location;
                    btnSavePDF.Location = btnAddNew.Location;
                    lblClearFilter.Location = new Point(btnFilter.Location.X - lblClearFilter.Width - 6, lblClearFilter.Location.Y);

                }
                catch (Exception ex)
                {
                    ExceptionHelper.SaveLog(ex);
                    MessageClass.ShowErrorBox("Došlo je do pogreške prilikom arhiviranja gradilišta... Molimo pokušajte ponovo kasnije!");
                }
            }
            Enabled = true;
        }

        private void dtForms_DragOver(object sender, DragEventArgs e)
        {
            e.Effect = DragDropEffects.Move;
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
                        ReportForm reportForm = reportForms.SingleOrDefault(x => x.Id == Convert.ToString(row.Cells["Id"].Value));
                        if (reportForm == null) continue;
                        reportForm.Ordinal = row.Index;
                    }
                    IReportForm.UpdateOrdinals(reportForms, customerConstruction.Id);
                    IReportForm.SaveChanges();
                }
                catch (Exception ex)
                {
                    ExceptionHelper.SaveLog(ex);
                    MessageClass.ShowErrorBox("Došlo je do pogreške prilikom mijenja redoslijeda obrazaca... Molimo pokušajte ponovo kasnije!");
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

        private void btnReports_Click(object sender, EventArgs e)
        {
            LoadingScreenHelper.StartLoadingScreen();
            loaded = false;
            Hide();
            WindowState = FormWindowState.Normal;
            loaded = true;
            CompositionRoot.Resolve<ReportsForm>(new Dictionary<string, object> { { "customerConstruction", customerConstruction }, { "fromHistory", false } }).Show();
        }

        private void btnSavePDF_Click(object sender, EventArgs e)
        {
            if (dtForms.Rows.Count == 0) return;
            Enabled = false;
            SaveFileDialog saveFileDialog = new SaveFileDialog();
            saveFileDialog.Filter = "PDF dokument (.pdf)|*.pdf";
            saveFileDialog.InitialDirectory = Path.GetFullPath(Environment.GetFolderPath(Environment.SpecialFolder.Desktop));
            saveFileDialog.RestoreDirectory = true;
            saveFileDialog.FileName = customerConstruction.Construction;
            if (saveFileDialog.ShowDialog() == DialogResult.OK)
            {
                string tempPath = Path.Combine(AppData.FILES_FOLDER_PATH, Path.GetFileNameWithoutExtension(saveFileDialog.FileName) + DateTime.Now.ToString("ddMMyyyy") + Path.GetExtension(saveFileDialog.FileName));
                try
                {
                    LoadingScreenHelper.StartLoadingScreen("Spremanje obrazaca u PDF...");
                    IQueryable<ReportForm> formsCopy = IReportForm.GetByConstruction(customerConstruction.Id);
                    formsCopy = FilterClass.FilterForms(formsFilter, formsCopy);
                    bool result = CompositionRoot.Resolve<PdfClass>().ExportForms(tempPath, formsCopy, customerConstruction.WorkOrder);
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
                    if (!result) MessageClass.ShowErrorBox("Došlo je do pogreške prilikom spremanja datoteke! Molimo pokušajte ponovo kasnije.");
                    else MessageClass.ShowInfoBox("Dokument je uspješno generiran i spremljen na odabranu lokaciju.");

                }
                catch (Exception ex)
                {
                    ExceptionHelper.SaveLog(ex);
                    if (File.Exists(tempPath)) File.Delete(tempPath);
                    LoadingScreenHelper.EndScreen();
                    Activate();
                    MessageClass.ShowErrorBox("Došlo je do pogreške prilikom spremanja datoteke! Molimo pokušajte ponovo kasnije.");
                }
            }
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

        private void ReportDataForm_Resize(object sender, EventArgs e)
        {
            Size newSize = minimumSize;
            if (Size.Width > minimumSize.Width) newSize.Width = Size.Width;
            if (Size.Height > minimumSize.Height) newSize.Height = Size.Height;
            pnReports.Size = new Size(newSize.Width - pnReports.Location.X - rightMargin, newSize.Height - pnReports.Location.Y - bottomMargin);
            btnReports.Location = new Point(newSize.Width - btnReports.Width - rightMargin, btnReports.Location.Y);
            btnCloseConstruction.Location = new Point(btnReports.Location.X - btnCloseConstruction.Width - 10, btnReports.Location.Y);
            lblConstructionClosed.Location = new Point(btnReports.Location.X - lblConstructionClosed.Width - 5, lblConstructionClosed.Location.Y);
            dtForms.Size = new Size(pnReports.Size.Width - 2 * dtForms.Left, pnReports.Size.Height - dtForms.Location.Y - 2 * btnAddNew.Location.Y);
            btnAddNew.Location = new Point(pnReports.Size.Width - dtForms.Left - btnAddNew.Size.Width, btnAddNew.Location.Y);
            if (customerConstruction.IsActive) btnSavePDF.Location = new Point(btnAddNew.Location.X - btnSavePDF.Width - 6, btnSavePDF.Location.Y);
            else btnSavePDF.Location = btnAddNew.Location;
            if (dtForms.Rows.Count == 0) btnFilter.Location = btnAddNew.Location;
            else btnFilter.Location = new Point(btnSavePDF.Location.X - btnFilter.Width - 6, btnFilter.Location.Y);
            lblClearFilter.Location = new Point(btnFilter.Location.X - 6 - lblClearFilter.Width, lblClearFilter.Location.Y);
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

        private void btnFilter_Click(object sender, EventArgs e)
        {
            Enabled = false;
            if (CompositionRoot.Resolve<FormsFilterDialog>(new Dictionary<string, object>() { { "formsFilter", formsFilter }, { "customerConstructionId", customerConstruction.Id } }).ShowDialog() == DialogResult.OK)
            {
                lblClearFilter.Visible = true;
                dataSourceChanged = true;
                LoadForms();
            }
            Enabled = true;
        }
    }
}