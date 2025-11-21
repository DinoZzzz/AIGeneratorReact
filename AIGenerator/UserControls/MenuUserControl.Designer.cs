namespace AIGenerator.UserControls
{
    partial class MenuUserControl
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary> 
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Component Designer generated code

        /// <summary> 
        /// Required method for Designer support - do not modify 
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(MenuUserControl));
            this.pnLine1 = new System.Windows.Forms.Panel();
            this.pnLine2 = new System.Windows.Forms.Panel();
            this.lblTools = new System.Windows.Forms.Label();
            this.lblVersion = new System.Windows.Forms.Label();
            this.lblMenu = new System.Windows.Forms.Label();
            this.lblBackToLogin = new System.Windows.Forms.Label();
            this.panel1 = new System.Windows.Forms.Panel();
            this.menuItemLogout = new AIGenerator.UserControls.MenuItemUserControl();
            this.menuItemHelp = new AIGenerator.UserControls.MenuItemUserControl();
            this.menuItemSettings = new AIGenerator.UserControls.MenuItemUserControl();
            this.menuItemCustomer = new AIGenerator.UserControls.MenuItemUserControl();
            this.menuItemExaminers = new AIGenerator.UserControls.MenuItemUserControl();
            this.menuItemHistory = new AIGenerator.UserControls.MenuItemUserControl();
            this.menuItemPlatform = new AIGenerator.UserControls.MenuItemUserControl();
            this.SuspendLayout();
            // 
            // pnLine1
            // 
            this.pnLine1.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnLine1.Location = new System.Drawing.Point(26, 81);
            this.pnLine1.Margin = new System.Windows.Forms.Padding(2);
            this.pnLine1.Name = "pnLine1";
            this.pnLine1.Size = new System.Drawing.Size(205, 1);
            this.pnLine1.TabIndex = 1;
            this.pnLine1.Paint += new System.Windows.Forms.PaintEventHandler(this.Panel_Paint);
            // 
            // pnLine2
            // 
            this.pnLine2.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnLine2.Location = new System.Drawing.Point(26, 364);
            this.pnLine2.Margin = new System.Windows.Forms.Padding(2);
            this.pnLine2.Name = "pnLine2";
            this.pnLine2.Size = new System.Drawing.Size(205, 1);
            this.pnLine2.TabIndex = 2;
            this.pnLine2.Paint += new System.Windows.Forms.PaintEventHandler(this.Panel_Paint);
            // 
            // lblTools
            // 
            this.lblTools.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblTools.Location = new System.Drawing.Point(30, 389);
            this.lblTools.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.lblTools.Name = "lblTools";
            this.lblTools.Size = new System.Drawing.Size(164, 33);
            this.lblTools.TabIndex = 3;
            this.lblTools.Text = "Alati";
            this.lblTools.UseCompatibleTextRendering = true;
            // 
            // lblVersion
            // 
            this.lblVersion.Font = new System.Drawing.Font("Trebuchet MS", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblVersion.Location = new System.Drawing.Point(0, 84);
            this.lblVersion.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.lblVersion.Name = "lblVersion";
            this.lblVersion.Padding = new System.Windows.Forms.Padding(8, 0, 0, 0);
            this.lblVersion.Size = new System.Drawing.Size(258, 20);
            this.lblVersion.TabIndex = 4;
            this.lblVersion.Text = "V 1.0";
            this.lblVersion.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this.lblVersion.UseCompatibleTextRendering = true;
            // 
            // lblMenu
            // 
            this.lblMenu.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblMenu.Location = new System.Drawing.Point(30, 117);
            this.lblMenu.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.lblMenu.Name = "lblMenu";
            this.lblMenu.Size = new System.Drawing.Size(164, 33);
            this.lblMenu.TabIndex = 12;
            this.lblMenu.Text = "Meni";
            this.lblMenu.UseCompatibleTextRendering = true;
            // 
            // lblBackToLogin
            // 
            this.lblBackToLogin.AutoSize = true;
            this.lblBackToLogin.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblBackToLogin.Location = new System.Drawing.Point(46, 117);
            this.lblBackToLogin.Name = "lblBackToLogin";
            this.lblBackToLogin.Padding = new System.Windows.Forms.Padding(5);
            this.lblBackToLogin.Size = new System.Drawing.Size(163, 34);
            this.lblBackToLogin.TabIndex = 13;
            this.lblBackToLogin.Text = "Nazad na prijavu";
            this.lblBackToLogin.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this.lblBackToLogin.Visible = false;
            this.lblBackToLogin.Click += new System.EventHandler(this.lblBackToLogin_Click);
            // 
            // panel1
            // 
            this.panel1.BackgroundImage = ((System.Drawing.Image)(resources.GetObject("panel1.BackgroundImage")));
            this.panel1.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Zoom;
            this.panel1.Location = new System.Drawing.Point(23, 29);
            this.panel1.Margin = new System.Windows.Forms.Padding(2);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(203, 44);
            this.panel1.TabIndex = 0;
            // 
            // menuItemLogout
            // 
            this.menuItemLogout.BackColor = System.Drawing.Color.Transparent;
            this.menuItemLogout.DisplayActiveIcon = global::AIGenerator.Properties.Resources.logout;
            this.menuItemLogout.DisplayDarkModeIcon = global::AIGenerator.Properties.Resources.logout_dark;
            this.menuItemLogout.DisplayIcon = global::AIGenerator.Properties.Resources.logout;
            this.menuItemLogout.DisplayInactiveIcon = global::AIGenerator.Properties.Resources.logout;
            this.menuItemLogout.DisplayText = "Odjava";
            this.menuItemLogout.IsSelected = false;
            this.menuItemLogout.Location = new System.Drawing.Point(0, 529);
            this.menuItemLogout.Margin = new System.Windows.Forms.Padding(2);
            this.menuItemLogout.MenuItemType = AIGenerator.Common.MenuItems.Logout;
            this.menuItemLogout.Name = "menuItemLogout";
            this.menuItemLogout.Size = new System.Drawing.Size(213, 36);
            this.menuItemLogout.TabIndex = 11;
            this.menuItemLogout.ClickEvent += new System.EventHandler(this.menuItemLogout_ClickEvent);
            // 
            // menuItemHelp
            // 
            this.menuItemHelp.BackColor = System.Drawing.Color.Transparent;
            this.menuItemHelp.DisplayActiveIcon = global::AIGenerator.Properties.Resources.help_active;
            this.menuItemHelp.DisplayDarkModeIcon = global::AIGenerator.Properties.Resources.help_dark;
            this.menuItemHelp.DisplayIcon = global::AIGenerator.Properties.Resources.help;
            this.menuItemHelp.DisplayInactiveIcon = global::AIGenerator.Properties.Resources.help;
            this.menuItemHelp.DisplayText = "Pomoć";
            this.menuItemHelp.IsSelected = false;
            this.menuItemHelp.Location = new System.Drawing.Point(0, 425);
            this.menuItemHelp.Margin = new System.Windows.Forms.Padding(2);
            this.menuItemHelp.MenuItemType = AIGenerator.Common.MenuItems.Help;
            this.menuItemHelp.Name = "menuItemHelp";
            this.menuItemHelp.Size = new System.Drawing.Size(213, 36);
            this.menuItemHelp.TabIndex = 10;
            this.menuItemHelp.ClickEvent += new System.EventHandler(this.menuItemHelp_ClickEvent);
            // 
            // menuItemSettings
            // 
            this.menuItemSettings.BackColor = System.Drawing.Color.Transparent;
            this.menuItemSettings.DisplayActiveIcon = global::AIGenerator.Properties.Resources.settings_active;
            this.menuItemSettings.DisplayDarkModeIcon = global::AIGenerator.Properties.Resources.settings_dark;
            this.menuItemSettings.DisplayIcon = global::AIGenerator.Properties.Resources.settings;
            this.menuItemSettings.DisplayInactiveIcon = global::AIGenerator.Properties.Resources.settings;
            this.menuItemSettings.DisplayText = "Postavke";
            this.menuItemSettings.IsSelected = false;
            this.menuItemSettings.Location = new System.Drawing.Point(0, 477);
            this.menuItemSettings.Margin = new System.Windows.Forms.Padding(2);
            this.menuItemSettings.MenuItemType = AIGenerator.Common.MenuItems.Settings;
            this.menuItemSettings.Name = "menuItemSettings";
            this.menuItemSettings.Size = new System.Drawing.Size(213, 36);
            this.menuItemSettings.TabIndex = 9;
            this.menuItemSettings.ClickEvent += new System.EventHandler(this.menuItemSettings_ClickEvent);
            // 
            // menuItemCustomer
            // 
            this.menuItemCustomer.BackColor = System.Drawing.Color.Transparent;
            this.menuItemCustomer.DisplayActiveIcon = global::AIGenerator.Properties.Resources.customers_active;
            this.menuItemCustomer.DisplayDarkModeIcon = global::AIGenerator.Properties.Resources.customers_dark;
            this.menuItemCustomer.DisplayIcon = global::AIGenerator.Properties.Resources.customers;
            this.menuItemCustomer.DisplayInactiveIcon = global::AIGenerator.Properties.Resources.customers;
            this.menuItemCustomer.DisplayText = "Naručitelji";
            this.menuItemCustomer.IsSelected = false;
            this.menuItemCustomer.Location = new System.Drawing.Point(0, 309);
            this.menuItemCustomer.Margin = new System.Windows.Forms.Padding(2);
            this.menuItemCustomer.MenuItemType = AIGenerator.Common.MenuItems.Customers;
            this.menuItemCustomer.Name = "menuItemCustomer";
            this.menuItemCustomer.Size = new System.Drawing.Size(213, 36);
            this.menuItemCustomer.TabIndex = 8;
            this.menuItemCustomer.ClickEvent += new System.EventHandler(this.menuItemCustomer_ClickEvent);
            // 
            // menuItemExaminers
            // 
            this.menuItemExaminers.BackColor = System.Drawing.Color.Transparent;
            this.menuItemExaminers.DisplayActiveIcon = global::AIGenerator.Properties.Resources.examiners_active;
            this.menuItemExaminers.DisplayDarkModeIcon = global::AIGenerator.Properties.Resources.examiners_dark;
            this.menuItemExaminers.DisplayIcon = global::AIGenerator.Properties.Resources.examiners;
            this.menuItemExaminers.DisplayInactiveIcon = global::AIGenerator.Properties.Resources.examiners;
            this.menuItemExaminers.DisplayText = "Ispitivači";
            this.menuItemExaminers.IsSelected = false;
            this.menuItemExaminers.Location = new System.Drawing.Point(0, 257);
            this.menuItemExaminers.Margin = new System.Windows.Forms.Padding(2);
            this.menuItemExaminers.MenuItemType = AIGenerator.Common.MenuItems.Examiners;
            this.menuItemExaminers.Name = "menuItemExaminers";
            this.menuItemExaminers.Size = new System.Drawing.Size(213, 36);
            this.menuItemExaminers.TabIndex = 7;
            this.menuItemExaminers.ClickEvent += new System.EventHandler(this.menuItemExaminers_ClickEvent);
            // 
            // menuItemHistory
            // 
            this.menuItemHistory.BackColor = System.Drawing.Color.Transparent;
            this.menuItemHistory.DisplayActiveIcon = global::AIGenerator.Properties.Resources.history_active;
            this.menuItemHistory.DisplayDarkModeIcon = global::AIGenerator.Properties.Resources.history_dark;
            this.menuItemHistory.DisplayIcon = global::AIGenerator.Properties.Resources.history;
            this.menuItemHistory.DisplayInactiveIcon = global::AIGenerator.Properties.Resources.history;
            this.menuItemHistory.DisplayText = "Povijest";
            this.menuItemHistory.IsSelected = false;
            this.menuItemHistory.Location = new System.Drawing.Point(0, 205);
            this.menuItemHistory.Margin = new System.Windows.Forms.Padding(2);
            this.menuItemHistory.MenuItemType = AIGenerator.Common.MenuItems.History;
            this.menuItemHistory.Name = "menuItemHistory";
            this.menuItemHistory.Size = new System.Drawing.Size(213, 36);
            this.menuItemHistory.TabIndex = 6;
            this.menuItemHistory.ClickEvent += new System.EventHandler(this.menuItemHistory_ClickEvent);
            // 
            // menuItemPlatform
            // 
            this.menuItemPlatform.BackColor = System.Drawing.Color.Transparent;
            this.menuItemPlatform.DisplayActiveIcon = global::AIGenerator.Properties.Resources.platform_selected;
            this.menuItemPlatform.DisplayDarkModeIcon = global::AIGenerator.Properties.Resources.platform_dark;
            this.menuItemPlatform.DisplayIcon = global::AIGenerator.Properties.Resources.platform;
            this.menuItemPlatform.DisplayInactiveIcon = global::AIGenerator.Properties.Resources.platform;
            this.menuItemPlatform.DisplayText = "Platforma";
            this.menuItemPlatform.IsSelected = false;
            this.menuItemPlatform.Location = new System.Drawing.Point(0, 153);
            this.menuItemPlatform.Margin = new System.Windows.Forms.Padding(2);
            this.menuItemPlatform.MenuItemType = AIGenerator.Common.MenuItems.Platform;
            this.menuItemPlatform.Name = "menuItemPlatform";
            this.menuItemPlatform.Size = new System.Drawing.Size(213, 36);
            this.menuItemPlatform.TabIndex = 5;
            this.menuItemPlatform.ClickEvent += new System.EventHandler(this.menuItemPlatform_ClickEvent);
            // 
            // MenuUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.White;
            this.Controls.Add(this.menuItemLogout);
            this.Controls.Add(this.menuItemHelp);
            this.Controls.Add(this.menuItemSettings);
            this.Controls.Add(this.menuItemCustomer);
            this.Controls.Add(this.menuItemExaminers);
            this.Controls.Add(this.menuItemHistory);
            this.Controls.Add(this.menuItemPlatform);
            this.Controls.Add(this.lblVersion);
            this.Controls.Add(this.lblTools);
            this.Controls.Add(this.pnLine2);
            this.Controls.Add(this.pnLine1);
            this.Controls.Add(this.panel1);
            this.Controls.Add(this.lblBackToLogin);
            this.Controls.Add(this.lblMenu);
            this.Margin = new System.Windows.Forms.Padding(2);
            this.Name = "MenuUserControl";
            this.Size = new System.Drawing.Size(256, 710);
            this.Load += new System.EventHandler(this.MenuUserControl_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Panel panel1;
        private System.Windows.Forms.Panel pnLine1;
        private System.Windows.Forms.Panel pnLine2;
        private System.Windows.Forms.Label lblTools;
        private System.Windows.Forms.Label lblVersion;
        private MenuItemUserControl menuItemPlatform;
        private MenuItemUserControl menuItemHistory;
        private MenuItemUserControl menuItemExaminers;
        private MenuItemUserControl menuItemCustomer;
        private MenuItemUserControl menuItemSettings;
        private MenuItemUserControl menuItemHelp;
        private MenuItemUserControl menuItemLogout;
        private System.Windows.Forms.Label lblMenu;
        private System.Windows.Forms.Label lblBackToLogin;
    }
}
