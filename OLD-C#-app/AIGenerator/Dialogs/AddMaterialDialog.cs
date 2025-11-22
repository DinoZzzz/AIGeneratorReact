using AIGenerator.Common;
using AIGenerator.Forms;
using Interfaces;
using Models;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.Dialogs
{
    public partial class AddMaterialDialog : Form
    {
        private readonly IMaterial IMaterial;
        private readonly IMaterialType IMaterialType;
        private readonly IAppLog IAppLog;
        private readonly Material material;
        private readonly bool isEdit = false;

        public AddMaterialDialog(IMaterial iMaterial, IMaterialType materialType, Material material, IAppLog iAppLog)
        {
            InitializeComponent();
            isEdit = material != null;
            this.material = material ?? new Material();
            IMaterial = iMaterial;
            IMaterialType = materialType;
            IAppLog = iAppLog;
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

        private void btnAdd_Click(object sender, EventArgs e)
        {
            Enabled = false;
            try
            {
                if (Check())
                {
                    material.TypeId = (lbMaterialTypes.SelectedItem as MaterialType).Id;
                    material.Name = txtName.Text;
                    if (isEdit)
                    {
                        Material oldMaterial = IMaterial.GetById(material.Id);
                        oldMaterial.Name = material.Name;
                        oldMaterial.TypeId = material.TypeId;
                    }
                    else IMaterial.Add(material);
                    IMaterial.SaveChanges();
                    DialogResult = DialogResult.OK;
                    Close();
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom dodavanja novog materijala... Molimo pokušajte ponovo kasnije!");
            }
            Enabled = true;
        }

        private bool Check()
        {
            if (lbMaterialTypes.SelectedIndex == -1)
            {
                MessageClass.ShowInfoBox("Odaberite tip materijala!");
                return false;
            }
            else if (string.IsNullOrEmpty(txtName.Text))
            {
                MessageClass.ShowInfoBox("Unesite naziv novog materijala!");
                return false;
            }
            material.TypeId = (lbMaterialTypes.SelectedItem as MaterialType).Id;
            if (IMaterial.Any(material))
            {
                MessageClass.ShowInfoBox("Već postoji materijal sa istim nazivom i tipom!");
                return false;
            }
            return true;
        }

        private void AddMaterialDialog_Load(object sender, EventArgs e)
        {
            if (!IsDesignerHosted)
            {
                BackColor = CustomColor.PrimaryBackground;
                lblType.ForeColor = lblName.ForeColor = CustomColor.Text1;
                btnAdd.ForeColor = lbMaterialTypes.ForeColor = txtName.ForeColor = CustomColor.Text1;
                btnAdd.BackColor = lbMaterialTypes.BackColor = txtName.BackColor = CustomColor.White10;
                btnAdd.Text = isEdit ? "Spremi" : "Dodaj";
                foreach (MaterialType materialType in IMaterialType.GetAll())
                {
                    lbMaterialTypes.Items.Add(materialType);
                    if (materialType.Id == material.TypeId) lbMaterialTypes.SelectedItem = materialType;
                }
                txtName.Text = material.Name;
            }
        }

        private void TextBox_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter)
            {
                e.Handled = true;
                btnAdd_Click(btnAdd, e);
            }
        }
    }
}
