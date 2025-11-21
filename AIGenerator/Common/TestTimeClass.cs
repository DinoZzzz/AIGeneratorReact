using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIGenerator.Common
{
    public class TestTimeClass
    {
        public static DateTime GetTestTime(int examinationProcedureId, int draftId, int diameter)
        {
            if (examinationProcedureId == 1)
            {
                return CalculateTestTime(new List<double> { 5, 5, 7, 10, 14, 19, 24, 27, 29 }, draftId, diameter);
            }
            else if (examinationProcedureId == 2)
            {
                return CalculateTestTime(new List<double> { 4, 4, 6, 7, 11, 15, 19, 21, 22 }, draftId, diameter);
            }
            else if (examinationProcedureId == 3)
            {
                return CalculateTestTime(new List<double> { 3, 3, 4, 5, 6, 11, 14, 15, 16 }, draftId, diameter);
            }
            else if (examinationProcedureId == 4)
            {
                return CalculateTestTime(new List<double> { 1.5, 1.5, 2, 2.5, 4, 5, 7, 7, 8 }, draftId, diameter);
            }
            return DateTime.Today;
        }

        private static DateTime CalculateTestTime(List<double> times, int draftId, int diameter)
        {
            int value = diameter;
            List<int> list = new List<int> { 100, 200, 300, 400, 600, 800, 1000, 1100, 1200 };
            if (value >= list.Max())
            {
               return DateTime.Today.AddMinutes(times[times.Count - 1]);
            }
            int l = 0, r = list.Count - 1;
            while (r - l > 1)
            {
                int m = (l + r) / 2;
                if (list[m] > value)
                    r = m;
                else
                    l = m;
            }
            double time = times[l];
            time += (times[r] - times[l]) * (value - list[l]) / (list[r] - list[l]);
            return DateTime.Today.AddMinutes(draftId == 4 ? time / 2 : time);
        }
    }
}
