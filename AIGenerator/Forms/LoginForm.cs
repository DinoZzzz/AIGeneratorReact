using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Dialogs;
using Common;
using Interfaces;
using Models;
using System;
using System.CodeDom;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Windows.Forms;

namespace AIGenerator.Forms
{
    public partial class LoginForm : BaseForm
    {
        private static LoginForm privateLoginForm;
        public static User currentUser = null;
        private readonly IUser IUser;
        private readonly ISetting ISetting;
        private static bool update = false;
        public static bool DarkMode = false;
        public static LoginForm loginForm
        {
            get
            {
                update = true;
                return privateLoginForm;
            }
        }

        public LoginForm(IUser user, ISetting iSetting) : base()
        {
            privateLoginForm = this;
            IUser = user;
            ISetting = iSetting;
            InitializeComponent();
        }

        private void LoginForm_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            DarkMode = ISetting.DarkMode();
#if DEBUG
            txtUsername.Text = "debug";
            txtPassword.Text = "DebugP4ss";
#endif
            containerPanel.Size = pnBody.Size;
            DrawForm();
            LoadingScreenHelper.EndScreen();
            update = false;
            Activate();
        }

        private void pnLogin_Paint(object sender, PaintEventArgs e)
        {
            Panel p = sender as Panel;
            ControlPaint.DrawBorder(e.Graphics, p.DisplayRectangle, CustomColor.MainColor, ButtonBorderStyle.Solid);
        }

        private bool Check()
        {
            if (string.IsNullOrEmpty(txtUsername.Text))
            {
                MessageClass.ShowInfoBox("Unesite vaše korisničko ime!");
                return false;
            }
            if (string.IsNullOrEmpty(txtPassword.Text))
            {
                MessageClass.ShowInfoBox("Unesite vašu lozinku!");
                return false;
            }
            return true;
        }

        private void LoginForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            Application.Exit();
        }

        private void TextBox_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter)
            {
                e.Handled = true;
                btnLogin_Click(btnLogin, e);
            }
        }

        private void DrawForm()
        {
            pnBody.BackColor = BackColor = CustomColor.Background;
            lblWelcome.ForeColor = lblInfoText.ForeColor = CustomColor.Text3;
            lblLogin.ForeColor = CustomColor.MainColor;
            txtUsername.ForeColor = txtPassword.ForeColor = CustomColor.Text2;
            txtUsername.BackColor = txtPassword.BackColor = CustomColor.White10;
            btnLogin.ForeColor = CustomColor.MainColor;
            btnLogin.BackColor = CustomColor.PrimaryBackground;
            menuUserControl1.RedrawControl();
            ReloadForm();
        }

        private void LoginForm_Resize(object sender, EventArgs e)
        {
            int width = (Width < minimumSize.Width ? minimumSize.Width : Width) - menuUserControl1.Size.Width;
            int height = Height < minimumSize.Height ? minimumSize.Height : Height;
            pnLogin.Location = new Point((width - pnLogin.Width) / 2 + menuUserControl1.Size.Width, (height - pnLogin.Height) / 2);
        }

        private void LoginForm_Activated(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            if (!update) return;
            update = false;
            ReloadForm();
            DrawForm();
        }

        private void btnLogin_Click(object sender, EventArgs e)
        {
            Enabled = false;
            try
            {
                if (Check())
                {
                    LoadingScreenHelper.StartLoadingScreen("Prijava...");
                    User user = IUser.GetUser(txtUsername.Text, SafeClass.EncryptData(txtPassword.Text));
                    if (user == null)
                    {
                        MessageClass.ShowInfoBox("Krivo korisničko ime ili lozinka!");
                        Enabled = true;
                        return;
                    }
                    Setting setting = ISetting.Get();
                    DarkMode = setting.DarkMode = user.IsDarkMode;
                    ISetting.SaveData(setting);
                    user.Version = VersionClass.GetVersion();
                    user.LastLogin = DateTime.Now;
                    IUser.SaveChanges();
                    currentUser = user;
                    txtPassword.Text = txtUsername.Text = "";
                    txtUsername.Focus();
                    loaded = false;
                    LoadingScreenHelper.EndScreen();
                    this.Hide();
                    WindowState = FormWindowState.Normal;
                    loaded = true;
                    //LoadingScreenHelper.StartLoadingScreen();
                    CompositionRoot.Resolve<PlatformForm>().Show();
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                LoadingScreenHelper.EndScreen();
                Activate();
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom prijave... Molimo pokušajte ponovo kasnije!");
            }
            Enabled = true;
        }
    }
}
