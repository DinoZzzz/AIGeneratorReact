using AIGenerator.Common;
using Interfaces;
using Models;
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Windows.Forms;

namespace AIGenerator.Forms
{
    public partial class HelpForm : BaseForm
    {
        private readonly string defaultDescriptionText = "Unesi pitanje ili opiši problem";
        private readonly IContact IContact;
        private readonly IEmailService IEmailService;

        public HelpForm(IContact contact, IEmailService iEmailService) : base()
        {
            IContact = contact;
            InitializeComponent();
            txtDescription.GotFocus += RemoveText;
            txtDescription.LostFocus += AddText;
            menuUserControl1.SetSelectedItem(MenuItems.Help);
            IEmailService = iEmailService;
        }

        private void HelpForm_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            BackColor = CustomColor.Background;
            txtDescription.BackColor = CustomColor.White10;
            lblSelect.ForeColor = CustomColor.Text2;
            lblTutorial.ForeColor = cbPlace.ForeColor = txtDescription.ForeColor = CustomColor.Text1;
            cbPlace.BackColor = CustomColor.White10;
            lblContact.ForeColor = CustomColor.Text1;
            lblSent.ForeColor = CustomColor.Text3;
            btnSend.ForeColor = CustomColor.MainColor;
            btnSend.BackColor = CustomColor.PrimaryBackground;
            cbPlace.SelectedIndex = -1;
            containerPanel.Size = pnBody.Size;
            LoadingScreenHelper.EndScreen();
        }

        public void RemoveText(object sender, EventArgs e)
        {
            TextBox textBox = sender as TextBox;
            if (textBox.Text == defaultDescriptionText)
            {
                textBox.Text = "";
            }
        }

        public void AddText(object sender, EventArgs e)
        {
            TextBox textBox = sender as TextBox;
            if (string.IsNullOrWhiteSpace(textBox.Text))
                textBox.Text = defaultDescriptionText;
        }

        private bool Check()
        {
            if (string.IsNullOrEmpty(txtDescription.Text))
            {
                MessageClass.ShowInfoBox("Molimo detaljno opišite vaš problem!");
                return false;
            }
            if (cbPlace.SelectedIndex < 0)
            {
                MessageClass.ShowInfoBox("Molimo odaberite dio aplikacije na kojoj nastaje problem ili dio na koji se odnosi pitanje!");
                return false;
            }
            return true;
        }

        private void Panel_Paint(object sender, PaintEventArgs e)
        {
            Panel p = sender as Panel;
            p.BackColor = CustomColor.PrimaryBackground;
            ControlPaint.DrawBorder(e.Graphics, p.DisplayRectangle, CustomColor.White10, ButtonBorderStyle.Solid);
        }

        private void HelpForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            FormHelper.CloseApp();
        }

        private void btnSend_Click(object sender, EventArgs e)
        {
            Enabled = false;
            if (Check())
            {
                LoadingScreenHelper.StartLoadingScreen("Slanje...");
                try
                {
                    Contact contact = new Contact
                    {
                        ApplicationPart = Convert.ToString(cbPlace.SelectedItem),
                        Description = txtDescription.Text,
                        Version = VersionClass.GetVersion()
                    };
                    IContact.Add(contact);
                    IContact.SaveChanges();
                    IEmailService.SendSupportEmail(LoginForm.currentUser, contact);
                    lblSent.Visible = true;
                    cbPlace.SelectedIndex = -1;
                    txtDescription.Text = "";
                    LoadingScreenHelper.EndScreen();
                }
                catch (Exception ex)
                {
                    ExceptionHelper.SaveLog(ex);
                    LoadingScreenHelper.EndScreen();
                    Activate();
                    MessageClass.ShowErrorBox("Došlo je do pogreške prilikom slanja... Molimo pokušajte ponovo kasnije!");
                }
            }
            Enabled = true;
        }

        private void HelpForm_Resize(object sender, EventArgs e)
        {
            if (WindowState == FormWindowState.Minimized) return;
            Size newSize = minimumSize;
            if (Size.Width >= minimumSize.Width) newSize.Width = Size.Width;
            if (Size.Height >= minimumSize.Height) newSize.Height = Size.Height;
            pnContact.Location = new Point(newSize.Width - pnContact.Width - rightMargin, pnTutorial.Location.Y);
            pnTutorial.Size = new Size(pnContact.Location.X - pnTutorial.Location.X - 20, newSize.Height - pnTutorial.Location.Y - bottomMargin);
            lblTutorialText.Size = new Size(pnTutorial.Size.Width - 2 * lblTutorialText.Location.X, pnTutorial.Size.Height - lblTutorialText.Location.Y - rightMargin);
        }
    }
}
