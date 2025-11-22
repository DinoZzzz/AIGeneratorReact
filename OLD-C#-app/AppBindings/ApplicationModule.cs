using Interfaces;
using Models;
using Services;
using Ninject.Modules;
using Common;

namespace AIGenerator.AppBindings
{
    public class ApplicationModule : NinjectModule
    {
        public override void Load()
        {
            Bind<AppDbContext>().ToConstructor(x => new AppDbContext(AppData.CONNECTION_STRING));
            Bind<IAppLog>().To<AppLogService>();
            Bind<IUser>().To<UserService>();
            Bind<ICustomer>().To<CustomerService>();
            Bind<IContact>().To<ContactService>();
            Bind<IUserReportAccreditation>().To<UserReportAccreditationService>();
            Bind<IReportForm>().To<ReportFormService>();
            Bind<IReportFormType>().To<ReportFormTypeService>();
            Bind<IReportExport>().To<ReportExportService>();
            Bind<IReportDraft>().To<ReportDraftService>();
            Bind<IMaterial>().To<MaterialService>();
            Bind<IMaterialType>().To<MaterialTypeService>();
            Bind<ISetting>().To<SettingService>();
            Bind<IExaminationProcedure>().To<ExaminationProcedureService>();
            Bind<ICustomerConstruction>().To<CustomerConstructionService>();
            Bind<IReportExportForm>().To<ReportExportFormService>();
            Bind<IReportFile>().To<ReportFileService>();
            Bind<IAuthService>().To<AuthService>();
            Bind<IFTPService>().To<FTPService>();
            Bind<IEmailService>().To<EmailService>();
            Bind<IReportType>().To<ReportTypeService>();
        }
    }
}
