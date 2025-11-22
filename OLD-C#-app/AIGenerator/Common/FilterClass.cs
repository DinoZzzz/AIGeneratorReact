using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIGenerator.Common
{
    public class FilterClass
    {
        public static IQueryable<ReportForm> FilterForms(FormsFilter formsFilter, IQueryable<ReportForm> forms)
        {
            if (!formsFilter.IsActive) return forms;
            if (!string.IsNullOrEmpty(formsFilter.Stock)) forms = forms.Where(x => x.Stock.ToLower().Contains(formsFilter.Stock.ToLower()));
            if (!string.IsNullOrEmpty(formsFilter.UserId)) forms = forms.Where(x => x.UserId == formsFilter.UserId);
            if (formsFilter.TypeId != 0) forms = forms.Where(x => x.TypeId == formsFilter.TypeId);
            forms = forms.Where(x => x.ExaminationDate >= formsFilter.StartDate && x.ExaminationDate <= formsFilter.EndDate);
            return forms;
        }
    }
}
