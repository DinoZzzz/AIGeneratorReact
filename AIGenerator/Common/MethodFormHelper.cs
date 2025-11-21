using AIGenerator.AppBindings;
using AIGenerator.Forms;
using AIGenerator.ReportForms.Method1610;
using Interfaces;
using Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.Common
{
    public class MethodFormHelper
    {
        public const int WaterTypeId = 1;
        public const int AirTypeId = 2;

        public static void OpenForm(ReportForm reportForm, string previous, bool? enabled = null)
        {
            (GetForm(reportForm, previous, enabled) as Form).Show();
        }

        public static object GetForm(ReportForm reportForm, string previous, bool? enabled = null)
        {
            Dictionary<string, object> parameters = GetParameters(reportForm, previous, enabled);
            if (reportForm.TypeId == WaterTypeId)
            {
                WaterMethodForm waterMethodForm = CompositionRoot.Resolve<WaterMethodForm>(parameters);
                return waterMethodForm;
            }
            else if (reportForm.TypeId == AirTypeId)
            {
                AirMethodForm waterMethodForm = CompositionRoot.Resolve<AirMethodForm>(parameters);
                return waterMethodForm;
            }
            return null;
        }

        private static Dictionary<string, object> GetParameters(ReportForm reportForm, string previous, bool? enabled = null)
        {
            return new Dictionary<string, object>
            {
                { "reportForm", reportForm },
                { "enabled", enabled ?? CompositionRoot.Resolve<ICustomerConstruction>().IsActive(reportForm.ConstructionId) && reportForm.UserId == LoginForm.currentUser.Id || LoginForm.currentUser.IsAdmin },
                { "previous", previous }
            };
        }

        public static string GetTypeText(int typeId)
        {
            switch (typeId)
            {
                case 1:
                    return "ISPITIVANJE VODONEPROPUSNOSTI CJEVOVODA CIJEVI I KONTROLNA OKNA PREMA HRN EN 1610:2015 - L";
                case 2:
                    return "ISPITIVANJE VODONEPROPUSNOSTI CJEVOVODA METODA ZRAK PREMA HRN EN 1610:2015 - L";
                default:
                    return "";
            }
        }


        public static void ShowPreviousForm(Form form)
        {
            form.WindowState = FormWindowState.Minimized;
            form.Show();
            form.WindowState = CompositionRoot.Resolve<ISetting>().Get().Maximized ? FormWindowState.Maximized : FormWindowState.Normal;
            form.Activate();
        }
    }
}
