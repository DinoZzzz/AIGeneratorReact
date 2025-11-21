namespace AIGenerator.Forms
{
    partial class SettingsForm
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

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.cbDarkMode = new System.Windows.Forms.CheckBox();
            this.btnMaterialAdd = new System.Windows.Forms.Button();
            this.btnMaterialRemove = new System.Windows.Forms.Button();
            this.btnMaterialEdit = new System.Windows.Forms.Button();
            this.lblMaterial = new System.Windows.Forms.Label();
            this.lbMaterial = new System.Windows.Forms.ListBox();
            this.pnMaterial = new System.Windows.Forms.Panel();
            this.menuUserControl1 = new AIGenerator.UserControls.MenuUserControl();
            this.pnMaterial.SuspendLayout();
            this.SuspendLayout();
            // 
            // cbDarkMode
            // 
            this.cbDarkMode.AutoSize = true;
            this.cbDarkMode.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.cbDarkMode.Location = new System.Drawing.Point(340, 47);
            this.cbDarkMode.Name = "cbDarkMode";
            this.cbDarkMode.Size = new System.Drawing.Size(165, 26);
            this.cbDarkMode.TabIndex = 2;
            this.cbDarkMode.Text = "Uključi tamni način";
            this.cbDarkMode.UseVisualStyleBackColor = true;
            this.cbDarkMode.CheckedChanged += new System.EventHandler(this.cbDarkMode_CheckedChanged);
            // 
            // btnMaterialAdd
            // 
            this.btnMaterialAdd.Font = new System.Drawing.Font("Trebuchet MS", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnMaterialAdd.Location = new System.Drawing.Point(162, 5);
            this.btnMaterialAdd.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.btnMaterialAdd.Name = "btnMaterialAdd";
            this.btnMaterialAdd.Size = new System.Drawing.Size(120, 28);
            this.btnMaterialAdd.TabIndex = 12;
            this.btnMaterialAdd.Text = "Dodaj";
            this.btnMaterialAdd.UseVisualStyleBackColor = true;
            this.btnMaterialAdd.Click += new System.EventHandler(this.btnMaterialAdd_Click);
            // 
            // btnMaterialRemove
            // 
            this.btnMaterialRemove.Font = new System.Drawing.Font("Trebuchet MS", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnMaterialRemove.Location = new System.Drawing.Point(162, 342);
            this.btnMaterialRemove.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.btnMaterialRemove.Name = "btnMaterialRemove";
            this.btnMaterialRemove.Size = new System.Drawing.Size(120, 28);
            this.btnMaterialRemove.TabIndex = 11;
            this.btnMaterialRemove.Text = "Ukloni";
            this.btnMaterialRemove.UseVisualStyleBackColor = true;
            this.btnMaterialRemove.Visible = false;
            this.btnMaterialRemove.Click += new System.EventHandler(this.btnMaterialRemove_Click);
            // 
            // btnMaterialEdit
            // 
            this.btnMaterialEdit.Font = new System.Drawing.Font("Trebuchet MS", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnMaterialEdit.Location = new System.Drawing.Point(14, 342);
            this.btnMaterialEdit.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.btnMaterialEdit.Name = "btnMaterialEdit";
            this.btnMaterialEdit.Size = new System.Drawing.Size(120, 28);
            this.btnMaterialEdit.TabIndex = 10;
            this.btnMaterialEdit.Text = "Uredi";
            this.btnMaterialEdit.UseVisualStyleBackColor = true;
            this.btnMaterialEdit.Visible = false;
            this.btnMaterialEdit.Click += new System.EventHandler(this.btnMaterialEdit_Click);
            // 
            // lblMaterial
            // 
            this.lblMaterial.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblMaterial.Location = new System.Drawing.Point(14, 15);
            this.lblMaterial.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.lblMaterial.Name = "lblMaterial";
            this.lblMaterial.Size = new System.Drawing.Size(143, 21);
            this.lblMaterial.TabIndex = 9;
            this.lblMaterial.Text = "Materijali:";
            // 
            // lbMaterial
            // 
            this.lbMaterial.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lbMaterial.FormattingEnabled = true;
            this.lbMaterial.ItemHeight = 22;
            this.lbMaterial.Location = new System.Drawing.Point(14, 38);
            this.lbMaterial.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.lbMaterial.Name = "lbMaterial";
            this.lbMaterial.Size = new System.Drawing.Size(269, 268);
            this.lbMaterial.TabIndex = 8;
            this.lbMaterial.SelectedIndexChanged += new System.EventHandler(this.lbMaterial_SelectedIndexChanged);
            // 
            // pnMaterial
            // 
            this.pnMaterial.Controls.Add(this.btnMaterialAdd);
            this.pnMaterial.Controls.Add(this.btnMaterialRemove);
            this.pnMaterial.Controls.Add(this.btnMaterialEdit);
            this.pnMaterial.Controls.Add(this.lblMaterial);
            this.pnMaterial.Controls.Add(this.lbMaterial);
            this.pnMaterial.Location = new System.Drawing.Point(326, 83);
            this.pnMaterial.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.pnMaterial.Name = "pnMaterial";
            this.pnMaterial.Size = new System.Drawing.Size(628, 381);
            this.pnMaterial.TabIndex = 13;
            // 
            // menuUserControl1
            // 
            this.menuUserControl1.BackColor = System.Drawing.Color.White;
            this.menuUserControl1.Dock = System.Windows.Forms.DockStyle.Left;
            this.menuUserControl1.Location = new System.Drawing.Point(0, 0);
            this.menuUserControl1.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.menuUserControl1.Name = "menuUserControl1";
            this.menuUserControl1.Size = new System.Drawing.Size(256, 741);
            this.menuUserControl1.TabIndex = 1;
            // 
            // SettingsForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1424, 741);
            this.Controls.Add(this.pnMaterial);
            this.Controls.Add(this.cbDarkMode);
            this.Controls.Add(this.menuUserControl1);
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.Name = "SettingsForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.Manual;
            this.Text = "AIGenerator";
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.SettingsForm_FormClosed);
            this.Load += new System.EventHandler(this.SettingsForm_Load);
            this.pnMaterial.ResumeLayout(false);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private UserControls.MenuUserControl menuUserControl1;
        private System.Windows.Forms.CheckBox cbDarkMode;
        private System.Windows.Forms.Button btnMaterialAdd;
        private System.Windows.Forms.Button btnMaterialRemove;
        private System.Windows.Forms.Button btnMaterialEdit;
        private System.Windows.Forms.Label lblMaterial;
        private System.Windows.Forms.ListBox lbMaterial;
        private System.Windows.Forms.Panel pnMaterial;
    }
}