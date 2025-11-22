using AIGenerator.Common;
using AIGenerator.Forms;
using Enums;
using Interfaces;
using Models;
using System;
using System.Drawing;
using System.Linq;
using System.Threading;
using System.Windows.Forms;

namespace AIGenerator.ReportForms.Method1610
{
    public partial class WaterMethodForm : BaseForm
    {
        private readonly IReportForm IReportForm;
        private readonly IReportDraft IReportDraft;
        private readonly IMaterialType IMaterialType;
        private readonly IMaterial IMaterial;
        private readonly ICustomerConstruction ICustomerConstruction;
        private ReportForm reportForm;
        private bool start = true;
        private bool enabled = true;
        private readonly string previous;
        private bool closed = true;

        public WaterMethodForm(ReportForm reportForm, IReportForm iReportForm, IReportDraft reportDraft, IMaterialType materialType, IMaterial material, bool enabled, string previous, ICustomerConstruction iCustomerConstruction) : base()
        {
            IReportForm = iReportForm;
            IReportDraft = reportDraft;
            IMaterialType = materialType;
            IMaterial = material;
            InitializeComponent();
            this.reportForm = reportForm;
            this.enabled = enabled;
            this.previous = previous;
            ICustomerConstruction = iCustomerConstruction;
        }

        private void WaterMethodForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            FormHelper.CloseApp();
        }

        private void SetReadOnly()
        {
            numPaneHeight.Enabled = numPaneLength.Enabled = numPaneWidth.Enabled = dtSaturationTime.Enabled = enabled;
            txtDeviation.Enabled = txtRemark.Enabled = dtExaminationDate.Enabled = dtExaminationDuration.Enabled = enabled;
            txtStock.Enabled = cbMaterialType.Enabled = cbPaneMaterial.Enabled = cbTubeMaterial.Enabled = cbDraft.Enabled = enabled;
            numDepositionalHeight.Enabled = numSlope.Enabled = numPipeRadius.Enabled = numRoHeight.Enabled = numPipeLength.Enabled = numPaneDiameter.Enabled = numTemperature.Enabled = numWaterHeight.Enabled = numWaterHeightEnd.Enabled = numWaterHeightStart.Enabled = enabled;
        }

        private void WaterMethodForm_Load(object sender, EventArgs e)
        {
            FormHelper.ConfigureTimePicker(dtExaminationDuration);
            FormHelper.ConfigureTimePicker(dtSaturationTime);
            dtExaminationDuration.CustomFormat = "mm:ss";
            try
            {
                cbDraft.Items.Clear();
                foreach (ReportDraft reportDraft in IReportDraft.GetByType(reportForm.TypeId))
                {
                    cbDraft.Items.Add(reportDraft);
                    if (reportDraft.Id == reportForm.DraftId) cbDraft.SelectedItem = reportDraft;
                }
                cbMaterialType.Items.Clear();
                foreach (MaterialType materialType in IMaterialType.GetAll())
                {
                    cbMaterialType.Items.Add(materialType);
                    if (materialType.Id == reportForm.MaterialTypeId) cbMaterialType.SelectedItem = materialType;
                }
                cbTubeMaterial.Items.Clear();
                cbPaneMaterial.Items.Clear();
                foreach (Material material in IMaterial.GetByType(reportForm.MaterialTypeId))
                {
                    cbPaneMaterial.Items.Add(material);
                    if (material.Id == reportForm.PaneMaterialId) cbPaneMaterial.SelectedItem = material;
                }
                foreach (Material material in IMaterial.GetByType(1))
                {
                    cbTubeMaterial.Items.Add(material);
                    if (material.Id == reportForm.PipeMaterialId) cbTubeMaterial.SelectedItem = material;
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
            bool authenticated = (LoginForm.currentUser.Id == reportForm.UserId || LoginForm.currentUser.IsAdmin) && ICustomerConstruction.IsActive(reportForm.ConstructionId);
            btnSave.Text = LoginForm.currentUser.Id == reportForm.UserId || LoginForm.currentUser.IsAdmin ? "Spremi i završi" : "Povratak";
            btnSaveCreate.Visible = authenticated;
            if (!authenticated)
            {
                btnNext.Location = btnSaveCreate.Location;
            }
            SetReadOnly();
            SetColors();
            LoadData();
            UpdateScreen();
            start = false;
            UpdateCalculations();
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
                oldReport.PaneMaterialId = (cbPaneMaterial.SelectedItem as Material).Id;
                oldReport.PipeMaterialId = (cbTubeMaterial.SelectedItem as Material).Id;
                oldReport.DraftId = (cbDraft.SelectedItem as ReportDraft).Id;
                oldReport.PipeLength = Convert.ToDouble(numPipeLength.Value);
                oldReport.PipeDiameter = Convert.ToDouble(numPipeRadius.Value) / 1000;
                oldReport.PaneHeight = Convert.ToDouble(numPaneHeight.Value) / 100;
                oldReport.PaneLength = Convert.ToDouble(numPaneLength.Value) / 100;
                oldReport.PaneWidth = Convert.ToDouble(numPaneWidth.Value) / 100;
                oldReport.WaterHeight = Convert.ToDouble(numWaterHeight.Value) / 100;
                oldReport.WaterHeightStart = Convert.ToDouble(numWaterHeightStart.Value);
                oldReport.WaterHeightEnd = Convert.ToDouble(numWaterHeightEnd.Value);
                oldReport.Remark = txtRemark.Text;
                oldReport.Stock = txtStock.Text;
                oldReport.RoHeight = Convert.ToDouble(numRoHeight.Value) / 100;
                oldReport.PaneDiameter = Convert.ToDouble(numPaneDiameter.Value) / 1000;
                oldReport.PipelineSlope = Convert.ToDouble(numSlope.Value);
                oldReport.Temperature = Convert.ToDouble(numTemperature.Value);
                oldReport.Deviation = txtDeviation.Text;
                oldReport.SaturationTime = dtSaturationTime.Value;
                oldReport.DepositionalHeight = Convert.ToDouble(numDepositionalHeight.Value);
                oldReport.IsSatisfying(null);
                oldReport.UpdateTime = DateTime.Now;
                reportForm = oldReport;
                IReportForm.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom spremanja podataka... Molimo pokušajte ponovo kasnije!");
                return false;
            }
        }

        private void LoadData()
        {
            dtExaminationDate.Value = reportForm.ExaminationDate;
            dtExaminationDuration.Value = reportForm.ExaminationDuration;
            dtSaturationTime.Value = reportForm.SaturationTime;
            numRoHeight.Value = Convert.ToDecimal(reportForm.RoHeight) * 100;
            numPipeLength.Value = Convert.ToDecimal(reportForm.PipeLength);
            numPipeRadius.Value = Convert.ToDecimal(reportForm.PipeDiameter) * 1000;
            numWaterHeight.Value = Convert.ToDecimal(reportForm.WaterHeight) * 100;
            numPaneDiameter.Value = Convert.ToDecimal(reportForm.PaneDiameter) * 1000;
            numWaterHeightStart.Value = Convert.ToDecimal(reportForm.WaterHeightStart);
            numWaterHeightEnd.Value = Convert.ToDecimal(reportForm.WaterHeightEnd);
            numTemperature.Value = Convert.ToDecimal(reportForm.Temperature);
            numSlope.Value = Convert.ToDecimal(reportForm.PipelineSlope);
            txtStock.Text = reportForm.Stock;
            txtRemark.Text = reportForm.Remark;
            txtDeviation.Text = reportForm.Deviation;
            numPaneHeight.Value = Convert.ToDecimal(reportForm.PaneHeight) * 100;
            numPaneLength.Value = Convert.ToDecimal(reportForm.PaneLength) * 100;
            numPaneWidth.Value = Convert.ToDecimal(reportForm.PaneWidth) * 100;
            numDepositionalHeight.Value = Convert.ToDecimal(reportForm.DepositionalHeight) * 100;
        }

        private void SetColors()
        {
            BackColor = CustomColor.Background;
            btnSaveCreate.ForeColor = btnNext.ForeColor = btnSave.ForeColor = CustomColor.MainColor;
            btnSaveCreate.BackColor = btnNext.BackColor = btnSave.BackColor = CustomColor.PrimaryBackground;
            lblTemperature.ForeColor = lblExaminationDate.ForeColor = lblExaminationDuration.ForeColor = CustomColor.Text2;
            lblRoHeight.ForeColor = lblExaminationDate.ForeColor = lblExaminationDuration.ForeColor = lblPaneDiameter.ForeColor = CustomColor.Text2;
            lblStock.ForeColor = lblPaneMaterial.ForeColor = lblMaterialType.ForeColor = CustomColor.Text2;
            lblTubeMaterial.ForeColor = lblPipeLength.ForeColor = lblPipeRadius.ForeColor = CustomColor.Text2;
            lblSlope.ForeColor = lblDepositionalHeight.ForeColor = lblDeviation.ForeColor = label3.ForeColor = label4.ForeColor = lblWettedShaftSurface.ForeColor = lblTotalWettedArea.ForeColor = label6.ForeColor = label7.ForeColor = label8.ForeColor = label9.ForeColor = label10.ForeColor = label11.ForeColor = CustomColor.Text2;
            lblWaterHeight.ForeColor = lblHydrostaticHeightText.ForeColor = lblWettedShaftSurfaceText.ForeColor = lblWettedPipeSurfaceText.ForeColor = lblTotalWettedAreaText.ForeColor = lblAllowableLossLText.ForeColor = lblAllowableLossmmText.ForeColor = CustomColor.Text2;
            lblHydrostaticHeight.ForeColor = lblAllowableLossL.ForeColor = lblAllowableLossmm.ForeColor = lblDeltaV.ForeColor = lblLoss.ForeColor = CustomColor.Text1;
            lblRemark.ForeColor = lblWaterHeightStart.ForeColor = lblWaterHeightEnd.ForeColor = lblWaterLossText.ForeColor = lblDeltaVText.ForeColor = lblLossText.ForeColor = CustomColor.Text2;
            lblTotalWettedArea.ForeColor = lblWettedPipeSurface.ForeColor = lblWettedShaftSurface.ForeColor = CustomColor.Text1;
            numSlope.ForeColor = numWaterHeight.ForeColor = numRoHeight.ForeColor = numPaneDiameter.ForeColor = CustomColor.Text1;
            numSlope.BackColor = numWaterHeight.BackColor = numRoHeight.BackColor = numPaneDiameter.BackColor = CustomColor.White10;
            lblWaterLoss.ForeColor = numWaterHeightEnd.ForeColor = numWaterHeightStart.ForeColor = CustomColor.Text1;
            numWaterHeightEnd.BackColor = numWaterHeightStart.BackColor = CustomColor.White10;
            numTemperature.ForeColor = numPipeRadius.ForeColor = numPipeLength.ForeColor = cbTubeMaterial.ForeColor = CustomColor.Text1;
            numTemperature.BackColor = numPipeRadius.BackColor = numPipeLength.BackColor = cbTubeMaterial.BackColor = CustomColor.White10;
            cbDraft.ForeColor = txtStock.ForeColor = cbMaterialType.ForeColor = cbPaneMaterial.ForeColor = CustomColor.Text1;
            cbDraft.BackColor = txtStock.BackColor = cbMaterialType.BackColor = cbPaneMaterial.BackColor = CustomColor.White10;
            txtDeviation.ForeColor = txtRemark.ForeColor = CustomColor.Text1;
            gbTube.ForeColor = CustomColor.Text2;
            txtDeviation.BackColor = pbDraft.BackColor = txtRemark.BackColor = CustomColor.White10;
            label20.ForeColor = label21.ForeColor = label22.ForeColor = CustomColor.Text2;
            lblSaturationTime.ForeColor = lblPaneHeight.ForeColor = lblPaneLength.ForeColor = lblPaneWidth.ForeColor = CustomColor.Text2;
            numDepositionalHeight.ForeColor = numPaneHeight.ForeColor = numPaneLength.ForeColor = numPaneWidth.ForeColor = CustomColor.Text1;
            numDepositionalHeight.BackColor = numPaneHeight.BackColor = numPaneLength.BackColor = numPaneWidth.BackColor = CustomColor.White10;
            label1.ForeColor = label2.ForeColor = CustomColor.Text2;
        }

        private void UpdateScreen()
        {
            if (cbMaterialType.SelectedItem == null) return;
            MaterialType materialType = cbMaterialType.SelectedItem as MaterialType;
            lblRoHeight.Visible = numRoHeight.Visible = materialType.Id == 1;
            lblPaneDiameter.Visible = numPaneDiameter.Visible = label3.Visible = materialType.Id == 1;
            lblPaneHeight.Visible = numPaneHeight.Visible = label22.Visible = materialType.Id == 2;
            lblPaneLength.Visible = numPaneLength.Visible = label20.Visible = materialType.Id == 2;
            lblPaneWidth.Visible = numPaneWidth.Visible = materialType.Id == 2;
            lblSaturationTime.Visible = dtSaturationTime.Visible = label1.Visible = materialType.Id == 2;
            if (materialType.Id == 1)
            {
                int h = lblPaneDiameter.Location.Y;
                int d = lblPaneDiameter.Location.Y - lblRoHeight.Location.Y;
                h += d;
                lblWaterHeight.Location = new Point(lblWaterHeight.Location.X, h);
                numWaterHeight.Location = new Point(numWaterHeight.Location.X, h);
                label21.Location = new Point(numWaterHeight.Location.X + numWaterHeight.Size.Width, h + 3);
                h += d;
                lblExaminationDuration.Location = new Point(lblExaminationDuration.Location.X, h);
                dtExaminationDuration.Location = new Point(dtExaminationDuration.Location.X, h);
                label2.Location = new Point(dtExaminationDuration.Location.X + dtExaminationDuration.Size.Width, h + 3);
            }
            else
            {
                int h = lblPaneHeight.Location.Y;
                int d = lblPaneHeight.Location.Y - lblPaneLength.Location.Y;
                h += d;
                lblWaterHeight.Location = new Point(lblWaterHeight.Location.X, h);
                numWaterHeight.Location = new Point(numWaterHeight.Location.X, h);
                label21.Location = new Point(numWaterHeight.Location.X + numWaterHeight.Size.Width, h + 3);
                h += d;
                lblSaturationTime.Location = new Point(lblSaturationTime.Location.X, h);
                dtSaturationTime.Location = new Point(dtSaturationTime.Location.X, h);
                label1.Location = new Point(dtSaturationTime.Location.X + dtSaturationTime.Size.Width, h + 3);
                h += d;
                lblExaminationDuration.Location = new Point(lblExaminationDuration.Location.X, h);
                dtExaminationDuration.Location = new Point(dtExaminationDuration.Location.X, h);
                label2.Location = new Point(dtExaminationDuration.Location.X + dtExaminationDuration.Size.Width, h + 3);
            }
            if (cbDraft.SelectedItem == null) return;
            ReportDraft reportDraft = cbDraft.SelectedItem as ReportDraft;
            lblWettedPipeSurface.Visible = lblWettedPipeSurfaceText.Visible = reportDraft.Draft != Enums.DraftEnum.Ispitivanje_okna;
            int leftX = lblWettedShaftSurfaceText.Location.X, rightX = lblWettedShaftSurface.Location.X;
            int height = lblWettedShaftSurfaceText.Location.Y;
            int diff = lblAllowableLossLText.Location.Y - lblTotalWettedAreaText.Location.Y;
            gbTube.Visible = reportDraft.Draft != Enums.DraftEnum.Ispitivanje_okna;
            gbTube.Location = new Point(gbWater.Location.X, gbPane.Location.Y);
            if (reportDraft.Draft == Enums.DraftEnum.Ispitivanje_okna)
            {
                gbPane.Location = new Point((pnForm2.Width - gbPane.Width) / 2, gbPane.Location.Y);
            }
            else
            {
                height += diff;
                gbPane.Location = new Point(gbLoss.Location.X, gbPane.Location.Y);
                lblWettedPipeSurfaceText.Location = new Point(leftX, height);
                lblWettedPipeSurface.Location = new Point(rightX, height);
            }
            height += diff;
            lblTotalWettedAreaText.Location = new Point(leftX, height);
            lblTotalWettedArea.Location = new Point(rightX, height);
            height += diff;
            lblAllowableLossLText.Location = new Point(leftX, height);
            lblAllowableLossL.Location = new Point(rightX, height);
            height += diff;
            lblAllowableLossmmText.Location = new Point(leftX, height);
            lblAllowableLossmm.Location = new Point(rightX, height);
            height += diff;
            lblHydrostaticHeightText.Location = new Point(leftX, height);
            lblHydrostaticHeight.Location = new Point(rightX, height);
        }

        private void WaterMethodForm_Resize(object sender, EventArgs e)
        {
            Size newSize = minimumSize;
            if (Size.Width > minimumSize.Width) newSize.Width = Size.Width;
            if (Size.Height > minimumSize.Height) newSize.Height = Size.Height;
            pnForm2.Size = new Size(gbDates.Location.X * 5 + 2 * gbDates.Size.Width, newSize.Height - 120);
            pnForm1.Size = new Size(gbDates.Location.X * 5 + 2 * gbDates.Size.Width, gbDates.Location.Y + gbDates.Size.Height + 30);
            pnForm1.Location = pnForm2.Location = new Point((newSize.Width - pnForm2.Size.Width) / 2, pnForm2.Location.Y);
            pnForm1.Invalidate();
            pnForm2.Invalidate();
        }

        private void NumericUpDown_ValueChanged(object sender, EventArgs e)
        {
            if (start) return;
            reportForm.WaterHeightEnd = Convert.ToDouble(numWaterHeightEnd.Value);
            reportForm.WaterHeightStart = Convert.ToDouble(numWaterHeightStart.Value);
            reportForm.PipeDiameter = Convert.ToDouble(numPipeRadius.Value) / 1000;
            reportForm.PipeLength = Convert.ToDouble(numPipeLength.Value);
            reportForm.WaterHeight = Convert.ToDouble(numWaterHeight.Value) / 100;
            reportForm.PaneDiameter = Convert.ToDouble(numPaneDiameter.Value) / 1000;
            reportForm.RoHeight = Convert.ToDouble(numRoHeight.Value) / 100;
            reportForm.PaneHeight = Convert.ToDouble(numPaneHeight.Value) / 100;
            reportForm.PaneLength = Convert.ToDouble(numPaneLength.Value) / 100;
            reportForm.PaneWidth = Convert.ToDouble(numPaneWidth.Value) / 100;
            reportForm.DepositionalHeight = Convert.ToDouble(numDepositionalHeight.Value) / 100;
            UpdateCalculations();
        }

        private void UpdateCalculations()
        {
            if (start) return;
            lblDeltaV.Text = Math.Round(reportForm.CalculateWaterVolumeLoss(), 4) + " l";
            lblLoss.Text = Math.Round(reportForm.CalculateResult(), 2) + " l/m" + StringClass.SupperScript2();
            lblWaterLoss.Text = Math.Round(reportForm.CalculateWaterLoss(), 2) + " mm";
            lblAllowableLossL.Text = Math.Round(reportForm.CalculateAllowedLossL(), 2) + " l";
            lblAllowableLossmm.Text = Math.Round(reportForm.CalculateAllowedLossmm(), 2) + " mm";
            lblSatisfies.Text = reportForm.IsSatisfying(null) ? "ZADOVOLJAVA" : "NE ZADOVOLJAVA";
            pnForm2.Invalidate();
            pnForm1.Invalidate();
            lblSatisfies.ForeColor = reportForm.Satisfies ? CustomColor.Green : CustomColor.Red;
            lblTotalWettedArea.Text = Math.Round(reportForm.CalculateTotalWettedArea(), 2) + " m" + StringClass.SupperScript2();
            lblWettedPipeSurface.Text = Math.Round(reportForm.CalculateWettedPipeSurface(), 2) + " m" + StringClass.SupperScript2();
            lblWettedShaftSurface.Text = Math.Round(reportForm.CalculateWettedShaftSurface(), 2) + " m" + StringClass.SupperScript2();
            double hydrostaticHeight = reportForm.CalculateHydrostaticHeight() * 100;
            lblHydrostaticHeight.Text = Math.Round(hydrostaticHeight, 2) + " cm";
            if (hydrostaticHeight < 100 && (cbDraft.SelectedItem as ReportDraft).Id == 2)
            {
                if (string.IsNullOrEmpty(txtDeviation.Text)) txtDeviation.Text = "Kod pojedinih dionica h2<100cm";
            }
            else if (txtDeviation.Text == "Kod pojedinih dionica h2<100cm") txtDeviation.Text = "";
        }

        private void WaterMethodForm_FormClosing(object sender, FormClosingEventArgs e)
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
            lblHydrostaticHeight.Visible = lblHydrostaticHeightText.Visible = reportDraft.Draft == DraftEnum.Ispitivanje_okna_cjevovoda;
            int diff = lblPipeLength.Location.Y - lblTubeMaterial.Location.Y;
            if (reportDraft.Draft == DraftEnum.Ispitivanje_slivnika_cjevovoda)
            {
                lblSlope.Location = new Point(lblSlope.Location.X, lblDepositionalHeight.Location.Y + diff);
                numSlope.Location = new Point(numSlope.Location.X, lblDepositionalHeight.Location.Y + diff);
                label8.Location = new Point(label8.Location.X, lblDepositionalHeight.Location.Y + diff);
            }
            else
            {
                lblSlope.Location = lblDepositionalHeight.Location;
                numSlope.Location = numDepositionalHeight.Location;
                label8.Location = label9.Location;
            }
            lblDepositionalHeight.Visible = numDepositionalHeight.Visible = label9.Visible = reportDraft.Draft == DraftEnum.Ispitivanje_slivnika_cjevovoda;
            if (!start) UpdateScreen();
            UpdateCalculations();
        }

        private void cbMaterialType_SelectedValueChanged(object sender, EventArgs e)
        {
            if (cbMaterialType.SelectedItem == null) return;
            int id = (cbMaterialType.SelectedItem as MaterialType).Id;
            UpdateScreen();
            if (start || reportForm.MaterialTypeId == id) return;
            reportForm.MaterialTypeId = id;
            try
            {
                cbPaneMaterial.Items.Clear();
                foreach (Material material in IMaterial.GetByType(reportForm.MaterialTypeId))
                {
                    cbPaneMaterial.Items.Add(material);
                }
                cbPaneMaterial.SelectedIndex = 0;
            }
            catch (Exception ex)
            {
                cbPaneMaterial.Items.Clear();
                ExceptionHelper.SaveLog(ex);
                MessageClass.ShowErrorBox("Došle je do pogreške prilikom učitavanja materijala... Molimo pokušajte ponovo kasnije!");
            }
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
            if(!closed)
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

        private void btnNext_Click(object sender, EventArgs e)
        {
            pnForm1.Visible = !pnForm1.Visible;
            pnForm2.Visible = !pnForm2.Visible;
            btnNext.Text = pnForm1.Visible ? "Sljedeće" : "Prijašnje";
        }

        private void btnSaveCreate_Click(object sender, EventArgs e)
        {
            Enabled = false;
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
                }
                catch (Exception ex)
                {
                    ExceptionHelper.SaveLog(ex);
                    MessageClass.ShowErrorBox("Došlo je do pogreške prilikom kreiranja novog obrazca... Molimo pokušajte ponovo kasnije!");
                }
            }
            Enabled = true;
        }
    }
}