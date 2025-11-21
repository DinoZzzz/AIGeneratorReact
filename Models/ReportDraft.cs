using Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    public class ReportDraft
    {
        public int Id { get; set; }
        public int ReportFormTypeId { get; set; }
        public string Name
        {
            get
            {
                switch (DraftId)
                {
                    case 1: return "Shema A - Ispitivanje okna";
                    case 2: return "Shema B - Ispitivanje okna + cjevovoda";
                    case 3: return "Shema C - Ispitivanje cjevovoda";
                    case 4: return "Shema D - Ispitivanje slivnika";
                    case 5: return "Shema E - Ispitivanje slivnika + cjevovoda";
                    default: return "";
                }
            }
        }
        public int DraftId { get; set; }
        [NotMapped]
        public DraftEnum Draft
        {
            get
            {
                switch(DraftId)
                {
                    case 1: return DraftEnum.Ispitivanje_okna;
                    case 2: return DraftEnum.Ispitivanje_okna_cjevovoda;
                    case 3: return DraftEnum.Ispitivanje_cjevovoda;
                    case 4: return DraftEnum.Ispitivanje_okna;
                    case 5: return DraftEnum.Ispitivanje_slivnika_cjevovoda;
                    default: return DraftEnum.None;
                }
            }
        }

        public override string ToString()
        {
            return Name;
        }
    }
}
