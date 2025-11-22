using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Forms;
using Enums;
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
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.ReportForms.Method1610
{
    public partial class AirMethodForm : BaseForm
    {
        private readonly IReportForm IReportForm;
        private readonly IReportDraft IReportDraft;
        private readonly IMaterialType IMaterialType;
        private readonly IMaterial IMaterial;
        private readonly IExaminationProcedure IExaminationProcedure;
        private readonly ICustomerConstruction ICustomerConstruction;
        private ReportForm reportForm;
        private bool start = true;
        private bool enabled = false;
        private readonly string previous;
        private bool closed = true;

        public AirMethodForm(ReportForm reportForm, IReportForm iReportForm, IReportDraft reportDraft, IMaterialType materialType, IMaterial material, IExaminationProcedure examinationProcedure, bool enabled, string previous, ICustomerConstruction iCustomerConstruction) : base()
        {
            IReportForm = iReportForm;
            IReportDraft = reportDraft;
            IMaterialType = materialType;
            IMaterial = material;
            IExaminationProcedure = examinationProcedure;
            InitializeComponent();
            this.reportForm = reportForm;
            this.enabled = enabled;
            this.previous = previous;
            ICustomerConstruction = iCustomerConstruction;
        }

        private void AirMethodForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            FormHelper.CloseApp();
        }

        private void SetReadOnly()
        {
            txtDeviation.Enabled = txtRemark.Enabled = dtExaminationDate.Enabled = dtExaminationDuration.Enabled = dtStabilisation.Enabled = enabled;
            cbPaneMaterial.Enabled = cbExaminationProcedure.Enabled = lblExaminationProcedure.Enabled = txtStock.Enabled = cbMaterialType.Enabled = cbTubeMaterial.Enabled = cbDraft.Enabled = enabled;
            numPipeDiameter.Enabled = numPipeLength.Enabled = numPaneDiameter.Enabled = numPressureEnd.Enabled = numPressureStart.Enabled = numTemperature.Enabled = enabled;
        }

        private void AirMethodForm_Load(object sender, EventArgs e)
        {
            FormHelper.ConfigureTimePicker(dtExaminationDuration);
            FormHelper.ConfigureTimePicker(dtStabilisation);
            FormHelper.ConfigureTimePicker(dtTestTime);
            dtStabilisation.CustomFormat = "mm:ss";
            dtTestTime.CustomFormat = "mm:ss";
            dtExaminationDuration.CustomFormat = "mm:ss";
            try
            {
                cbDraft.Items.Clear();
                foreach (ReportDraft reportDraft in IReportDraft.GetByType(reportForm.TypeId))
                {
                    cbDraft.Items.Add(reportDraft);
                    if (reportDraft.Id == reportForm.DraftId) cbDraft.SelectedItem = reportDraft;
                }
                UpdateMaterials();
                cbExaminationProcedure.Items.Clear();
                foreach (ExaminationProcedure examinationProcedure in IExaminationProcedure.GetAll())
                {
                    cbExaminationProcedure.Items.Add(examinationProcedure);
                    if (reportForm.ExaminationProcedureId == examinationProcedure.Id) cbExaminationProcedure.SelectedItem = examinationProcedure;
                }
                bool authenticated = (LoginForm.currentUser.Id == reportForm.UserId || LoginForm.currentUser.IsAdmin) && ICustomerConstruction.IsActive(reportForm.ConstructionId);
                btnSave.Text = LoginForm.currentUser.Id == reportForm.UserId || LoginForm.currentUser.IsAdmin ? "Spremi i završi" : "Povratak";
                btnSaveCreate.Visible = authenticated;
                if (!authenticated)
                {
                    btnNext.Location = btnSaveCreate.Location;
                }
                formHeaderUserControl1.WorkOrder = formHeaderUserControl2.WorkOrder = ICustomerConstruction.GetById(reportForm.ConstructionId).WorkOrder;
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                enabled = false;
                GetBack();
                return;
            }
            SetReadOnly();
            SetColors();
            LoadData();
            UpdateScreen();
            start = false;
            UpdateCalculations();
            UpdateTestTime();
            btnSave.Focus();
            LoadingScreenHelper.EndScreen();
        }

        private bool SaveData()
        {
            try
            {
                ReportForm oldReport = IReportForm.GetById(reportForm.Id);
                oldReport.ExaminationDate = dtExaminationDate.Value;
                oldReport.ExaminationDuration = dtExaminationDuration.Value;
                oldReport.MaterialTypeId = (cbMaterialType.SelectedItem as MaterialType).Id;
                oldReport.PipeMaterialId = (cbTubeMaterial.SelectedItem as Material).Id;
                oldReport.PaneMaterialId = (cbPaneMaterial.SelectedItem as Material).Id;
                oldReport.DraftId = (cbDraft.SelectedItem as ReportDraft).Id;
                oldReport.PipeLength = Convert.ToDouble(numPipeLength.Value);
                oldReport.PipeDiameter = Convert.ToDouble(numPipeDiameter.Value) / 1000;
                oldReport.StabilizationTime = dtStabilisation.Value;
                oldReport.Remark = txtRemark.Text;
                oldReport.Deviation = txtDeviation.Text;
                oldReport.PressureStart = Convert.ToDouble(numPressureStart.Value);
                oldReport.PressureEnd = Convert.ToDouble(numPressureEnd.Value);
                oldReport.Stock = txtStock.Text;
                oldReport.PaneDiameter = Convert.ToDouble(numPaneDiameter.Value) / 1000;
                ExaminationProcedure examinationProcedure = cbExaminationProcedure.SelectedItem as ExaminationProcedure;
                oldReport.ExaminationProcedureId = examinationProcedure.Id;
                oldReport.Temperature = Convert.ToDouble(numTemperature.Value);
                oldReport.IsSatisfying(examinationProcedure);
                oldReport.UpdateTime = DateTime.Now;
                IReportForm.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                LoadingScreenHelper.EndScreen();
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom spremanja podataka... Molimo pokušajte ponovo kasnije!");
                return false;
            }
        }

        private void LoadData()
        {
            dtExaminationDate.Value = reportForm.ExaminationDate;
            dtExaminationDuration.Value = reportForm.ExaminationDuration;
            numPipeLength.Value = Convert.ToDecimal(reportForm.PipeLength);
            numPipeDiameter.Value = Convert.ToDecimal(reportForm.PipeDiameter) * 1000;
            numPaneDiameter.Value = Convert.ToDecimal(reportForm.PaneDiameter) * 1000;
            dtStabilisation.Value = reportForm.StabilizationTime;
            numPressureStart.Value = Convert.ToDecimal(reportForm.PressureStart);
            numPressureEnd.Value = Convert.ToDecimal(reportForm.PressureEnd);
            numTemperature.Value = Convert.ToDecimal(reportForm.Temperature);
            txtStock.Text = reportForm.Stock;
            txtRemark.Text = reportForm.Remark;
            txtDeviation.Text = reportForm.Deviation;
        }

        private void SetColors()
        {
            BackColor = CustomColor.Background;
            btnSaveCreate.ForeColor = btnNext.ForeColor = btnSave.ForeColor = CustomColor.MainColor;
            btnSaveCreate.BackColor = btnNext.BackColor = btnSave.BackColor = CustomColor.PrimaryBackground;
            lblTemperature.ForeColor = lblStabilisation.ForeColor = lblExaminationDate.ForeColor = lblExaminationStart.ForeColor = CustomColor.Text2;
            lblExaminationDate.ForeColor = lblExaminationStart.ForeColor = lblPaneDiameter.ForeColor = CustomColor.Text2;
            lblStock.ForeColor = lblMaterialType.ForeColor = CustomColor.Text2;
            lblTubeMaterial.ForeColor = lblPipeLength.ForeColor = lblPipeDiameter.ForeColor = CustomColor.Text2;
            label3.ForeColor = label10.ForeColor = label11.ForeColor = label13.ForeColor = label12.ForeColor = CustomColor.Text2;
            lblTestTime.ForeColor = lblRemark.ForeColor = CustomColor.Text2;
            lblPaneMaterial.ForeColor = lblExaminationProcedure.ForeColor = CustomColor.Text2;
            lblPressure.ForeColor = lblPressureStart.ForeColor = lblPressureEnd.ForeColor = lblPressureText.ForeColor = CustomColor.Text2;
            numPressureStart.ForeColor = numPressureEnd.ForeColor = numPaneDiameter.ForeColor = CustomColor.Text1;
            numPressureStart.BackColor = numPressureEnd.BackColor = numPaneDiameter.BackColor = CustomColor.White10;
            numTemperature.ForeColor = CustomColor.Text1;
            numTemperature.BackColor = CustomColor.White10;
            numPipeDiameter.ForeColor = numPipeLength.ForeColor = cbTubeMaterial.ForeColor = CustomColor.Text1;
            numPipeDiameter.BackColor = numPipeLength.BackColor = cbTubeMaterial.BackColor = CustomColor.White10;
            cbPaneMaterial.ForeColor = cbExaminationProcedure.ForeColor = cbDraft.ForeColor = txtStock.ForeColor = cbMaterialType.ForeColor = CustomColor.Text1;
            cbPaneMaterial.BackColor = cbExaminationProcedure.BackColor = cbDraft.BackColor = txtStock.BackColor = cbMaterialType.BackColor = CustomColor.White10;
            txtDeviation.ForeColor = txtRemark.ForeColor = CustomColor.Text1;
            gbTube.ForeColor = CustomColor.Text2;
            txtDeviation.BackColor = pbDraft.BackColor = txtRemark.BackColor = CustomColor.White10;
            lblDeviation.ForeColor = label1.ForeColor = label2.ForeColor = CustomColor.Text2;
        }

        private void UpdateScreen()
        {
            if (cbDraft.SelectedItem == null) return;
            ReportDraft reportDraft = cbDraft.SelectedItem as ReportDraft;
            cbTubeMaterial.Visible = lblTubeMaterial.Visible = reportDraft.Draft != DraftEnum.Ispitivanje_okna;
            lblPipeDiameter.Visible = numPipeDiameter.Visible = label10.Visible = reportDraft.Draft != DraftEnum.Ispitivanje_okna;
            lblPipeLength.Visible = numPipeLength.Visible = label11.Visible = reportDraft.Draft != DraftEnum.Ispitivanje_okna;
            lblPaneMaterial.Visible = cbPaneMaterial.Visible = reportDraft.Draft != DraftEnum.Ispitivanje_cjevovoda;
            lblPaneDiameter.Visible = numPaneDiameter.Visible = label3.Visible = reportDraft.Draft != DraftEnum.Ispitivanje_cjevovoda;
            int leftX = lblStock.Location.X, rightX = txtStock.Location.X, diff = lblMaterialType.Location.Y - lblStock.Location.Y;
            int height = lblExaminationProcedure.Location.Y + diff;
            if (reportDraft.Draft == DraftEnum.Ispitivanje_okna)
            {
                lblPaneMaterial.Location = new Point(leftX, height);
                cbPaneMaterial.Location = new Point(rightX, height);
                height += diff;
                lblPaneDiameter.Location = new Point(leftX, height);
                numPaneDiameter.Location = new Point(rightX, height);
                label3.Location = new Point(rightX + numPaneDiameter.Size.Width + 2, height);
            }
            else if(reportDraft.Draft == DraftEnum.Ispitivanje_okna_cjevovoda)
            {
                lblPaneMaterial.Location = new Point(leftX, height);
                cbPaneMaterial.Location = new Point(rightX, height);
                height += diff;
                lblPaneDiameter.Location = new Point(leftX, height);
                numPaneDiameter.Location = new Point(rightX, height);
                label3.Location = new Point(rightX + numPaneDiameter.Size.Width + 2, height);
                height += diff;
                lblTubeMaterial.Location = new Point(leftX, height);
                cbTubeMaterial.Location = new Point(rightX, height);
                height += diff;
                lblPipeLength.Location = new Point(leftX, height);
                numPipeLength.Location = new Point(rightX, height);
                label11.Location = new Point(rightX + numPipeLength.Size.Width + 2, height);
                height += diff;
                lblPipeDiameter.Location = new Point(leftX, height);
                numPipeDiameter.Location = new Point(rightX, height);
                label10.Location = new Point(rightX + numPipeDiameter.Size.Width + 2, height);
            }
            else if(reportDraft.Draft == DraftEnum.Ispitivanje_cjevovoda)
            {
                lblTubeMaterial.Location = new Point(leftX, height);
                cbTubeMaterial.Location = new Point(rightX, height);
                height += diff;
                lblPipeLength.Location = new Point(leftX, height);
                numPipeLength.Location = new Point(rightX, height);
                label11.Location = new Point(rightX + numPipeLength.Size.Width + 2, height);
                height += diff;
                lblPipeDiameter.Location = new Point(leftX, height);
                numPipeDiameter.Location = new Point(rightX, height);
                label10.Location = new Point(rightX + numPipeDiameter.Size.Width + 2, height);
            }
        }

        private void AirMethodForm_Resize(object sender, EventArgs e)
        {
            Size newSize = minimumSize;
            if (Size.Width > minimumSize.Width) newSize.Width = Size.Width;
            if (Size.Height > minimumSize.Height) newSize.Height = Size.Height;
            pnForm2.Size = new Size(gbRevisionPane.Location.X * 4 + 2 * gbRevisionPane.Size.Width, newSize.Height - 120);
            pnForm1.Size = new Size(gbRevisionPane.Location.X * 4 + 2 * gbRevisionPane.Size.Width, groupBox1.Location.Y + groupBox1.Size.Height + 30);
            pnForm1.Location = pnForm2.Location = new Point((newSize.Width - pnForm2.Size.Width) / 2, pnForm2.Location.Y);
            pnForm1.Invalidate();
            pnForm2.Invalidate();
        }

        private void NumericUpDown_ValueChanged(object sender, EventArgs e)
        {
            if (start) return;
            NumericUpDown numericUpDown = sender as NumericUpDown;
            if (numericUpDown.Name == numPipeDiameter.Name || numericUpDown.Name == numPaneDiameter.Name) cbExaminationProcedure_SelectedIndexChanged(cbExaminationProcedure, e);
            reportForm.PressureStart = Convert.ToDouble(numPressureStart.Value);
            reportForm.PressureEnd = Convert.ToDouble(numPressureEnd.Value);
            reportForm.PipeDiameter = Convert.ToDouble(numPipeDiameter.Value) / 1000;
            reportForm.PipeLength = Convert.ToDouble(numPipeLength.Value);
            reportForm.PaneDiameter = Convert.ToDouble(numPaneDiameter.Value) / 1000;
            UpdateCalculations();
        }

        private void UpdateCalculations()
        {
            if (start) return;
            lblPressure.Text = Math.Round(reportForm.CalculatePressureLoss(), 2) + " mbar";
            lblSatisfies.Text = reportForm.IsSatisfying(cbExaminationProcedure.SelectedItem as ExaminationProcedure) ? "ZADOVOLJAVA" : "NE ZADOVOLJAVA";
            pnForm2.Invalidate();
            pnForm1.Invalidate();
            lblSatisfies.ForeColor = reportForm.Satisfies ? CustomColor.Green : CustomColor.Red;
        }

        private void AirMethodForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (enabled && !SaveData())
            {
                e.Cancel = true;
                closed = false;
            }
            LoadingScreenHelper.EndScreen();
            Enabled = true;
        }

        private void cbDraft_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (cbDraft.SelectedItem == null) return;
            ReportDraft reportDraft = cbDraft.SelectedItem as ReportDraft;
            pbDraft.BackgroundImage = GetBitmap.GetById(reportDraft.Id);
            reportForm.DraftId = reportDraft.Id;
            lblMaterialType.Text = "Tip" + (reportDraft.Draft == DraftEnum.Ispitivanje_cjevovoda ? "" : " okna") + ":";
            UpdateScreen();
            UpdateCalculations();
            UpdateTestTime();
            UpdateMaterials();
        }

        private void UpdateMaterials()
        {
            try
            {
                cbMaterialType.Items.Clear();
                foreach (MaterialType materialType in IMaterialType.GetAll())
                {
                    if (materialType.Id == 2) continue;
                    cbMaterialType.Items.Add(materialType);
                    if (materialType.Id == reportForm.MaterialTypeId) cbMaterialType.SelectedItem = materialType;
                }
                cbTubeMaterial.Items.Clear();
                cbPaneMaterial.Items.Clear();
                foreach (Material material in IMaterial.GetByType(1))
                {
                    cbTubeMaterial.Items.Add(material);
                    cbPaneMaterial.Items.Add(material);
                    if (material.Id == reportForm.PipeMaterialId) cbTubeMaterial.SelectedItem = material;
                    if (material.Id == reportForm.PaneMaterialId) cbPaneMaterial.SelectedItem = material;
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja materijala... Molimo pokušajte ponovo kasnije!");
                cbMaterialType.Items.Clear();
                cbTubeMaterial.Items.Clear();
                cbPaneMaterial.Items.Clear();
            }
        }

        private void cbMaterialType_SelectedValueChanged(object sender, EventArgs e)
        {
            if (cbMaterialType.SelectedItem == null) return;
            int id = (cbMaterialType.SelectedItem as MaterialType).Id;
            if (start || reportForm.MaterialTypeId == id) return;
            reportForm.MaterialTypeId = id;
            UpdateCalculations();
        }

        private void pnForm_Paint(object sender, PaintEventArgs e)
        {
            Panel p = sender as Panel;
            p.BackColor = CustomColor.PrimaryBackground;
            ControlPaint.DrawBorder(e.Graphics, p.DisplayRectangle, reportForm.Satisfies ? CustomColor.Green : CustomColor.Red, ButtonBorderStyle.Solid);
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            Enabled = false;
            LoadingScreenHelper.StartLoadingScreen("Spremanje obrazaca...");            
            GetBack();
        }

        private void GetBack()
        {
            Thread.Sleep(500);
            LoadingScreenHelper.EndScreen();
            Close();
            if (!closed)
            {
                closed = true;
                return;
            }
            if (previous == typeof(ReportDataForm).Name)
            {
                ReportDataForm.reportDataForm.dataSourceChanged = true;
                MethodFormHelper.ShowPreviousForm(ReportDataForm.reportDataForm);
            }
            else if (previous == typeof(ExportForm).Name) MethodFormHelper.ShowPreviousForm(ExportForm.exportForm);
        }

        private void cbExaminationProcedure_SelectedIndexChanged(object sender, EventArgs e)
        {
            UpdateTestTime();
        }

        private void UpdateTestTime()
        {
            if (start) return;
            ReportDraft draft = cbDraft.SelectedItem as ReportDraft;
            dtTestTime.Value = TestTimeClass.GetTestTime((cbExaminationProcedure.SelectedItem as ExaminationProcedure).Id, draft.Id, draft.Id != 6 ? Convert.ToInt32(numPaneDiameter.Value) : Convert.ToInt32(numPipeDiameter.Value));
        }

        private void btnNext_Click(object sender, EventArgs e)
        {
            pnForm1.Visible = !pnForm1.Visible;
            pnForm2.Visible = !pnForm2.Visible;
            btnNext.Text = pnForm1.Visible ? "Sljedeće" : "Prijašnje";
        }

        private void btnSaveCreate_Click(object sender, EventArgs e)
        {
            Enabled = false;
            LoadingScreenHelper.StartLoadingScreen("Spremanje i kreiranje novog...");
            if (SaveData())
            {
                try
                {
                    reportForm.Ordinal = IReportForm.GetByConstruction(reportForm.ConstructionId).Max(x => x.Ordinal) + 1;
                    reportForm.UserId = LoginForm.currentUser.Id;
                    reportForm = IReportForm.CopyAdd(reportForm);
                    IReportForm.SaveChanges();
                    pnForm1.Visible = true;
                    pnForm2.Visible = false;
                    btnNext.Text = "Sljedeće";
                    ReportDataForm.reportDataForm.dataSourceChanged = true;
                    LoadingScreenHelper.EndScreen();
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
    }
}
