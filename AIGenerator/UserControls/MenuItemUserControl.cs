using AIGenerator.Common;
using AIGenerator.Forms;
using System;
using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;

namespace AIGenerator.UserControls
{
    public partial class MenuItemUserControl : UserControl
    {
        public string DisplayText { get => lblName.Text; set => lblName.Text = value; }

        [Category("Menu Items")]
        [DisplayName("Menu Item")]
        [Description("Select the type of this menu item.")]
        [DefaultValue(MenuItems.None)]
        public MenuItems MenuItemType { get; set; }

        public Bitmap DisplayIcon { get => (Bitmap)pnIcon.BackgroundImage; set => pnIcon.BackgroundImage = value; }
        public Bitmap DisplayActiveIcon { get; set; }
        public Bitmap DisplayInactiveIcon { get; set; }
        public Bitmap DisplayDarkModeIcon { get; set; }
        public event EventHandler ClickEvent;
        private bool isSelected = false;
        public bool IsSelected { 
            get
            {
                return isSelected;
            }
            set
            {
                isSelected = value;
                RedrawControl();
            } 
        }

        public MenuItemUserControl()
        {
            InitializeComponent();
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

        private void Control_Click(object sender, EventArgs e)
        {
            if (ClickEvent != null && !IsSelected) ClickEvent(sender, e);
        }

        public void RedrawControl()
        {
            DisplayIcon = isSelected ? DisplayActiveIcon : LoginForm.DarkMode ? DisplayDarkModeIcon : DisplayInactiveIcon;
            BackColor = isSelected ? CustomColor.MainColor20 : Color.Transparent;
            lblName.ForeColor = isSelected ? CustomColor.Green : CustomColor.Text2;
        }
    }
}
