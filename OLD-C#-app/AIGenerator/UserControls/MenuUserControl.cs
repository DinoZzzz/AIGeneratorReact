using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Forms;
using Interfaces;
using System;
using System.Collections.Generic;
using System.Deployment.Application;
using System.Drawing;
using System.Windows.Forms;

namespace AIGenerator.UserControls
{
    public partial class MenuUserControl : UserControl
    {
        public MenuItems SelectedItem = MenuItems.None;

        private List<MenuItemUserControl> userControls = new List<MenuItemUserControl>();

        public MenuUserControl()
        {
            InitializeComponent();
            userControls.AddRange(new List<MenuItemUserControl> { menuItemCustomer, menuItemExaminers, menuItemHelp, menuItemHistory, menuItemLogout, menuItemPlatform, menuItemSettings });
        }

        public void SetSelectedItem(MenuItems selectedItem)
        {
            SelectedItem = selectedItem;
            foreach (MenuItemUserControl menuItemUserControl in userControls)
            {
                if (menuItemUserControl.MenuItemType == SelectedItem)
                {
                    menuItemUserControl.IsSelected = true;
                    break;
                }
            }
            ChangeDisplay();
        }

        public bool IsDesignerHosted
        {
            get
            {
                Control ctrl = this;
                while (ctrl != null)
                {
                    if ((ctrl.Site != null) && ctrl.Site.DesignMode)
                        return true;
                    ctrl = ctrl.Parent;
                }
                return false;
            }
        }

        public void ChangeDisplay()
        {
            lblMenu.Visible = menuItemCustomer.Visible = menuItemExaminers.Visible = menuItemHistory.Visible = menuItemLogout.Visible = menuItemPlatform.Visible = menuItemSettings.Visible = LoginForm.currentUser != null;
        }

        private void MenuUserControl_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            ChangeDisplay();
            RedrawControl();
            lblBackToLogin.Visible = LoginForm.currentUser == null && !(Parent is LoginForm);
            lblBackToLogin.Location = new Point((Width - lblBackToLogin.Width) / 2, lblBackToLogin.Location.Y);
#if TEST            
            string prefix = "Beta ";
#else
            string prefix = "V ";
#endif

            lblVersion.Text = prefix + VersionClass.GetVersion();
        }

        private void Panel_Paint(object sender, PaintEventArgs e)
        {
            if (IsDesignerHosted) return;
            Panel p = sender as Panel;
            p.BackColor = CustomColor.Text3;
            ControlPaint.DrawBorder(e.Graphics, p.DisplayRectangle, CustomColor.Text3, ButtonBorderStyle.Inset);
        }

        private void menuItemPlatform_ClickEvent(object sender, EventArgs e)
        {
            ParentForm.Close();
            PlatformForm.platformForm.Show();
        }

        private void menuItemHistory_ClickEvent(object sender, EventArgs e)
        {
            CloseCurrentOpenNew(CompositionRoot.Resolve<HistoryForm>());
        }

        private void menuItemExaminers_ClickEvent(object sender, EventArgs e)
        {
            CloseCurrentOpenNew(CompositionRoot.Resolve<ExaminersForm>());
        }

        private void menuItemCustomer_ClickEvent(object sender, EventArgs e)
        {
            CloseCurrentOpenNew(CompositionRoot.Resolve<CustomersForm>());
        }

        private void menuItemSettings_ClickEvent(object sender, EventArgs e)
        {
            CloseCurrentOpenNew(CompositionRoot.Resolve<SettingsForm>());
        }

        private void menuItemHelp_ClickEvent(object sender, EventArgs e)
        {
            CloseCurrentOpenNew(CompositionRoot.Resolve<HelpForm>());
        }

        private void CloseCurrentOpenNew(Form form)
        {
            LoadingScreenHelper.StartLoadingScreen();
            if (ParentForm is PlatformForm)
            {
                PlatformForm.platformForm.loaded = false;
                PlatformForm.platformForm.Hide();
                PlatformForm.platformForm.WindowState = FormWindowState.Normal;
                PlatformForm.platformForm.loaded = true;
            }
            else if (ParentForm is LoginForm)
            {
                LoginForm.loginForm.loaded = false;
                LoginForm.loginForm.Hide();
                LoginForm.loginForm.WindowState = FormWindowState.Normal;
                LoginForm.loginForm.loaded = true;
            }
            else ParentForm.Close();
            form.Show();
        }

        private void menuItemLogout_ClickEvent(object sender, EventArgs e)
        {
            Form form = ParentForm;
            form.Close();
            if (form.Name != PlatformForm.platformForm.Name) PlatformForm.platformForm.Close();
            LoginForm.currentUser = null;
            LoginForm.loginForm.Show();
        }

        private void lblBackToLogin_Click(object sender, EventArgs e)
        {
            ParentForm.Close();
            LoginForm.loginForm.Show();
        }

        public void RedrawControl()
        {
            if (IsDesignerHosted) return;
            panel1.BackgroundImage = LoginForm.DarkMode ? Properties.Resources.logo_dark : Properties.Resources.logo;
            pnLine1.BackColor = pnLine2.BackColor = CustomColor.Text3;
            BackColor = LoginForm.DarkMode ? Color.FromArgb(0, 0, 0) : Color.White;
            lblTools.ForeColor = lblMenu.ForeColor = CustomColor.Text3;
            lblBackToLogin.ForeColor = CustomColor.MainColor;
            lblVersion.ForeColor = CustomColor.Text1;
            foreach (MenuItemUserControl menuItemUserControl in userControls)
            {
                menuItemUserControl.RedrawControl();
            }
        }
    }
}
