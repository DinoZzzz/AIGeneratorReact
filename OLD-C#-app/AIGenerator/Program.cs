using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Forms;
using Common;
using Interfaces;
using Microsoft.Win32;
using Services;
using SetupLibrary;
using System;
using System.Deployment.Application;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Management;
using System.Windows.Forms;

namespace AIGenerator
{
    internal static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            //Directory.CreateDirectory(AppData.TEMP_FOLDER_PATH);
            Directory.CreateDirectory(AppData.FILES_FOLDER_PATH);
            CompositionRoot.Wire(new ApplicationModule());
            Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
            AppDomain.CurrentDomain.UnhandledException += CurrentDomain_UnhandledException;
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            //#if !DEBUG
            //LoadingScreenHelper.StartLogoScreen();
            //            UpdateClass updateClass = CompositionRoot.Resolve<UpdateClass>();
            //            try
            //            {
            //                SetupState updaterState = updateClass.CheckForUpdaterUpdate();
            //                if (updaterState == SetupState.InstallFailed) throw new Exception();
            //                if (updateClass.IsUpdateAvailable())
            //                {
            //                    Process.Start(AppData.UPDATER_PATH);
            //                    Application.Exit();
            //                }
            //                else Application.Run(CompositionRoot.Resolve<LoginForm>());
            //            }
            //            catch
            //            {
            //                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom provjere novih ažuriranja... Molimo pokušajte ponovo ili kontaktirajte administratora!");
            //                Application.Exit();
            //            }
            //#endif
            //#if DEBUG
            SetAddRemoveProgramsIcon();
            Application.Run(CompositionRoot.Resolve<LoginForm>());
//#endif
        }

        static void CurrentDomain_UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            if (e.ExceptionObject == null) return;
            ExceptionHelper.SaveLog(e.ExceptionObject as Exception);
        }

        private static void SetAddRemoveProgramsIcon()
        {
            if (ApplicationDeployment.IsNetworkDeployed && ApplicationDeployment.CurrentDeployment.IsFirstRun)
            {
                try
                {
                    var iconSourcePath = Path.Combine(Directory.GetCurrentDirectory(), "icon.ico");

                    if (!File.Exists(iconSourcePath)) return;

                    var myUninstallKey = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall");
                    if (myUninstallKey == null) return;

                    var mySubKeyNames = myUninstallKey.GetSubKeyNames();
                    foreach (var subkeyName in mySubKeyNames)
                    {
                        var myKey = myUninstallKey.OpenSubKey(subkeyName, true);
                        var myValue = myKey.GetValue("DisplayName");
                        if (myValue != null && myValue.ToString() == "AIGenerator")
                        {
                            myKey.SetValue("DisplayIcon", iconSourcePath);
                            break;
                        }
                    }
                }
                catch
                {
                    //log exception
                }
            }
        }
    }
}
