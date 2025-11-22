using Enums;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    public class ReportForm
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public int Ordinal { get; set; } = 1;
        public string UserId { get; set; } = "";
        public int TypeId { get; set; } = 1;
        /// <summary>
        /// Skica
        /// </summary>
        public int DraftId { get; set; } = 1;
        public string Stock { get; set; } = "";
        public int ExaminationProcedureId { get; set; } = 1;
        public string CustomerId { get; set; } = "";
        public double Temperature { get; set; } = 0;
        public int PaneMaterialId { get; set; } = 0;
        public string ConstructionId { get; set; } = "";
        /// <summary>
        /// Okrugli, kvadratni
        /// </summary>
        public int MaterialTypeId { get; set; } = 1;
        public int PipeMaterialId { get; set; } = 1;
        public double PipeLength { get; set; } = 0;
        /// <summary>
        /// Promjer unut.
        /// </summary>
        public double PipeDiameter { get; set; } = 0;
        public double PipelineSlope { get; set; } = 0;
        public double PaneWidth { get; set; } = 0;
        public double PaneHeight { get; set; } = 0;
        public double PaneLength { get; set; } = 0;
        public double SaturationOfTestSection { get; set; } = 0;
        public double WaterHeight { get; set; } = 0;
        ///// <summary>
        ///// Omočena površina okna
        ///// </summary>
        //public double WettedShaftSurface { get; set; }
        ///// <summary>
        ///// Omočena površina cijevi
        ///// </summary>
        //public double WettedPipeSurface { get; set; }
        /// <summary>
        /// Ukupna omočena površina
        /// </summary>
        //public double TotalWettedArea { get; set; }
        public double WaterHeightStart { get; set; } = 0;
        public double WaterHeightEnd { get; set; } = 0;
        public double PressureStart { get; set; } = 0;   
        public double PressureEnd { get; set; } = 0;
        public double RoHeight { get; set; } = 0;
        public double PaneDiameter { get; set; } = 0;
        /// <summary>
        /// Taložna visina
        /// </summary>
        public double DepositionalHeight { get; set; } = 0;
        public DateTime StabilizationTime { get; set; } = DateTime.Today.AddMinutes(5);
        public DateTime SaturationTime { get; set; } = DateTime.Today.AddHours(1);
        public bool Satisfies { get; set; } = true;
        public string Remark { get; set; } = "";
        public string Deviation { get; set; } = "";
        public DateTime ExaminationDate { get; set; } = DateTime.Today;
        public DateTime ExaminationDuration { get; set; } = DateTime.Today.AddMinutes(30);
        public DateTime ExaminationStartTime { get; set; } = DateTime.Today.AddHours(8);
        public DateTime ExaminationEndTime { get; set; } = DateTime.Today.AddHours(9);
        public DateTime CreationTime { get; set; } = DateTime.Now;
        public DateTime UpdateTime { get; set; } = DateTime.Now;

        private double PI = Math.PI;

        public string CalculateDuration()
        {
            TimeSpan timeSpan = ExaminationEndTime.Subtract(ExaminationStartTime);
            return $"{(timeSpan.Hours < 10 ? "0" : "")}{timeSpan.Hours}:{(timeSpan.Minutes < 10 ? "0" : "")}{timeSpan.Minutes} h";
        }

        public double CalculateWaterLoss()
        {
            return Math.Abs(WaterHeightEnd - WaterHeightStart);
        }

        public double CalculateWaterVolumeLoss()
        {
            if (MaterialTypeId == 1) return CalculateWaterLoss() * PaneDiameter * PaneDiameter * PI / 4;
            else if (MaterialTypeId == 2) return CalculateWaterLoss() * PaneWidth * PaneLength;
            return 0;
        }

        public double CalculateLoss()
        {
            return CalculateWaterLoss() * CalculateWettedShaftSurface();
        }

        public double CalculatePressureLoss()
        {
            return Math.Abs(PressureEnd - PressureStart);
        }

        //Omočena površina okna
        public double CalculateWettedShaftSurface()
        {
            //if (StockId >= 1 && StockId <= 3) return (0.4 * 0.4 * PI) + (2 * 0.4 * PI * WaterHeight);
            //else if (StockId >= 4 && StockId <= 6) return
            if (DraftId == 6) return 0;
            if (MaterialTypeId == 1) return (PaneDiameter * PaneDiameter * PI / 4) + (PaneDiameter * PI * WaterHeight);
            else if (MaterialTypeId == 2) return PaneLength * PaneWidth + 2 * (PaneLength * WaterHeight) + 2 * (PaneWidth * WaterHeight);
            return 0;
        }

        //Omočena površina cijevi
        public double CalculateWettedPipeSurface()
        {
            if (DraftId == 1 || DraftId == 4) return 0;
            return Math.Round(PipeDiameter * PipeDiameter * PI / 4, 2) + PipeDiameter * PI * PipeLength;
        }

        //Ukupna omočena površina
        public double CalculateTotalWettedArea()
        {
            return CalculateWettedPipeSurface() + CalculateWettedShaftSurface();
        }

        public bool IsSatisfying(ExaminationProcedure examinationProcedure)
        {
            if (TypeId == 1)
            {
                Satisfies = CalculateResult() <= GetCriteria();
            }
            else
            {
                double loss = CalculatePressureLoss();
                Satisfies = loss <= examinationProcedure.AllowedLoss;
            }
            return Satisfies;
        }

        public double CalculateAllowedLossL()
        {
            return Math.Round(GetCriteria() * CalculateTotalWettedArea(), 2);
        }



        private double GetCriteria()
        {
            if (DraftId == 1) return 0.401;
            else if (DraftId == 2) return 0.201;
            else if (DraftId == 3) return 0.15;
            return 0;
        }

        public double CalculateAllowedLossmm()
        {
            double val = 1;
            if (MaterialTypeId == 1) val = PaneDiameter * PaneDiameter * PI / 4;
            else if (MaterialTypeId == 2) val = PaneLength * PaneWidth;
            return val == 0 ? 0 : Math.Round(CalculateAllowedLossL() / val, 2);
        }

        public double CalculateResult()
        {
            double total = CalculateTotalWettedArea();
            return Math.Round(total == 0 ? 0 : CalculateWaterVolumeLoss() / total, 2);
        }

        public double CalculateHydrostaticHeight()
        {
            if (DraftId == 8) return Math.Abs(WaterHeight - DepositionalHeight - PipeDiameter);
            return WaterHeight - PipeDiameter;
        }

        public static ReportForm CreateCopy(ReportForm reportForm)
        {
            ReportForm rf = new ReportForm()
            {
                ConstructionId = reportForm.ConstructionId,
                CustomerId = reportForm.CustomerId,
                Deviation = reportForm.Deviation,
                PaneDiameter = reportForm.PaneDiameter,
                PaneHeight = reportForm.PaneHeight,
                PaneLength = reportForm.PaneLength,
                PaneWidth = reportForm.PaneWidth,
                DraftId = reportForm.DraftId,
                ExaminationDate = reportForm.ExaminationDate,
                ExaminationDuration = reportForm.ExaminationDuration,
                ExaminationEndTime = reportForm.ExaminationEndTime,
                ExaminationProcedureId = reportForm.ExaminationProcedureId,
                ExaminationStartTime = reportForm.ExaminationStartTime,
                MaterialTypeId = reportForm.MaterialTypeId,
                Ordinal = reportForm.Ordinal,
                PaneMaterialId = reportForm.PaneMaterialId,
                PipeDiameter = reportForm.PipeDiameter,
                PipeLength = reportForm.PipeLength,
                PipelineSlope = reportForm.PipelineSlope,
                PipeMaterialId = reportForm.PipeMaterialId,
                PressureEnd = reportForm.PressureEnd,
                PressureStart = reportForm.PressureStart,
                Remark = reportForm.Remark,
                RoHeight = reportForm.RoHeight,
                Satisfies = reportForm.Satisfies,
                SaturationOfTestSection = reportForm.SaturationOfTestSection,
                StabilizationTime = reportForm.StabilizationTime,
                Stock = reportForm.Stock,
                Temperature = reportForm.Temperature,
                TypeId = reportForm.TypeId,
                UserId = reportForm.UserId,
                WaterHeight = reportForm.WaterHeight,
                WaterHeightEnd = reportForm.WaterHeightEnd,
                WaterHeightStart = reportForm.WaterHeightStart,
                DepositionalHeight = reportForm.DepositionalHeight
            };
            rf.CreationTime = rf.UpdateTime = DateTime.Now;
            return rf;
        }
    }
}
