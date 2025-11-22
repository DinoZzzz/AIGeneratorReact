using AIGenerator.Common;
using AIGenerator.Forms;
using Common;
using Interfaces;
using Models;
using Models.Common;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Windows.Forms;

namespace AIGenerator.Dialogs
{
    public partial class AddExaminerDialog : Form
    {
        private readonly IUser IUser;
        private readonly IUserReportAccreditation IUserReportAccreditation;
        private readonly IReportType IReportType;
        private readonly bool IsEdit;
        private readonly User user;

        public AddExaminerDialog(IUser iUser, IUserReportAccreditation userReportAccreditation, IReportType reportType, User user)
        {
            IUser = iUser;
            IUserReportAccreditation = userReportAccreditation;
            IReportType = reportType;
            IsEdit = user != null;
            if (user == null) this.user = new User();
            else this.user = user;
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

        private void AddExaminerDialog_Load(object sender, EventArgs e)
        {
            if (!IsDesignerHosted)
            {
                lblAddExaminer.Text = IsEdit ? "Uređivanje ispitivača" : "Dodavanje ispitivača";
                BackColor = CustomColor.PrimaryBackground;
                clbAccreditations.ForeColor = lblTitle.ForeColor = lblPassword.ForeColor = lblAccreditations.ForeColor = lblLastName.ForeColor = lblName.ForeColor = lblUsername.ForeColor = CustomColor.Text2;
                clbAccreditations.BackColor = CustomColor.White10;
                lblAddExaminer.ForeColor = CustomColor.MainColor;
                btnSave.ForeColor = CustomColor.MainColor;
                btnSave.BackColor = CustomColor.PrimaryBackground;
                txtTitle.BackColor = txtPassword.BackColor = txtUsername.BackColor = txtLastName.BackColor = txtName.BackColor = txtUsername.BackColor = CustomColor.White10;
                txtTitle.ForeColor = txtPassword.ForeColor = cbAdmin.ForeColor = txtUsername.ForeColor = txtLastName.ForeColor = txtName.ForeColor = txtUsername.ForeColor = CustomColor.Text1;
                int i = 0;
                foreach (ReportType reportType in IReportType.GetAll())
                {
                    clbAccreditations.Items.Add(reportType);
                    clbAccreditations.SetItemChecked(i, IUserReportAccreditation.Any(reportType.Id, user.Id));
                    i++;
                }
                if (IsEdit)
                {
                    txtLastName.Text = user.LastName;
                    txtName.Text = user.Name;
                    txtUsername.Text = user.Username;
                    txtTitle.Text = user.Title;
                    cbAdmin.Checked = user.IsAdmin;
                    txtPassword.Text = SafeClass.DecryptData(user.Password);
                }
                if (user.Id == AppData.AdminId || user.Id == AppData.DebugId) cbAdmin.Enabled = clbAccreditations.Enabled = false;
            }
        }

        private bool Check()
        {
            if (string.IsNullOrEmpty(txtName.Text))
            {
                MessageClass.ShowInfoBox("Molimo unesite ime ispitivača!");
                return false;
            }
            if (string.IsNullOrEmpty(txtLastName.Text))
            {
                MessageClass.ShowInfoBox("Molimo unesite prezime ispitivača!");
                return false;
            }
            if (string.IsNullOrEmpty(txtUsername.Text))
            {
                MessageClass.ShowInfoBox("Molimo unesite korisničko ime ispitivača!");
                return false;
            }
            if(IUser.AnyUsername(txtUsername.Text, user.Id))
            {
                MessageClass.ShowInfoBox("Korisničko ime se već koristi, molimo odaberite neko drugo!");
                return false;
            }
            if (!IsEdit && string.IsNullOrEmpty(txtPassword.Text))
            {
                MessageClass.ShowInfoBox("Molimo unesite lozinku ispitivača!");
                return false;
            }
            if(clbAccreditations.CheckedItems.Count == 0)
            {
                MessageClass.ShowInfoBox("Molimo odaberite barem jednu osposobljenost za ispitivača!");
                return false;
            }
            return true;
        }

        private void TextBox_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter)
            {
                e.Handled = true;
                btnSave_Click(btnSave, e);
            }
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            Enabled = false;
            try
            {
                if (Check())
                {
                    user.Name = txtName.Text;
                    user.Username = txtUsername.Text;
                    user.LastName = txtLastName.Text;
                    user.Title = txtTitle.Text;
                    user.IsAdmin = cbAdmin.Checked;
                    user.Password = SafeClass.EncryptData(txtPassword.Text);
                    if (IsEdit)
                    {
                        User oldUser = IUser.GetById(user.Id);
                        oldUser.Name = user.Name;
                        oldUser.LastName = user.LastName;
                        oldUser.IsAdmin = user.IsAdmin;
                        oldUser.Title = user.Title;
                        oldUser.Username = user.Username;
                        oldUser.Password = user.Password;
                        oldUser.UpdateTime = DateTime.Now;
                    }
                    else
                    {
                        user.CreationTime = user.UpdateTime = DateTime.Now;
                        IUser.Add(user);
                    }
                    List<ReportType> reportTypes = new List<ReportType>();
                    foreach (var item in clbAccreditations.CheckedItems)
                    {
                        reportTypes.Add(item as ReportType);
                    }
                    IUserReportAccreditation.Update(reportTypes, user.Id);
                    IUserReportAccreditation.SaveChanges();
                    IUser.SaveChanges();
                    DialogResult = DialogResult.OK;
                    Close();
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom dodavanja novog ispitivača... Molimo pokušajte ponovo kasnije!");
            }
            Enabled = true;
        }
    }
}
