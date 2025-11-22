using Common;
using Enums;
using System;
using System.Data.Entity.Migrations;
using System.Linq;

namespace Models.Common
{
    public class DatabaseInitializer
    {
        public static void OnlineSeed(AppDbContext context)
        {
            if (!context.Users.Any(x => x.Id == AppData.AdminId)) context.Users.AddOrUpdate(new User { Id = AppData.AdminId, IsAdmin = true, IsDarkMode = false, LastName = "Admin", Name = "Admin", Password = SafeClass.EncryptData("admin"), Username = "admin", CreationTime = DateTime.Now });
            if (!context.Users.Any(x => x.Id == AppData.DebugId)) context.Users.AddOrUpdate(new User { Id = AppData.DebugId, IsAdmin = true, IsDarkMode = false, LastName = "Debug", Name = "Debug", Password = SafeClass.EncryptData("DebugP4ss"), Username = "debug", CreationTime = DateTime.Now });

            context.ReportTypes.AddOrUpdate(new ReportType { Id = 1, Type = "Metoda 1610" });

            context.UserAccreditations.AddOrUpdate(new UserReportAccreditation { Id = "67bd5058-ad20-483d-9d6f-94d83b02305a", ReportTypeId = 1, UserId = AppData.AdminId });
            context.UserAccreditations.AddOrUpdate(new UserReportAccreditation { Id = "3a8fef8a-fcf9-45ad-9532-fb1b28fbefcf", ReportTypeId = 1, UserId = AppData.DebugId });
            context.ReportFormTypes.AddOrUpdate(new ReportFormType { Id = 1, TypeId = 1, Name = "Metoda vodom W" });
            context.ReportFormTypes.AddOrUpdate(new ReportFormType { Id = 2, TypeId = 1, Name = "Metoda zrak L" });
            context.ReportDrafts.AddOrUpdate(new ReportDraft { Id = 1, ReportFormTypeId = 1, DraftId = (int)DraftEnum.Ispitivanje_okna });
            context.ReportDrafts.AddOrUpdate(new ReportDraft { Id = 2, ReportFormTypeId = 1, DraftId = (int)DraftEnum.Ispitivanje_okna_cjevovoda });
            context.ReportDrafts.AddOrUpdate(new ReportDraft { Id = 3, ReportFormTypeId = 1, DraftId = (int)DraftEnum.Ispitivanje_cjevovoda });
            context.ReportDrafts.AddOrUpdate(new ReportDraft { Id = 4, ReportFormTypeId = 2, DraftId = (int)DraftEnum.Ispitivanje_okna });
            context.ReportDrafts.AddOrUpdate(new ReportDraft { Id = 5, ReportFormTypeId = 2, DraftId = (int)DraftEnum.Ispitivanje_okna_cjevovoda });
            context.ReportDrafts.AddOrUpdate(new ReportDraft { Id = 6, ReportFormTypeId = 2, DraftId = (int)DraftEnum.Ispitivanje_cjevovoda });
            context.ReportDrafts.AddOrUpdate(new ReportDraft { Id = 7, ReportFormTypeId = 1, DraftId = (int)DraftEnum.Ispitivanje_slivnika });
            context.ReportDrafts.AddOrUpdate(new ReportDraft { Id = 8, ReportFormTypeId = 1, DraftId = (int)DraftEnum.Ispitivanje_slivnika_cjevovoda });
            context.ReportDrafts.AddOrUpdate(new ReportDraft { Id = 9, ReportFormTypeId = 2, DraftId = (int)DraftEnum.Ispitivanje_slivnika });
            context.ReportDrafts.AddOrUpdate(new ReportDraft { Id = 10, ReportFormTypeId = 2, DraftId = (int)DraftEnum.Ispitivanje_slivnika_cjevovoda });

            context.MaterialTypes.AddOrUpdate(new MaterialType { Id = 1, Name = "Okrugli" });
            context.MaterialTypes.AddOrUpdate(new MaterialType { Id = 2, Name = "Kvadratni" });

            context.Materials.AddOrUpdate(new Material { Id = 1, Name = "PVC", TypeId = 1 });
            context.Materials.AddOrUpdate(new Material { Id = 2, Name = "PE", TypeId = 1 });
            context.Materials.AddOrUpdate(new Material { Id = 3, Name = "PEHD", TypeId = 1 });
            context.Materials.AddOrUpdate(new Material { Id = 4, Name = "GRP", TypeId = 1 });
            context.Materials.AddOrUpdate(new Material { Id = 5, Name = "PP", TypeId = 1 });
            context.Materials.AddOrUpdate(new Material { Id = 6, Name = "Betonska", TypeId = 1 });
            context.Materials.AddOrUpdate(new Material { Id = 7, Name = "Armirano betonska", TypeId = 2 });

            context.ExaminationProcedures.AddOrUpdate(new ExaminationProcedure { Id = 1, Name = "LA", Pressure = 10, AllowedLoss = 2.5 });
            context.ExaminationProcedures.AddOrUpdate(new ExaminationProcedure { Id = 2, Name = "LB", Pressure = 50, AllowedLoss = 10 });
            context.ExaminationProcedures.AddOrUpdate(new ExaminationProcedure { Id = 3, Name = "LC", Pressure = 100, AllowedLoss = 15 });
            context.ExaminationProcedures.AddOrUpdate(new ExaminationProcedure { Id = 4, Name = "LD", Pressure = 200, AllowedLoss = 15 });
        }
    }
}
