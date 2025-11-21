using Microsoft.VisualStudio.TestTools.UnitTesting;
using Models;
using System;

namespace AIGeneratorTests
{
    [TestClass]
    public class WaterMethod
    {
        [TestMethod]
        public void SquarePane()
        {
            ReportForm reportForm = new ReportForm 
            {
                PaneLength = 1,
                PaneWidth = 1.2,
                PaneHeight = 2.2,
                WaterHeight = 2.14,
                PipeDiameter = 0.564,
                PipeLength = 43.76,
                WaterHeightStart = 5.1,
                TypeId = 1,
                MaterialTypeId = 2,
                DraftId = 2
            };
            Assert.AreEqual(5.1, Math.Round(reportForm.CalculateWaterLoss(), 2));
            Assert.AreEqual(10.62, Math.Round(reportForm.CalculateWettedShaftSurface(), 2));
            Assert.AreEqual(77.75, Math.Round(reportForm.CalculateWettedPipeSurface(), 2));
            Assert.AreEqual(88.36, Math.Round(reportForm.CalculateTotalWettedArea(), 2));
            Assert.AreEqual(17.76, Math.Round(reportForm.CalculateAllowedLossL(), 2));
            Assert.AreEqual(14.8, Math.Round(reportForm.CalculateAllowedLossmm(), 2));
            Assert.AreEqual(6.12, Math.Round(reportForm.CalculateWaterVolumeLoss(), 2));
            Assert.AreEqual(0.07, Math.Round(reportForm.CalculateResult(), 2));
        }

        [TestMethod]
        public void RoundPane()
        {
            ReportForm reportForm = new ReportForm()
            {
                RoHeight = 1.5,
                PaneDiameter = 0.800,
                WaterHeight = 1.45,
                PipeDiameter = 0.300,
                PipeLength = 30.59,
                WaterHeightStart = 6.1,
                TypeId = 1,
                MaterialTypeId = 1,
                DraftId = 2
            };
            Assert.AreEqual(6.1, Math.Round(reportForm.CalculateWaterLoss(), 2));
            Assert.AreEqual(4.14, Math.Round(reportForm.CalculateWettedShaftSurface(), 2));
            Assert.AreEqual(28.89, Math.Round(reportForm.CalculateWettedPipeSurface(), 2));
            Assert.AreEqual(33.03, Math.Round(reportForm.CalculateTotalWettedArea(), 2));
            Assert.AreEqual(6.64, Math.Round(reportForm.CalculateAllowedLossL(), 2));
            Assert.AreEqual(13.22, Math.Round(reportForm.CalculateAllowedLossmm(), 2));
            Assert.AreEqual(3.06, Math.Round(reportForm.CalculateWaterVolumeLoss(), 2));
            Assert.AreEqual(0.09, Math.Round(reportForm.CalculateResult(), 2));
        }
    }
}
