using System;
using System.Collections.Generic;
using Models;
using System.Drawing.Printing;
using System.Drawing;
using Interfaces;
using System.IO;
using System.Linq;

namespace AIGenerator.Common
{
    public class PdfClass
    {
        private readonly Font font10R = new Font("Arial", 10, FontStyle.Regular);
        private readonly Font font10B = new Font("Arial", 10, FontStyle.Bold);
        private readonly Font font12R = new Font("Arial", 12, FontStyle.Regular);
        private readonly Font font12B = new Font("Arial", 12, FontStyle.Bold);
        private readonly Font font14B = new Font("Arial", 14, FontStyle.Bold);
        private readonly Pen blackPen = new Pen(Brushes.Black);
        private readonly Brush blackBrush = Brushes.Black;
        StringFormat multilineFormat = new StringFormat(StringFormatFlags.LineLimit)
        {
            Alignment = StringAlignment.Near
        };

        private readonly IUser IUser;
        private readonly IReportDraft IReportDraft;
        private readonly IMaterial IMaterial;
        private readonly IMaterialType IMaterialType;
        private readonly IExaminationProcedure IExaminationProcedure;

        public PdfClass(IUser iUser, IReportDraft reportDraft, IMaterialType materialType, IMaterial material, IExaminationProcedure examinationProcedure)
        {
            IUser = iUser;
            IReportDraft = reportDraft;
            IMaterialType = materialType;
            IMaterial = material;
            IExaminationProcedure = examinationProcedure;
        }

        public bool ExportForms(string fileName, IQueryable<ReportForm> reportForms, string workOrder)
        {
            try
            {
                using (PrintDocument printDocument = new PrintDocument())
                {
                    List<ReportForm> reportFormsCopy = new List<ReportForm>();
                    reportFormsCopy.AddRange(reportForms);
                    printDocument.PrinterSettings.PrinterName = "Microsoft Print to PDF";
                    printDocument.PrintController = new StandardPrintController();
                    printDocument.PrinterSettings.PrintFileName = fileName;
                    printDocument.PrinterSettings.PrintToFile = true;
                    printDocument.DefaultPageSettings.PaperSize = new PaperSize("A4", 827, 1169);
                    printDocument.PrintPage += (sender, e) => PrintPage(e, workOrder, reportFormsCopy);
                    printDocument.Print();
                }
            }
            catch { return false; }
            return true;
        }

        private void PrintPage(PrintPageEventArgs e, string workOrder, List<ReportForm> reportForms)
        {
            ReportForm reportForm = reportForms[0];
            int pageWidth = e.PageSettings.PaperSize.Width;
            int leftStart = 30, height = 30;
            int headerHeight = 120;
            int stringHeight = 25;
            DrawHeader(e, leftStart, height, headerHeight, workOrder, reportForm);

            int left = leftStart;
            int currentHeight = height + headerHeight + 10;

            StringFormat centerFormat = new StringFormat()
            {
                Alignment = StringAlignment.Center,
                LineAlignment = StringAlignment.Center
            };
            string text = (reportForm.Satisfies ? "" : "NE ") + "ZADOVOLJAVA";
            e.Graphics.DrawString(text, font14B, reportForm.Satisfies ? Brushes.Green : Brushes.Red, new RectangleF(0, currentHeight, pageWidth, 50), centerFormat);
            currentHeight += 60;
            int sectionWidth = 180;
            DrawList(e, left, sectionWidth, currentHeight, stringHeight, GetInfoDataDictionary(reportForm));
            left += sectionWidth + 100;
            text = "Skica: ";
            e.Graphics.DrawString(text, font10R, blackBrush, left, currentHeight);
            e.Graphics.DrawString(IReportDraft.GetById(reportForm.DraftId).Name, font10B, blackBrush, left + 50, currentHeight);
            int maxWidth = 430, maxHeight = 220;
            Size size = DrawImage(e, GetBitmap.GetById(reportForm.DraftId), left, currentHeight + 30, maxWidth, maxHeight);
            currentHeight += size.Height + 80;
            int h2 = 0, h1 = DrawList(e, leftStart, sectionWidth, currentHeight, stringHeight, GetPaneDataDictionary(reportForm));
            if (reportForm.TypeId == 1) h2 = DrawList(e, leftStart + 400, sectionWidth, currentHeight, stringHeight, GetPipeDataDictionary(reportForm));
            else if (reportForm.TypeId == 2)
            {
                h2 = Math.Max(currentHeight, DrawList(e, leftStart + 400, sectionWidth, currentHeight, stringHeight, GetMeasurementsDataDictionary(reportForm)));
                h2 = Math.Max(currentHeight, DrawList(e, leftStart + 400, sectionWidth, h2, stringHeight, GetPressureDataDictionary(reportForm), font10B));
            }
            currentHeight = Math.Max(h1, h2);
            if (reportForm.TypeId == 1)
            {
                currentHeight += 30;
                h1 = Math.Max(currentHeight, DrawList(e, leftStart, sectionWidth, currentHeight, stringHeight, GetCalculationsDataDictionary(reportForm)));
                h2 = Math.Max(currentHeight, DrawList(e, leftStart + 400, sectionWidth, currentHeight, stringHeight, GetWaterDataDictionary(reportForm)));
                currentHeight = Math.Max(h1, h2);
            }
            currentHeight += 40;
            if (reportForm.TypeId == 2)
            {
                size = DrawImage(e, Properties.Resources.table, Convert.ToInt32(leftStart * 1.5), currentHeight, pageWidth - 4 * leftStart, 350);
                currentHeight += size.Height + 40;
            }
            int rectangleSize = 350;
            left = leftStart;
            e.Graphics.DrawString("Napomena:", font10R, blackBrush, left, currentHeight);
            e.Graphics.DrawString(reportForm.Remark, font10B, blackBrush, new RectangleF(left, currentHeight + stringHeight, rectangleSize, rectangleSize), multilineFormat);
            left += 400;
            e.Graphics.DrawString("Odstupanje od norme:", font10R, blackBrush, left, currentHeight);
            e.Graphics.DrawString(reportForm.Deviation, font10B, blackBrush, new RectangleF(left, currentHeight + stringHeight, rectangleSize, rectangleSize), multilineFormat);
            User user = IUser.GetById(reportForm.UserId);
            e.Graphics.DrawString("Izradio: " + (user == null ? "" : user.GetName()), font12B, blackBrush, new RectangleF(0, e.PageBounds.Height - 110, pageWidth, 50), centerFormat);
            reportForms.Remove(reportForm);
            e.HasMorePages = reportForms.Count > 0;
        }

        private Size DrawImage(PrintPageEventArgs e, Bitmap bitmap, int x, int y, int maxWidth, int maxHeight)
        {
            Size size = new Size();
            using (Image draft = bitmap)
            {
                float ratio = draft.Width / draft.Height;
                size.Width = draft.Width;
                size.Height = draft.Height;
                if (size.Width > maxWidth)
                {
                    size.Width = maxWidth;
                    size.Height = Convert.ToInt32(size.Width / ratio);
                }
                if (size.Height > maxHeight)
                {
                    size.Height = maxHeight;
                    size.Width = Convert.ToInt32(size.Height * ratio);
                }
                x += (maxWidth - size.Width) / 2;
                using (Bitmap newBitmap = new Bitmap(bitmap, size.Width, size.Height))
                    e.Graphics.DrawImage(newBitmap, x, y);
            }
            return size;
        }

        private Dictionary<string, string> GetPaneDataDictionary(ReportForm reportForm)
        {
            Dictionary<string, string> dictionary = new Dictionary<string, string>
            {
                { "Dionica", reportForm.Stock },
                { "Tip" + (reportForm.DraftId == 6 ? "" : " okna"), IMaterialType.GetById(reportForm.MaterialTypeId).Name },
            };
            if (reportForm.TypeId == 1)
            {
                dictionary.Add("Materijal okna", IMaterial.GetById(reportForm.PaneMaterialId).Name);
                if (reportForm.MaterialTypeId == 1)
                {
                    dictionary.Add("Visina ro", Math.Round(reportForm.RoHeight * 100, 2).ToString("0.00") + " cm");
                    dictionary.Add("Promjer okna", Math.Round(reportForm.PaneDiameter * 1000, 2).ToString("0.00") + " mm");
                    dictionary.Add("Visina vode", Math.Round(reportForm.WaterHeight * 100, 2).ToString("0.00") + " cm");
                }
                else if (reportForm.MaterialTypeId == 2)
                {
                    dictionary.Add("Širina okna", Math.Round(reportForm.PaneWidth * 100, 2).ToString("0.00") + " cm");
                    dictionary.Add("Dužina okna", Math.Round(reportForm.PaneLength * 100, 2).ToString("0.00") + " cm");
                    dictionary.Add("Visina okna", Math.Round(reportForm.PaneHeight * 100, 2).ToString("0.00") + " cm");
                    dictionary.Add("Visina vode", Math.Round(reportForm.WaterHeight * 100, 2).ToString("0.00") + " cm");
                    dictionary.Add("Vrijeme zasićenja", reportForm.SaturationTime.Hour + "h " + (reportForm.SaturationTime.Minute < 10 ? "0" : "") + reportForm.SaturationTime.Minute + "m");
                }
                dictionary.Add("Trajanje", GetDateStringmmss(reportForm.ExaminationDuration));

            }
            else if (reportForm.TypeId == 2)
            {
                dictionary.Add("Metoda ispitivanja", IExaminationProcedure.GetById(reportForm.ExaminationProcedureId).Name);

                if (reportForm.DraftId == 4 || reportForm.DraftId == 5)
                {
                    dictionary.Add("Materijal okna", IMaterial.GetById(reportForm.PaneMaterialId).Name);
                    dictionary.Add("Promjer okna", Math.Round(reportForm.PaneDiameter * 1000, 2).ToString("0.00") + " mm");
                }
                if (reportForm.DraftId == 5 || reportForm.DraftId == 6)
                {
                    dictionary.Add("Materijal cijevi", IMaterial.GetById(reportForm.PipeMaterialId).Name);
                    dictionary.Add("Dužina cijevi", Math.Round(reportForm.PipeLength, 2).ToString("0.00") + " m");
                    dictionary.Add("Promjer cijevi", Math.Round(reportForm.PipeDiameter * 1000, 2).ToString("0.00") + " mm");
                }
            }
            return dictionary;
        }

        private Dictionary<string, string> GetMeasurementsDataDictionary(ReportForm reportForm)
        {
            Dictionary<string, string> dictionary = new Dictionary<string, string>
            {
                { "Vrijeme stabilizacije", GetDateStringmmss(reportForm.StabilizationTime) },
                { "Trajanje", GetDateStringmmss(reportForm.ExaminationDuration) },
                { "Vrijeme ispitivanja", GetDateStringmmss(TestTimeClass.GetTestTime(reportForm.ExaminationProcedureId, reportForm.DraftId, reportForm.DraftId != 6 ? Convert.ToInt32(reportForm.PaneDiameter) : Convert.ToInt32(reportForm.PipeDiameter))) },
            };
            return dictionary;
        }

        private string GetDateStringmmss(DateTime dateTime)
        {
            return dateTime.Minute + "m " + (dateTime.Second < 10 ? "0" : "") + dateTime.Second + "s";
        }

        private Dictionary<string, string> GetPressureDataDictionary(ReportForm reportForm)
        {
            Dictionary<string, string> dictionary = new Dictionary<string, string>
            {
                { "Tlak na početku", Math.Round(reportForm.PressureStart, 2).ToString("0.00") + " mbar" },
                { "Tlak na kraju", Math.Round(reportForm.PressureEnd, 2).ToString("0.00") + " mbar" },
                { "Pad tlaka", Math.Round(reportForm.CalculatePressureLoss(), 2).ToString("0.00") + " mbar" },
            };
            return dictionary;
        }

        private Dictionary<string, string> GetPipeDataDictionary(ReportForm reportForm)
        {
            if (reportForm.DraftId == 1 || reportForm.DraftId == 4) return new Dictionary<string, string>();
            Dictionary<string, string> dictionary = new Dictionary<string, string>
            {
                { "Materijal cijevi", IMaterial.GetById(reportForm.PipeMaterialId).Name },
                { "Dužina cijevi", Math.Round(reportForm.PipeLength, 2).ToString("0.00") + " m" },
                { "Promjer cijevi", Math.Round(reportForm.PipeDiameter * 1000, 2).ToString("0.00") + " mm" },
            };
            if (reportForm.DraftId == 8) dictionary.Add("Taložna visina", Math.Round(reportForm.DepositionalHeight, 2).ToString("0.00") + " cm");
            dictionary.Add("Nagib", Math.Round(reportForm.PipelineSlope, 2).ToString("0.00") + " %");
            return dictionary;
        }

        private Dictionary<string, string> GetCalculationsDataDictionary(ReportForm reportForm)
        {
            Dictionary<string, string> dictionary = new Dictionary<string, string>
            {
                { "Omočena površina okna", Math.Round(reportForm.CalculateWettedShaftSurface(), 2).ToString("0.00") + " m" + StringClass.SupperScript2() },
            };
            if (reportForm.DraftId != 1) dictionary.Add("Omočena površina cijevi", Math.Round(reportForm.CalculateWettedPipeSurface(), 2).ToString("0.00") + " m" + StringClass.SupperScript2());
            dictionary.Add("Ukupna omočena površina", Math.Round(reportForm.CalculateTotalWettedArea(), 2).ToString("0.00") + " m" + StringClass.SupperScript2());
            dictionary.Add("Dozvoljeni gubitak", Math.Round(reportForm.CalculateAllowedLossL(), 2).ToString("0.00") + " l");
            dictionary.Add("Dozvoljeni gubitak%%", Math.Round(reportForm.CalculateAllowedLossmm(), 2).ToString("0.00") + " mm");
            if (reportForm.DraftId == 2) dictionary.Add("Hidrostatska visina", Math.Round(reportForm.CalculateHydrostaticHeight() * 100, 2).ToString("0.00") + " cm");
            return dictionary;
        }

        private Dictionary<string, string> GetWaterDataDictionary(ReportForm reportForm)
        {
            Dictionary<string, string> dictionary = new Dictionary<string, string>
            {
                { "Visina vode u oknu na početku", Math.Round(reportForm.WaterHeightStart, 2).ToString("0.00") + " mm" },
                { "Visina vode u oknu na kraju", Math.Round(reportForm.WaterHeightEnd, 2).ToString("0.00") + " mm"},
                { "Gubitak vode", Math.Round(reportForm.CalculateWaterLoss(), 2).ToString("0.00") + " mm" },
                { "ΔV", Math.Round(reportForm.CalculateWaterVolumeLoss(), 2).ToString("0.00") + " l" },
                { "Izmjereni gubitak", Math.Round(reportForm.CalculateResult(), 2).ToString("0.00") + " l / m" + StringClass.SupperScript2() },
            };
            return dictionary;
        }

        private Dictionary<string, string> GetInfoDataDictionary(ReportForm reportForm)
        {
            Dictionary<string, string> dictionary = new Dictionary<string, string>
            {
                { "Temperatura", Math.Round(reportForm.Temperature, 2).ToString("0.00") + " °C" },
                { "Datum ispitivanja", reportForm.ExaminationDate.ToShortDateString()},
            };
            return dictionary;
        }

        private int DrawList(PrintPageEventArgs e, int left, int sectionWidth, int height, int stringHeight, Dictionary<string, string> data, Font font = null)
        {
            if (font == null) font = font10R;
            StringFormat format = new StringFormat(StringFormatFlags.DirectionRightToLeft);
            foreach (KeyValuePair<string, string> kvp in data)
            {
                e.Graphics.DrawString(kvp.Key.Replace("%%", ""), font, blackBrush, left + sectionWidth, height, format);
                e.Graphics.DrawString(":", font, blackBrush, left + sectionWidth - 4, height);
                int strHeight = Convert.ToInt32(e.Graphics.MeasureString(kvp.Value, font10B, 330).Height);
                e.Graphics.DrawString(kvp.Value == "0" ? "-" : kvp.Value, font10B, blackBrush, new Rectangle(left + sectionWidth + 5, height, 330, strHeight), multilineFormat);
                height += strHeight + 10;
            }
            return height;
        }

        private PointF GetCenterPoint(float startX, float startY, float boxWidth, float boxHeight, float width, float height)
        {
            PointF pointF;
            return pointF = new PointF(startX + (boxWidth - width) / 2, startY + (boxHeight - height) / 2);
        }

        private void DrawHeader(PrintPageEventArgs e, int leftStart, int height, int headerHeight, string workOrder, ReportForm reportForm)
        {
            int left = leftStart;
            int currentHeight = height;
            int stringHeight = 25;
            Bitmap icon = Properties.Resources.ai_icon;
            e.Graphics.DrawImage(icon, GetCenterPoint(left, height, 120, headerHeight, 100, 100));
            left += 150;
            e.Graphics.DrawRectangle(blackPen, new Rectangle(left, height, 1, headerHeight));
            int sectionWidth = 250;
            string text = "GRAĐEVINSKI LABORATORIJ";
            currentHeight += 10;
            e.Graphics.DrawString(text, font10R, blackBrush, GetCenterPoint(left, currentHeight, sectionWidth, stringHeight, StringClass.StringWidth(text, font10R), StringClass.StringHeight(text, font10R)));
            currentHeight += stringHeight;
            text = "ANTE-INŽENJERSTVO d.o.o.";
            e.Graphics.DrawString(text, font10B, blackBrush, GetCenterPoint(left, currentHeight, sectionWidth, stringHeight, StringClass.StringWidth(text, font10B), StringClass.StringHeight(text, font10B)));
            currentHeight += stringHeight;
            text = "Petra Krešimira 19 ; 21 266 Zmijavci";
            e.Graphics.DrawString(text, font10R, blackBrush, GetCenterPoint(left, currentHeight, sectionWidth, stringHeight, StringClass.StringWidth(text, font10R), StringClass.StringHeight(text, font10R)));
            currentHeight += stringHeight;
            text = "www.ante-inzenjerstvo.hr";
            e.Graphics.DrawString(text, font10R, blackBrush, GetCenterPoint(left, currentHeight, sectionWidth, stringHeight, StringClass.StringWidth(text, font10R), StringClass.StringHeight(text, font10R)));
            currentHeight = height;
            left += sectionWidth;
            sectionWidth = 230;
            StringFormat format = new StringFormat(StringFormatFlags.LineLimit);
            format.Alignment = StringAlignment.Center;
            format.LineAlignment = StringAlignment.Center;
            e.Graphics.DrawString(MethodFormHelper.GetTypeText(reportForm.TypeId), font12B, blackBrush, new Rectangle(left + 5, currentHeight, sectionWidth - 10, headerHeight), format);
            e.Graphics.DrawRectangle(blackPen, new Rectangle(left, height, 1, headerHeight));
            left += sectionWidth;
            e.Graphics.DrawRectangle(blackPen, new Rectangle(left, height, 1, headerHeight));
            sectionWidth = 145;
            currentHeight = height + 10;
            text = workOrder;
            e.Graphics.DrawString(text, font10B, blackBrush, GetCenterPoint(left, currentHeight, sectionWidth, stringHeight, StringClass.StringWidth(text, font10B), StringClass.StringHeight(text, font10B)));
            currentHeight += stringHeight;
            text = "OB 21-2";
            e.Graphics.DrawString(text, font10R, blackBrush, GetCenterPoint(left, currentHeight, sectionWidth, stringHeight, StringClass.StringWidth(text, font10R), StringClass.StringHeight(text, font10R)));
            currentHeight += stringHeight;
            text = "Izdanje: 2";
            e.Graphics.DrawString(text, font10R, blackBrush, GetCenterPoint(left, currentHeight, sectionWidth, stringHeight, StringClass.StringWidth(text, font10R), StringClass.StringHeight(text, font10R)));
            currentHeight += stringHeight;
            text = "Datum: 09.01.2023.";
            e.Graphics.DrawString(text, font10R, blackBrush, GetCenterPoint(left, currentHeight, sectionWidth, stringHeight, StringClass.StringWidth(text, font10R), StringClass.StringHeight(text, font10R)));
        }
    }
}
