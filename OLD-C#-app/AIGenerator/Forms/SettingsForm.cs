using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Dialogs;
using Interfaces;
using Models;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.Forms
{
    public partial class SettingsForm : BaseForm
    {
        private readonly IUser IUser;
        private readonly IMaterial IMaterial;
        private readonly IReportForm IReportForm;
        private readonly ISetting ISetting;
        private bool start = true;

        public SettingsForm(IUser iUser, IMaterial material, IReportForm iReportForm, ISetting iSetting) : base()
        {
            InitializeComponent();
            menuUserControl1.SetSelectedItem(MenuItems.Settings);
            IUser = iUser;
            IMaterial = material;
            IReportForm = iReportForm;
            ISetting = iSetting;
        }

        private void SettingsForm_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            RedrawForm();
            pnMaterial.Visible = LoginForm.currentUser.IsAdmin;
            cbDarkMode.Checked = LoginForm.currentUser.IsDarkMode;
            containerPanel.Size = pnBody.Size;
            LoadMaterials();
            start = false;
            LoadingScreenHelper.EndScreen();
        }

        private void LoadMaterials()
        {
            try
            {
                lbMaterial.Items.Clear();
                foreach (Material material in IMaterial.GetAll())
                {
                    lbMaterial.Items.Add(material);
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                lbMaterial.Items.Clear();
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja materijala... Molimo pokušajte ponovo kasnije!");
            }
        }

        private void SettingsForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            FormHelper.CloseApp();
        }

        private void cbDarkMode_CheckedChanged(object sender, EventArgs e)
        {
            if (start) return;
            try
            {
                Setting setting = ISetting.Get();
                LoginForm.DarkMode = setting.DarkMode = LoginForm.currentUser.IsDarkMode = cbDarkMode.Checked;
                ISetting.SaveData(setting);
                User user = IUser.GetById(LoginForm.currentUser.Id);
                user.IsDarkMode = cbDarkMode.Checked;
                IUser.SaveChanges();
                RedrawForm();
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom promjene prikaza... Molimo pokušajte ponovo kasnije!");
            }
        }

        private void RedrawForm()
        {
            pnBody.BackColor = BackColor = CustomColor.Background;
            cbDarkMode.ForeColor = CustomColor.Text2;
            btnMaterialAdd.BackColor = btnMaterialEdit.BackColor = btnMaterialRemove.BackColor = CustomColor.PrimaryBackground;
            btnMaterialAdd.ForeColor = btnMaterialEdit.ForeColor = btnMaterialRemove.ForeColor = CustomColor.Text1;
            lbMaterial.ForeColor = CustomColor.Text1;
            lblMaterial.ForeColor = CustomColor.Text2;
            lbMaterial.BackColor = CustomColor.PrimaryBackground;
            lblMaterial.ForeColor = lbMaterial.ForeColor = lbMaterial.ForeColor = CustomColor.Text1;
            menuUserControl1.RedrawControl();
        }

        private void lbMaterial_SelectedIndexChanged(object sender, EventArgs e)
        {
            btnMaterialEdit.Visible = btnMaterialRemove.Visible = lbMaterial.SelectedIndex != -1;
        }

        private void btnMaterialEdit_Click(object sender, EventArgs e)
        {
            if (lbMaterial.SelectedIndex == -1) return;
            if (CompositionRoot.Resolve<AddMaterialDialog>("material", lbMaterial.SelectedItem as Material).ShowDialog() == DialogResult.OK)
            {
                LoadMaterials();
            }
        }

        private void btnMaterialRemove_Click(object sender, EventArgs e)
        {
            if (lbMaterial.SelectedIndex == -1) return;
            int id = (lbMaterial.SelectedItem as Material).Id;
            Enabled = false;
            if (IReportForm.AnyMaterial(id))
            {
                MessageClass.ShowInfoBox("Nije moguće ukloniti ovaj materijal, jer je odabran kod nekih obrazaca!");
            }
            else if (MessageClass.ShowQuestionBox("Jeste li sigurni da želite ukloniti ovaj materijal?") == DialogResult.Yes)
            {
                try
                {
                    IMaterial.Remove(id);
                    IMaterial.SaveChanges();
                    lbMaterial.Items.RemoveAt(lbMaterial.SelectedIndex);
                }
                catch (Exception ex)
                {
                    ExceptionHelper.SaveLog(ex);
                    MessageClass.ShowErrorBox("Došlo je do pogreške prilikom uklanjanja materijala... Molimo pokušajte ponovo kasnije!");
                }
            }
            Enabled = true;
        }

        private void btnMaterialAdd_Click(object sender, EventArgs e)
        {
            if (CompositionRoot.Resolve<AddMaterialDialog>("material", null).ShowDialog() == DialogResult.OK)
            {
                LoadMaterials();
            }
        }
    }
}
