using System;
using System.Linq;
using Microsoft.Office.Interop.Word;
using Models;
using Interfaces;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace AIGenerator.Common
{
    public class MSWord
    {
        private readonly IUser IUser;
        private readonly ICustomer ICustomer;
        private readonly ICustomerConstruction ICustomerConstruction;
        private readonly IReportForm IReportForm;
        private readonly IExaminationProcedure IExaminationProcedure;
        private readonly IMaterial IMaterial;
        private readonly IReportExportForm IReportExportForm;

        public MSWord(IUser user, ICustomer customer, IReportForm reportForm, IExaminationProcedure examinationProcedure, ICustomerConstruction customerConstruction, IMaterial material, IReportExportForm reportExportForm)
        {
            IUser = user;
            ICustomer = customer;
            ICustomerConstruction = customerConstruction;
            IReportForm = reportForm;
            IExaminationProcedure = examinationProcedure;
            IMaterial = material;
            IReportExportForm = reportExportForm;
        }

        public bool Export(string filePath, ReportExport reportExport)
        {
            Application application = new Application();
            try
            {
                application.Visible = false;


                object missing = System.Reflection.Missing.Value;

                string tempFilePath = Path.Combine(Directory.GetCurrentDirectory(), "Templates", "method1610.doc");
                if (!File.Exists(tempFilePath)) return false;

                CustomerConstruction customerConstruction = ICustomerConstruction.GetById(reportExport.ConstructionId);

                Document document = application.Documents.Open(tempFilePath);
                application.ActiveWindow.View.ReadingLayout = false;
                ReplaceText(document.Content, "%Creator%", IUser.GetById(reportExport.UserId).GetName());
                if(string.IsNullOrEmpty(reportExport.CertifierId)) ReplaceText(document.Content, "%Certifier%", "");
                else
                {
                    User user = IUser.GetById(reportExport.CertifierId);
                    ReplaceText(document.Content, "%Certifier%", user != null ? user.GetName() : "");
                }
                ReplaceText(document.Content, "%ConstructionSitePart%", string.IsNullOrEmpty(reportExport.ConstructionPart) ? "-" : reportExport.ConstructionPart);


                foreach (Section section in document.Sections)
                {
                    foreach (HeaderFooter footer in section.Footers)
                    {
                        ReplaceText(footer.Range, "%CurrentDate%", reportExport.ExaminationDate.ToString("dd.MM.yyyy."));
                        ReplaceText(footer.Range, "%WorkOrder%", customerConstruction.WorkOrder);
                    }
                }
                List<string> selectedReports = IReportExportForm.GetByExport(reportExport.Id).Select(x => x.FormId).ToList();
                IQueryable<ReportForm> reportForms = IReportForm.GetAll().Where(x => selectedReports.Contains(x.Id));
                DateTime minDate = reportForms.Min(x => x.ExaminationDate);
                DateTime maxDate = reportForms.Max(x => x.ExaminationDate);
                if(minDate == maxDate) ReplaceText(document.Content, "%ExaminationDate%", minDate.ToString("dd.MM.yyyy."));
                else ReplaceText(document.Content, "%ExaminationDate%", minDate.ToString("dd.MM.yyyy.") + " - " + maxDate.ToString("dd.MM.yyyy."));
                UpdatePaneText(document.Content, reportForms);
                UpdateTubeText(document.Content, reportForms);
                double minTemperature = reportForms.Min(x => x.Temperature);
                double maxTemperature = reportForms.Max(x => x.Temperature);
                if(minTemperature == maxTemperature) ReplaceText(document.Content, "%Temperature%", Math.Round(minTemperature, 2).ToString("0") + " ºC");
                else ReplaceText(document.Content, "%Temperature%", Math.Round(minTemperature, 2).ToString("0") + " - " + Math.Round(maxTemperature, 2).ToString("0") + " ºC");
                FillCustomerData(application, document.Content, reportForms);
                int count = reportForms.Count(x => x.DraftId != 3 && x.DraftId != 6);
                ReplaceText(document.Content, "%RevisionPaneCount%", count == 0 ? "-" : count + " kom.");
                double length = Math.Round(reportForms.Where(x => x.DraftId != 1 && x.DraftId != 4).Select(x => x.PipeLength).DefaultIfEmpty(0).Sum(), 1);
                ReplaceText(document.Content, "%TubeLengthSum%", length == 0 ? "-" : length.ToString("0.00") + " m");
                ReplaceText(document.Content, "%Drainage%", reportExport.Drainage);
                Table airTable = document.Tables[4];
                int ordinal = 1;

                bool anyWater = reportForms.Any(x => x.TypeId == 1);
                bool anyAir = reportForms.Any(x => x.TypeId == 2);
                foreach (ReportForm form in reportForms.Where(x => x.TypeId == 2).OrderBy(x => x.Ordinal)) //Air
                {
                    Row row = airTable.Rows.Count - 1 <= ordinal && ordinal == 1 ? airTable.Rows[airTable.Rows.Count] : airTable.Rows.Add(ref missing);
                    AddToAirMethodTable(ordinal, row, IExaminationProcedure.GetById(form.ExaminationProcedureId), form);
                    ordinal++;
                }
                ReplaceText(document.Content, "%AirMethodRemark%", string.IsNullOrEmpty(reportExport.AirRemark) ? "nema" : reportExport.AirRemark);
                ReplaceText(document.Content, "%AirNormDeviation%", string.IsNullOrEmpty(reportExport.AirDeviation) ? "nema" : reportExport.AirDeviation);

                Table waterTable = document.Tables[5];
                ordinal = 1;
                foreach (ReportForm form in reportForms.Where(x => x.TypeId == 1).OrderBy(x => x.Ordinal)) //Water
                {
                    Row row = waterTable.Rows.Count - 1 <= ordinal && ordinal == 1 ? waterTable.Rows[waterTable.Rows.Count] : waterTable.Rows.Add(ref missing);
                    AddToWaterMethodTable(ordinal, row, form);
                    ordinal++;

                }
                ReplaceText(document.Content, "%WaterMethodRemark%", string.IsNullOrEmpty(reportExport.WaterRemark) ? "nema" : reportExport.WaterRemark);
                ReplaceText(document.Content, "%WaterNormDeviation%", string.IsNullOrEmpty(reportExport.WaterDeviation) ? "nema" : reportExport.WaterDeviation);

                if (anyAir) ReplaceText(document.Content, "%AirMethodSatisfies%", (reportForms.Where(x => x.TypeId == 2).Any(x => x.Satisfies == false) ? "ne " : "") + "zadovoljava");
                if (anyWater)
                {
                    StringBuilder sb = new StringBuilder();
                    if (reportForms.Any(x => x.DraftId == 1)) sb.Append("reviziono okno = 0,40 l/m" + StringClass.SupperScript2());
                    if (reportForms.Any(x => x.DraftId == 2)) sb.Append((sb.Length == 0 ? "" : ", ") + "cjevovod + reviziono okno = 0,20 l/m" + StringClass.SupperScript2());
                    if (reportForms.Any(x => x.DraftId == 3)) sb.Append((sb.Length == 0 ? "" : ", ") + "cjevovod = 0,15 l/m" + StringClass.SupperScript2());
                    ReplaceText(document.Content, "%WaterMethodCriteria%", sb.ToString());
                }
                UpdateAirMethod(anyAir, document.Content);
                UpdateWaterMethod(anyWater, document.Content);
                if (anyWater && anyAir)
                {
                    ReplaceText(document.Content, "%AirMethodTableName%", "Tablica br.1");
                    ReplaceText(document.Content, "%WaterMethodTableName%", "Tablica br.2");
                }
                else if (anyWater)
                {
                    ReplaceText(document.Content, "%WaterMethodTableName%", "Tablica br.1");
                }
                else if (anyAir)
                {
                    ReplaceText(document.Content, "%AirMethodTableName%", "Tablica br.1");
                }

                bool satisfies = !reportForms.Any(x => x.Satisfies == false);

                ReplaceText(document.Content, "%Satisfies%", (!satisfies ? "NE " : "") + "ZADOVOLJAVA");
                if (!satisfies)
                {
                    StringBuilder sb = new StringBuilder();
                    List<string> stocks = reportForms.Where(x => x.Satisfies == false).GroupBy(x => x.Stock).Select(x => x.Key).ToList();
                    sb.Append("Dionic" + (stocks.Count == 1 ? "a" : "e") + " ");
                    for (int i = 0; i < stocks.Count; i++)
                    {
                        if (i == stocks.Count - 1 && i != 0) sb.Append(" i ");
                        if (i == 0 || i == stocks.Count - 1) sb.Append(stocks[i]);
                        else sb.Append(", " + stocks[i]);
                    }
                    sb.Append(" ne zadovoljava" + (stocks.Count == 1 ? "" : "ju") + " uvjete vodonepropusnosti.");
                    ReplaceText(document.Content, "%UnsatisfiedStocks%", sb.ToString());
                }
                else ReplaceText(document.Content, "%UnsatisfiedStocks%", "Sve dionice zadovoljavaju uvjete vodonepropusnosti.");
                document.Content.Collapse();
                AddAttachments(application, document.Content, reportExport);
                ReplaceTextAll(document.Content, "<bold>", "");
                ReplaceTextAll(document.Content, "</bold>", "");
                document.SaveAs2(filePath);
                document.Close(false);
                application.Quit(false);
            }
            catch
            {
                application.Quit(false);
                return false;
            }
            return true;
        }

        private void AddAttachments(Application application, Range documentRange, ReportExport reportExport)
        {
            if (reportExport.ReportFiles.Count == 0)
            {
                ReplaceText(documentRange, "%ContentTable%", "");
                ReplaceText(documentRange, "%Attachments%", "");
            }
            else
            {
                StringBuilder sb = new StringBuilder();
                StringBuilder attachmentsBuilder = new StringBuilder();
                string attachments = "<bold>7. PRILOZI</bold>";
                sb.Append(attachments + "\r\r");
                attachmentsBuilder.Append($"\f{attachments}\r");
                int i = 0;
                List<ReportFile> list = new List<ReportFile>();
                foreach (ReportFile reportFile in reportExport.ReportFiles.Where(x => string.IsNullOrEmpty(x.PdfId)))
                {
                    string text = $"7.{i + 1}. {reportFile.Description}";
                    sb.Append($"\t{text}" + (i + 1 == reportExport.ReportFiles.Count ? "" : "\r\r"));
                    if (reportFile.Extension.ToLower() != ".pdf")
                    {
                        list.Add(reportFile);
                        attachmentsBuilder.Append((i != 0 ? "\f" : "") + text + $"\r\r\r%{reportFile.Id}%");
                        attachmentsBuilder.Append($"\r%Attachments%");
                        ReplaceText(documentRange, "%Attachments%", attachmentsBuilder.ToString());
                        attachmentsBuilder.Clear();
                    }
                    else
                    {
                        attachmentsBuilder.Append((i != 0 ? "\f" : "") + text);
                        int j = 0;
                        foreach (ReportFile rf in reportExport.ReportFiles.Where(x => x.PdfId == reportFile.Id).OrderBy(x => x.Ordinal))
                        {
                            list.Add(rf);
                            attachmentsBuilder.Append((j != 0 ? "\f" : "\r\r\r") + $"%{rf.Id}%");
                            j++;
                            attachmentsBuilder.Append($"\r%Attachments%");
                            ReplaceText(documentRange, "%Attachments%", attachmentsBuilder.ToString());
                            attachmentsBuilder.Clear();
                        }
                    }
                    i++;
                }
                ReplaceText(documentRange, "%ContentTable%", sb.ToString());
                ReplaceText(documentRange, "%Attachments%", /*attachmentsBuilder.ToString()*/ "");
                documentRange.Collapse();
                foreach (ReportFile file in list) ReplaceTextWithImage(application, $"%{file.Id}%", file);
                BoldText(documentRange, new List<string> { "7. PRILOZI", "7. PRILOZI" });
            }
        }

        private void FillCustomerData(Application application, Range documentRange, IQueryable<ReportForm> reportForms)
        {
            List<string> customerIds = reportForms.GroupBy(x => x.CustomerId).Select(x => x.Key).ToList();
            List<string> constructionIds = reportForms.GroupBy(x => x.ConstructionId).Select(x => x.Key).ToList();
            List<Customer> customers = ICustomer.GetAll().Where(x => customerIds.Contains(x.Id)).ToList();
            List<CustomerConstruction> customerConstructions = ICustomerConstruction.GetAll().Where(x => constructionIds.Contains(x.Id)).ToList();
            List<string> textToBold = new List<string>();
            List<string> customerData = new List<string>();
            foreach (Customer customer in customers.OrderBy(x => x.Name))
            {
                textToBold.Add(customer.Name);
                customerData.Add("<bold>" + customer.Name + "</bold>\r" + customer.Address + ",\r" + customer.PostalCode + " " + customer.Location);
            }
            ReplaceText(documentRange, "%CustomerDetailed%", string.Join("\r\r", customerData));

            BoldText(documentRange, textToBold);
            documentRange.Collapse();

            ReplaceText(documentRange, "%CustomerName%", string.Join(",\r", customers.OrderBy(x => x.Name).Select(x => x.Name)));
            ReplaceText(documentRange, "%ConstructionLocations%", string.Join(",\r", customerConstructions.OrderBy(x => x.Location).Select(x => x.Location)));
            ReplaceText(documentRange, "%ConstructionSite%", string.Join(",\r", customerConstructions.OrderBy(x => x.Construction).Select(x => x.Construction)));
        }

        private void BoldText(Range documentRange, List<string> textToBold)
        {
            foreach (string text in textToBold)
            {
                documentRange.Find.Execute("<bold>" + text + "</bold>");
                documentRange.Bold = 1;
            }
        }

        private void ReplaceText(Range documentRange, string oldText, string newText)
        {
            Range range = documentRange;
            object replace = WdReplace.wdReplaceAll;
            range.Find.Execute(FindText: oldText, ReplaceWith: newText, Replace: ref replace);
        }

        private void ReplaceTextAll(Range documentRange, string oldText, string newText)
        {
            Range range = documentRange;
            object replace = WdReplace.wdReplaceAll;
            while (range.Find.Execute(FindText: oldText, ReplaceWith: newText, Replace: ref replace)) ;
        }

        private void ReplaceTextWithImage(Application application, string text, ReportFile reportFile)
        {
            application.Selection.Find.Text = text;
            application.Selection.Find.Execute();
            application.Selection.InlineShapes.AddPicture(FileName: ImageClass.GetImagePath(reportFile), LinkToFile: false, SaveWithDocument: true);
        }

        private static void AddToAirMethodTable(int ordinal, Row row, ExaminationProcedure examinationProcedure, ReportForm reportForm)
        {
            row.Cells[1].Range.Text = ordinal + ".";
            row.Cells[2].Range.Text = string.IsNullOrEmpty(reportForm.Stock) ? "-" : reportForm.Stock;
            row.Cells[3].Range.Text = reportForm.DraftId == 4 || reportForm.PipeLength == 0 ? "-" : Math.Round(reportForm.PipeLength, 1).ToString("0.00");
            row.Cells[4].Range.Text = examinationProcedure == null || examinationProcedure.Pressure == 0 ? "-" : examinationProcedure.Name + " - " + examinationProcedure.Pressure.ToString("0.00");
            row.Cells[5].Range.Text = examinationProcedure == null ? "-" : Math.Round(examinationProcedure.AllowedLoss, 2).ToString("0.00");
            row.Cells[6].Range.Text = reportForm.CalculatePressureLoss() == 0 ? "-" : Math.Round(reportForm.CalculatePressureLoss(), 2).ToString("0.00");
            row.Cells[7].Range.Text = 0.23 + "";
        }

        private static void AddToWaterMethodTable(int ordinal, Row row, ReportForm reportForm)
        {
            row.Cells[1].Range.Text = ordinal + ".";
            row.Cells[2].Range.Text = string.IsNullOrEmpty(reportForm.Stock) ? "-" : reportForm.Stock;
            row.Cells[3].Range.Text = reportForm.CalculateAllowedLossL() == 0 ? "-" : Math.Round(reportForm.CalculateAllowedLossL(), 2).ToString("0.00");
            row.Cells[4].Range.Text = reportForm.CalculateWaterVolumeLoss() == 0 ? "-" : Math.Round(reportForm.CalculateWaterVolumeLoss(), 2).ToString("0.00");
            row.Cells[5].Range.Text = reportForm.CalculateResult() == 0 ? "-" : Math.Round(reportForm.CalculateResult(), 2).ToString("0.00");
        }

        private void UpdateAirMethod(bool show, Range documentRange)
        {
            string start_const = "%ShowAirMethodTextStart%";
            string end_const = "%ShowAirMethodTextEnd%";
            string table_start_const = "%ShowAirMethodTableStart%";
            string table_end_const = "%ShowAirMethodTableEnd%";
            if (show)
            {
                ReplaceText(documentRange, start_const, "");
                ReplaceText(documentRange, end_const, "");
                ReplaceText(documentRange, table_start_const, "");
                ReplaceText(documentRange, table_end_const, "");
            }
            else
            {
                RemoveRange(documentRange, start_const, end_const);
                RemoveRange(documentRange, table_start_const, table_end_const);
            }
        }

        private void UpdatePaneText(Range documentRange, IQueryable<ReportForm> reportForms)
        {
            string start_const = "%ShowPaneInfoStart%";
            string end_const = "%ShowPaneInfoEnd%";
            List<ReportForm> forms = reportForms.ToList();
            if (forms.Count() > 0)
            {
                ReplaceText(documentRange, start_const, "");
                ReplaceText(documentRange, end_const, "");
                StringBuilder sb = new StringBuilder();
                int i = 0;
                IEnumerable<string> materials = forms.GroupBy(x => x.PaneMaterialId).Select(x => IMaterial.GetById(x.Key).Name).OrderBy(x => x);
                foreach (string material in materials)
                {
                    if (i == materials.Count() - 1 && i != 0) sb.Append(" i ");
                    if (i == 0 || i == materials.Count() - 1) sb.Append(material);
                    else sb.Append(", " + material);
                    i++;
                }
                ReplaceText(documentRange, "%PaneMaterials%", sb.ToString());
                sb.Clear();
                i = 0;
                IEnumerable<double> diameters = forms.GroupBy(x => x.PaneDiameter).Select(x => x.Key * 1000).OrderBy(x => x);
                foreach (double diameter in diameters)
                {
                    if (i == diameters.Count() - 1 && diameters.Count() > 1) sb.Append(" i ");
                    if (i == 0 || i == diameters.Count() - 1) sb.Append("ø " + diameter);
                    else sb.Append(", ø " + diameter);
                    i++;
                }
                ReplaceText(documentRange, "%PaneDiameters%", sb.ToString());
            }
            else
            {
                RemoveRange(documentRange, start_const, end_const);
            }
        }

        private void UpdateTubeText(Range documentRange, IQueryable<ReportForm> reportForms)
        {
            string start_const = "%ShowTubeInfoStart%";
            string end_const = "%ShowTubeInfoEnd%";
            List<ReportForm> forms = reportForms.Where(x => x.DraftId != 1 && x.DraftId != 4).ToList();
            if (forms.Count() > 0)
            {
                ReplaceText(documentRange, start_const, "");
                ReplaceText(documentRange, end_const, "");
                StringBuilder sb = new StringBuilder();
                int i = 0;
                IEnumerable<string> materials = forms.GroupBy(x => x.PipeMaterialId).Select(x => IMaterial.GetById(x.Key).Name).OrderBy(x => x);
                foreach (string material in materials)
                {
                    if (i == materials.Count() - 1 && i != 0) sb.Append(" i ");
                    if (i == 0 || i == materials.Count() - 1) sb.Append(material);
                    else sb.Append(", " + material);
                    i++;
                }
                ReplaceText(documentRange, "%TubeMaterials%", sb.ToString());
                sb.Clear();
                i = 0;
                IEnumerable<double> diameters = forms.GroupBy(x => x.PipeDiameter).Select(x => x.Key * 1000).OrderBy(x => x);
                foreach (double diameter in diameters)
                {
                    if (i == diameters.Count() - 1 && diameters.Count() > 1) sb.Append(" i ");
                    if (i == 0 || i == diameters.Count() - 1) sb.Append("ø " + diameter);
                    else sb.Append(", ø " + diameter);
                    i++;
                }
                ReplaceText(documentRange, "%TubeDiameters%", sb.ToString());
            }
            else
            {
                RemoveRange(documentRange, start_const, end_const);
            }
        }

        private void UpdateWaterMethod(bool show, Range documentRange)
        {
            string start_const = "%ShowWaterMethodTextStart%";
            string end_const = "%ShowWaterMethodTextEnd%";
            string table_start_const = "%ShowWaterMethodTableStart%";
            string table_end_const = "%ShowWaterMethodTableEnd%";
            if (show)
            {
                ReplaceText(documentRange, start_const, "");
                ReplaceText(documentRange, end_const, "");
                ReplaceText(documentRange, table_start_const, "");
                ReplaceText(documentRange, table_end_const, "");
            }
            else
            {
                RemoveRange(documentRange, start_const, end_const);
                RemoveRange(documentRange, table_start_const, table_end_const);
            }
        }

        private void RemoveRange(Range documentRange, string startConst, string endConst)
        {
            Range range = documentRange, delete;
            range.Find.Execute(startConst);
            delete = range.Duplicate;
            range.Collapse();
            range.Find.Execute(endConst);
            delete.End = range.End;
            delete.Delete();
        }
    }
}