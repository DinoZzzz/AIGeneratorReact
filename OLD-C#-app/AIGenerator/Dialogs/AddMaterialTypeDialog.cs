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
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.Dialogs
{
    public partial class AddMaterialTypeDialog : Form
    {
        private readonly IMaterialType IMaterialType;
        private readonly IAppLog IAppLog;
        private readonly MaterialType materialType;
        private readonly bool isEdit = false;

        public AddMaterialTypeDialog(IMaterialType iMaterialType, MaterialType materialType, IAppLog iAppLog)
        {
            InitializeComponent();
            IMaterialType = iMaterialType;
            isEdit = materialType != null;
            if (materialType != null) this.materialType = materialType;
            else this.materialType = new MaterialType();
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
                    materialType.Name = txtType.Text;
                    if (isEdit)
                    {
                        MaterialType type = IMaterialType.GetById(materialType.Id);
                        type.Name = materialType.Name;
                    }
                    else IMaterialType.Add(materialType);
                    IMaterialType.SaveChanges();
                    DialogResult = DialogResult.OK;
                    Close();
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom dodavanja novog tipa materijala... Molimo pokušajte ponovo kasnije!");
            }
            Enabled = true;
        }

        private bool Check()
        {
            if (string.IsNullOrEmpty(txtType.Text))
            {
                MessageClass.ShowInfoBox("Unesite naziv novog tipa!");
                return false;
            }
            else if (IMaterialType.AnyName(txtType.Text, materialType.Id))
            {
                MessageClass.ShowInfoBox("Već postoji tip sa istim nazivom!");
                return false;
            }
            return true;
        }

        private void AddMaterialTypeDialog_Load(object sender, EventArgs e)
        {
            if (!IsDesignerHosted)
            {
                BackColor = CustomColor.PrimaryBackground;
                lblType.ForeColor = CustomColor.Text1;
                btnAdd.ForeColor = txtType.ForeColor = CustomColor.Text1;
                btnAdd.BackColor = txtType.BackColor = CustomColor.White10;
                btnAdd.Text = isEdit ? "Spremi" : "Dodaj";
                if (isEdit)
                {
                    txtType.Text = materialType.Name;
                }
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
