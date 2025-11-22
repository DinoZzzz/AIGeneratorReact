using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Dialogs;
using AIGenerator.UserControls;
using Interfaces;
using Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Threading;
using System.Windows.Forms;

namespace AIGenerator.Forms
{
    public partial class ReportPhotosForm : BaseForm
    {
        #region Variables
        private readonly IReportFile IReportFile;
        private ReportExport reportExport;
        private bool isReadOnly;
        private readonly List<ReportFile> files = new List<ReportFile>();
        bool start = true;
        #endregion

        public ReportPhotosForm(ReportExport reportExport, bool isReadOnly, IReportFile iReportFile) : base()
        {
            this.reportExport = reportExport;
            this.isReadOnly = isReadOnly;
            IReportFile = iReportFile;
            InitializeComponent();
        }

        private void ReportPhotosForm_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            flpPhotos.BackColor = CustomColor.PrimaryBackground;
            BackColor = CustomColor.Background;
            lblPhotos.ForeColor = CustomColor.Text1;
            btnSave.ForeColor = btnBack.ForeColor = btnAddNew.ForeColor = CustomColor.MainColor;
            btnSave.BackColor = btnBack.BackColor = btnAddNew.BackColor = CustomColor.PrimaryBackground;
            if (isReadOnly)
            {
                btnAddNew.Visible = btnSave.Visible = false;
            }
            containerPanel.Size = pnBody.Size;
            LoadPhotos();
            start = false;
        }

        private void LoadPhotos()
        {
            if(start) LoadingScreenHelper.StartLoadingScreen();
            try
            {
                flpPhotos.Controls.Clear();
                if (start) files.Clear();
                foreach (ReportFile reportFile in (start ? IReportFile.GetByReport(reportExport.Id).OrderBy(x => x.Ordinal).ToList() : files.OrderBy(x => x.Ordinal).ToList()))
                {
                    if (start) files.Add(reportFile);
                    flpPhotos.Controls.Add(new ReportFileUserControl
                    {
                        ReportFile = reportFile,
                        IsReadOnly = isReadOnly,
                        OnEdit = OnEdit,
                        OnDelete = OnDelete
                    });
                }
                if(start) LoadingScreenHelper.EndScreen();
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                start = true;
                flpPhotos.Controls.Clear();
                files.Clear();
                if (start) LoadingScreenHelper.EndScreen();
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja slika... Molimo pokušajte ponovo kasnije!");
            }
        }

        private void OnEdit(ReportFile reportFile)
        {
            Enabled = false;
            ShowPhotoDialog(reportFile);
            Enabled = true;
        }

        private void OnDelete(ReportFile reportFile)
        {
            Enabled = false;
            files.Remove(reportFile);
            Activate();
            LoadPhotos();
            Enabled = true;
        }

        private void ReportFillingForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            FormHelper.CloseApp();
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
            ShowPhotoDialog(null);
            Enabled = true;
        }

        private void ShowPhotoDialog(ReportFile reportFile)
        {
            if (CompositionRoot.Resolve<AddPhotoDialog>(new Dictionary<string, object> { { "reportExport", reportExport }, { "reportFile", reportFile }, { "files", files } }).ShowDialog() == DialogResult.OK)
            {
                Activate();
                LoadPhotos();
            }
        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            Close();
            ExportForm.exportForm.Show();
        }

        private async void btnSave_Click(object sender, EventArgs e)
        {
            Enabled = false;
            try
            {
                LoadingScreenHelper.StartLoadingScreen("Spremanje datoteka...");
                reportExport.ReportFiles.Clear();
                reportExport.ReportFiles.AddRange(files);
                bool result = await IReportFile.Upload(reportExport.ReportFiles, reportExport.Id, LoginForm.currentUser);
                LoadingScreenHelper.EndScreen();
                if (result)
                {
                    Close();
                    ExportForm.exportForm.Show();
                    ExportForm.exportForm.Activate();
                }
                else throw new Exception();
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                LoadingScreenHelper.EndScreen();
                MessageClass.ShowErrorBox("Došlo je pogreške prilikom postavljanja slika... Molimo pokušajte ponovo kasnije!");
            }
            Enabled = true;
        }

        private void ReportPhotosForm_Resize(object sender, EventArgs e)
        {
            Size newSize = minimumSize;
            if (Size.Width > minimumSize.Width) newSize.Width = Size.Width;
            if (Size.Height > minimumSize.Height) newSize.Height = Size.Height;
            pnReports.Size = new Size(newSize.Width - pnReports.Location.X - rightMargin, newSize.Height - pnReports.Location.Y - bottomMargin);
            flpPhotos.Size = new Size(pnReports.Size.Width - 2 * flpPhotos.Left, pnReports.Size.Height - flpPhotos.Location.Y - 2 * btnAddNew.Location.Y);
            btnAddNew.Location = new Point(pnReports.Size.Width - flpPhotos.Left - btnAddNew.Size.Width, btnAddNew.Location.Y);
        }
    }
}
