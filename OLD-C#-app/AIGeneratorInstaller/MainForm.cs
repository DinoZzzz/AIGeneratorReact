using AIGeneratorInstaller.Common;
using Common;
using System.Diagnostics;

namespace AIGeneratorInstaller
{
    public partial class MainForm : Form
    {
        private bool isAppInstalled = false;
        //StreamWriter sw = new StreamWriter(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "ai_log.txt"));

        public MainForm()
        {
            InitializeComponent();
            Directory.CreateDirectory(AppData.FILES_FOLDER_PATH);
            lblText.Text = "Instaliranje aplikacije...";
            //sw.WriteLine("Program started - " + DateTime.Now.ToString());
            //sw.WriteLine(Application.ExecutablePath);
        }

        private void MainForm_Load(object sender, EventArgs e)
        {
            BackColor = CustomColor.Background;
            progressBar1.ForeColor = CustomColor.MainColor;
            timer.Start();
            installTimer.Start();
            //sw.WriteLine("Timers started - " + DateTime.Now.ToString());
        }

        private void timer_Tick(object sender, EventArgs e)
        {
            progressBar1.Value += 1;
            if (progressBar1.Value >= progressBar1.Maximum) progressBar1.Value = 0;
        }

        private void DownloadUpdater(string version, FTPService ftpService)
        {
            //sw.WriteLine("Downloading updater - " + DateTime.Now.ToString());
            string filePath = ftpService.DownloadFile($"AIGeneratorUpdater{version}.exe");
            if (string.IsNullOrEmpty(filePath)) throw new Exception();
            //sw.WriteLine("Updater downloaded - " + DateTime.Now.ToString());
            if (File.Exists(AppData.UPDATER_PATH)) File.Delete(AppData.UPDATER_PATH);
            File.Copy(filePath, AppData.UPDATER_PATH);
            if (File.Exists(filePath)) File.Delete(filePath);

        }

        private void CheckForUpdates()
        {
            try
            {
                //sw.WriteLine("Checking for updates - " + DateTime.Now.ToString());
                FTPService ftpService = new FTPService();
                SetupClass setup = new SetupClass();
                string updaterVersion = "";
                if (File.Exists(AppData.UPDATER_PATH))
                {
                    //sw.WriteLine("Updater exists - " + DateTime.Now.ToString());
                    FileVersionInfo versionInfo = FileVersionInfo.GetVersionInfo(AppData.UPDATER_PATH);
                    //sw.WriteLine("Retreiving updater version - " + DateTime.Now.ToString());
                    updaterVersion = !File.Exists(AppData.UPDATER_PATH) ? "" : versionInfo.ProductVersion ?? "";
                }
                //sw.WriteLine("Getting server updater version - " + DateTime.Now.ToString());
                string serverUpdaterVersion = ftpService.GetUpdaterVersion();
                if (!File.Exists(AppData.UPDATER_PATH))
                {
                    //sw.WriteLine("Updater doesn't exists - " + DateTime.Now.ToString());
                    DownloadUpdater(serverUpdaterVersion, ftpService);
                }
                else if (updaterVersion != serverUpdaterVersion)
                {
                    //sw.WriteLine("Updater needs update - " + DateTime.Now.ToString());
                    DownloadUpdater(serverUpdaterVersion, ftpService);
                    //sw.WriteLine("Running the new updater - " + DateTime.Now.ToString());
                    Process.Start(AppData.UPDATER_PATH);
                    Application.Exit();
                    return;
                }
                //sw.WriteLine("Retreiving app server version - " + DateTime.Now.ToString());
                string serverVersion = ftpService.GetServerVersion();
                if (isAppInstalled)
                {
                    //sw.WriteLine("App installed - " + DateTime.Now.ToString());
                    if (IsUpdateAvailable(serverVersion))
                    {
                        //sw.WriteLine("Update available - " + DateTime.Now.ToString());
                        //sw.WriteLine("Downloading update - " + DateTime.Now.ToString());
                        string installerPath = ftpService.DownloadFile($"AIGeneratorSetup{serverVersion}.msi");
                        if (string.IsNullOrEmpty(installerPath)) throw new Exception();
                        //sw.WriteLine("Update downloaded - " + DateTime.Now.ToString());
                        //sw.WriteLine("Uninstalling old app - " + DateTime.Now.ToString());
                        int uninstallCode = setup.Uninstall();
                        //sw.WriteLine($"Uninstall finished with code: {uninstallCode} - " + DateTime.Now.ToString());
                        //sw.WriteLine("App uninstalled - " + DateTime.Now.ToString());
                        //sw.WriteLine("Database file deleted - " + DateTime.Now.ToString());
                        //sw.WriteLine("Installing app - " + DateTime.Now.ToString());
                        int processCode = setup.Install(installerPath, AppData.INSTALL_FOLDER_PATH);
                        if (processCode != 0)
                        {
                            MessageBox.Show(processCode.ToString());
                            //sw.WriteLine($"Install failed with code: {processCode} - " + DateTime.Now.ToString());
                            throw new Exception();
                        }
                        //sw.WriteLine("App installed - " + DateTime.Now.ToString());
                        if (File.Exists(installerPath)) File.Delete(installerPath);
                        //sw.WriteLine("Installer deleted - " + DateTime.Now.ToString());
                    }
                    //sw.WriteLine("Starting app - " + DateTime.Now.ToString());
                    Process.Start(AppData.APP_EXE_PATH);
                }
                else
                {
                    //sw.WriteLine("App not installed - " + DateTime.Now.ToString());
                    string installerPath = ftpService.DownloadFile($"AIGeneratorSetup{serverVersion}.msi");
                    //sw.WriteLine("Downloading installer - " + DateTime.Now.ToString());
                    if (string.IsNullOrEmpty(installerPath)) throw new Exception();
                    //sw.WriteLine("Installer path - " + installerPath + " - " + DateTime.Now.ToString());
                    //sw.WriteLine("Intstalling app - " + DateTime.Now.ToString());
                    int processCode = setup.Install(installerPath, AppData.INSTALL_FOLDER_PATH);
                    if (processCode != 0) throw new Exception();
                    //sw.WriteLine("App installed - " + DateTime.Now.ToString());
                    if (File.Exists(installerPath)) File.Delete(installerPath);
                    //sw.WriteLine("Starting app - " + DateTime.Now.ToString());
                    Process.Start(AppData.APP_EXE_PATH);
                }
                //sw.WriteLine("Updater closed - " + DateTime.Now.ToString());
                Application.Exit();
            }
            catch
            {
                //sw.WriteLine("Exception thrown - " + DateTime.Now.ToString());
                timer.Stop();
                installTimer.Stop();
                ShowErrorBox("Došlo je do nepredviđene pogreške... Molimo kontaktirajte administratora!");
                //sw.WriteLine("Updater closing - " + DateTime.Now.ToString());
                Application.Exit();
            }
            //sw.Close();
        }


        public bool IsUpdateAvailable(string serverVersion)
        {
            string localVersion = GetAppVersion();
            return serverVersion != localVersion;
        }

        public string GetAppVersion()
        {
            FileVersionInfo versionInfo = FileVersionInfo.GetVersionInfo(AppData.APP_EXE_PATH);

            return versionInfo.ProductVersion ?? "";
        }

        public bool IsAppInstalled()
        {
            //string uninstallKey = $@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{AppData.PRODUCT_CODE}";
            //using (RegistryKey? key = Registry.LocalMachine.OpenSubKey(uninstallKey))
            //{
            //    if (key != null)
            //    {
            //        ////sw.WriteLine("App key found" + DateTime.Now.ToString());
            //        object? value = key.GetValue("UninstallString");
            //        if (value != null)
            //        {
            //            return true;
            //        }
            //    }
            //}
            //return false;
            //return !string.IsNullOrEmpty(new SetupClass().GetUninstallString(AppData.PRODUCT_CODE));
            return File.Exists(AppData.APP_EXE_PATH);
        }

        private void installTimer_Tick(object sender, EventArgs e)
        {
            installTimer.Stop();
            isAppInstalled = IsAppInstalled();
            //sw.WriteLine($"App installed? {isAppInstalled} - " + DateTime.Now.ToString());
            //sw.WriteLine("Starting install/update thread - " + DateTime.Now.ToString());
            if (isAppInstalled) lblText.Text = "Ažuriranje aplikacije...";
            new Thread(CheckForUpdates).Start();
        }

        public static DialogResult ShowInfoBox(string message) => MessageBox.Show(message, "Informacija", MessageBoxButtons.OK, MessageBoxIcon.Information);

        public static DialogResult ShowErrorBox(string message) => MessageBox.Show(message, "Greška", MessageBoxButtons.OK, MessageBoxIcon.Error);

    }
}
