using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.UserControls;
using Interfaces;
using Models;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.Forms
{
    public partial class BaseForm : Form
    {
        public readonly Size minimumSize = new Size(1435, 680);
        public readonly int rightMargin = 28;
        public readonly int bottomMargin = 51;
        private SizeF scaleFactor = new SizeF(1, 1);

        public Panel pnBody;
        public Panel containerPanel;
        private ISetting _setting;
        private ISetting ISetting
        {
            get
            {
                if(_setting == null)
                {
                    _setting = CompositionRoot.Resolve<ISetting>();
                }
                return _setting;
            }
        }
        public bool loaded = false;

        public BaseForm()
        {
            InitializeComponent();
        }

        public bool IsDesignerHosted
        {
            get
            {
                Control control = this;
                while (control != null)
                {
                    if ((control.Site != null) && control.Site.DesignMode)
                        return true;
                    control = control.Parent;
                }
                return false;
            }
        }

        /// <summary>
        /// Overrides the create params function to create a cleaner resizing
        /// </summary>
        protected override CreateParams CreateParams
        {
            get
            {
                CreateParams cp = base.CreateParams;
                cp.ExStyle |= 0x02000000;
                return cp;
            }
        }

        private void Form_LocationChanged(object sender, EventArgs e)
        {
            if (WindowState != FormWindowState.Normal || !loaded) return;
            Setting setting = ISetting.Get();
            setting.LocationX = DesktopLocation.X;
            setting.LocationY = DesktopLocation.Y;
            ISetting.SaveData(setting);
        }

        private void Form_SizeChanged(object sender, EventArgs e)
        {
            if (WindowState != FormWindowState.Normal || !loaded) return;
            Setting setting = ISetting.Get();
            setting.Width = Width;
            setting.Height = Height;
            ISetting.SaveData(setting);
        }

        private void Form_Resize(object sender, EventArgs e)
        {
            if (WindowState == FormWindowState.Minimized || !loaded) return;
            Setting setting = ISetting.Get();
            bool max = setting.Maximized;
            setting.Maximized = WindowState == FormWindowState.Maximized;
            if (max != setting.Maximized)
            {
                Width = setting.Width;
                Height = setting.Height;
                SetDesktopLocation(setting.LocationX, setting.LocationY);
                ISetting.SaveData(setting);
            }
            containerPanel.Size = pnBody.Size;
        }

        private void BaseForm_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            BackColor = CustomColor.Background;
            Size = minimumSize;
            MinimumSize = new Size(800, 600);
            pnBody = new Panel()
            {
                Name = "pnBody",
                Dock = DockStyle.Fill,
                AutoScroll = true,
                BackColor = CustomColor.Background,
                AutoScrollMinSize = minimumSize,
            };
            Controls.Add(pnBody);
            containerPanel = new Panel()
            {
                Name = "pnFill",
                Visible = true,
                BackColor = Color.Transparent,
                Location = new Point(0, 0),
                Size = Size,
                MinimumSize = minimumSize,
            };
            pnBody.Controls.Add(containerPanel);
            AddControlsFromDerivedForm();
            pnBody.Scale(scaleFactor);
            LoadDefaultSettings();
        }

        public void LoadDefaultSettings()
        {
            loaded = true;
            Resize += Form_Resize;
            SizeChanged += Form_SizeChanged;
            LocationChanged += Form_LocationChanged;
            StartPosition = FormStartPosition.Manual;
            AutoScaleMode = AutoScaleMode.Dpi;
            containerPanel.Size = pnBody.Size;
            ReloadForm();
        }

        public void AddControlsFromDerivedForm()
        {
            List<Control> list = new List<Control>();
            foreach (Control control in Controls) list.Add(control);
            foreach (Control control in list)
            {
                if (control.Name != containerPanel.Name && control.Name != pnBody.Name) control.Parent = containerPanel;
                if (control is MenuUserControl) control.BringToFront();
            }
            containerPanel.SendToBack();
        }

        public void ReloadForm()
        {
            if (IsDesignerHosted) return;
            loaded = false;
            Setting setting = ISetting.Get();
            Size = new Size(setting.Width, setting.Width);
            Width = setting.Width;
            Height = setting.Height;
            WindowState = FormWindowState.Normal;
            SetDesktopLocation(setting.LocationX, setting.LocationY);
            if (setting.Maximized) WindowState = FormWindowState.Maximized;
            //{
            //    Screen screen = GetCorrespondingScreen(setting);
            //    SetDesktopLocation(screen.WorkingArea.Location.X, screen.WorkingArea.Location.Y);
                
            //}
            //else ;
            loaded = true;
        }

        private Screen GetCorrespondingScreen(Setting setting)
        {
            foreach (Screen screen in Screen.AllScreens)
            {
                if (screen.WorkingArea.IntersectsWith(new Rectangle(setting.LocationX + setting.Width / 2, setting.LocationY + setting.Height / 2, 1, 1))) return screen;
            }
            return Screen.AllScreens[0];
        }
    }
}
