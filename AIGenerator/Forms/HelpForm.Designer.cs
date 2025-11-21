namespace AIGenerator.Forms
{
    partial class HelpForm
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
            this.menuUserControl1 = new AIGenerator.UserControls.MenuUserControl();
            this.pnContact = new System.Windows.Forms.Panel();
            this.lblSelect = new System.Windows.Forms.Label();
            this.btnSend = new System.Windows.Forms.Button();
            this.lblSent = new System.Windows.Forms.Label();
            this.lblContact = new System.Windows.Forms.Label();
            this.cbPlace = new System.Windows.Forms.ComboBox();
            this.txtDescription = new System.Windows.Forms.TextBox();
            this.pnTutorial = new System.Windows.Forms.Panel();
            this.lblTutorialText = new System.Windows.Forms.Label();
            this.lblTutorial = new System.Windows.Forms.Label();
            this.pnContact.SuspendLayout();
            this.pnTutorial.SuspendLayout();
            this.SuspendLayout();
            // 
            // menuUserControl1
            // 
            this.menuUserControl1.BackColor = System.Drawing.Color.White;
            this.menuUserControl1.Dock = System.Windows.Forms.DockStyle.Left;
            this.menuUserControl1.Location = new System.Drawing.Point(0, 0);
            this.menuUserControl1.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.menuUserControl1.Name = "menuUserControl1";
            this.menuUserControl1.Size = new System.Drawing.Size(341, 912);
            this.menuUserControl1.TabIndex = 0;
            // 
            // pnContact
            // 
            this.pnContact.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnContact.Controls.Add(this.lblSelect);
            this.pnContact.Controls.Add(this.btnSend);
            this.pnContact.Controls.Add(this.lblSent);
            this.pnContact.Controls.Add(this.lblContact);
            this.pnContact.Controls.Add(this.cbPlace);
            this.pnContact.Controls.Add(this.txtDescription);
            this.pnContact.Location = new System.Drawing.Point(1461, 23);
            this.pnContact.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.pnContact.Name = "pnContact";
            this.pnContact.Size = new System.Drawing.Size(422, 414);
            this.pnContact.TabIndex = 5;
            this.pnContact.Paint += new System.Windows.Forms.PaintEventHandler(this.Panel_Paint);
            // 
            // lblSelect
            // 
            this.lblSelect.Font = new System.Drawing.Font("Trebuchet MS", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblSelect.Location = new System.Drawing.Point(17, 178);
            this.lblSelect.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblSelect.Name = "lblSelect";
            this.lblSelect.Size = new System.Drawing.Size(399, 43);
            this.lblSelect.TabIndex = 77;
            this.lblSelect.Text = "Dio aplikacije:";
            this.lblSelect.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // btnSend
            // 
            this.btnSend.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnSend.Location = new System.Drawing.Point(17, 271);
            this.btnSend.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnSend.Name = "btnSend";
            this.btnSend.Size = new System.Drawing.Size(385, 53);
            this.btnSend.TabIndex = 76;
            this.btnSend.Text = "Pošalji";
            this.btnSend.UseVisualStyleBackColor = true;
            this.btnSend.Click += new System.EventHandler(this.btnSend_Click);
            // 
            // lblSent
            // 
            this.lblSent.AutoSize = true;
            this.lblSent.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblSent.Location = new System.Drawing.Point(17, 341);
            this.lblSent.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblSent.Name = "lblSent";
            this.lblSent.Size = new System.Drawing.Size(77, 29);
            this.lblSent.TabIndex = 5;
            this.lblSent.Text = "Poslano";
            this.lblSent.UseCompatibleTextRendering = true;
            this.lblSent.Visible = false;
            // 
            // lblContact
            // 
            this.lblContact.AutoSize = true;
            this.lblContact.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblContact.Location = new System.Drawing.Point(17, 30);
            this.lblContact.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblContact.Name = "lblContact";
            this.lblContact.Size = new System.Drawing.Size(102, 29);
            this.lblContact.TabIndex = 4;
            this.lblContact.Text = "Kontakt";
            // 
            // cbPlace
            // 
            this.cbPlace.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbPlace.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.cbPlace.FormattingEnabled = true;
            this.cbPlace.Items.AddRange(new object[] {
            "Prijava",
            "Platforma",
            "Povijest",
            "Ispitivači",
            "Naručitelji",
            "Postavke",
            "Pomoć"});
            this.cbPlace.Location = new System.Drawing.Point(17, 224);
            this.cbPlace.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.cbPlace.Name = "cbPlace";
            this.cbPlace.Size = new System.Drawing.Size(384, 34);
            this.cbPlace.TabIndex = 1;
            // 
            // txtDescription
            // 
            this.txtDescription.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtDescription.Location = new System.Drawing.Point(17, 79);
            this.txtDescription.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.txtDescription.Multiline = true;
            this.txtDescription.Name = "txtDescription";
            this.txtDescription.Size = new System.Drawing.Size(384, 79);
            this.txtDescription.TabIndex = 0;
            // 
            // pnTutorial
            // 
            this.pnTutorial.AutoScroll = true;
            this.pnTutorial.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnTutorial.Controls.Add(this.lblTutorialText);
            this.pnTutorial.Controls.Add(this.lblTutorial);
            this.pnTutorial.Location = new System.Drawing.Point(371, 23);
            this.pnTutorial.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.pnTutorial.Name = "pnTutorial";
            this.pnTutorial.Size = new System.Drawing.Size(1063, 870);
            this.pnTutorial.TabIndex = 4;
            this.pnTutorial.Paint += new System.Windows.Forms.PaintEventHandler(this.Panel_Paint);
            // 
            // lblTutorialText
            // 
            this.lblTutorialText.Font = new System.Drawing.Font("Trebuchet MS", 19.8F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblTutorialText.Location = new System.Drawing.Point(35, 82);
            this.lblTutorialText.Name = "lblTutorialText";
            this.lblTutorialText.Size = new System.Drawing.Size(540, 83);
            this.lblTutorialText.TabIndex = 8;
            this.lblTutorialText.Text = "Tutorial trenutno nije dostupan";
            this.lblTutorialText.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // lblTutorial
            // 
            this.lblTutorial.AutoSize = true;
            this.lblTutorial.Font = new System.Drawing.Font("Trebuchet MS", 18F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblTutorial.Location = new System.Drawing.Point(29, 26);
            this.lblTutorial.Name = "lblTutorial";
            this.lblTutorial.Size = new System.Drawing.Size(126, 38);
            this.lblTutorial.TabIndex = 0;
            this.lblTutorial.Text = "Tutorial";
            // 
            // HelpForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1899, 912);
            this.Controls.Add(this.pnContact);
            this.Controls.Add(this.pnTutorial);
            this.Controls.Add(this.menuUserControl1);
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.Margin = new System.Windows.Forms.Padding(4, 2, 4, 2);
            this.MinimumSize = new System.Drawing.Size(1914, 941);
            this.Name = "HelpForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.Manual;
            this.Text = "AIGenerator";
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.HelpForm_FormClosed);
            this.Load += new System.EventHandler(this.HelpForm_Load);
            this.Resize += new System.EventHandler(this.HelpForm_Resize);
            this.pnContact.ResumeLayout(false);
            this.pnContact.PerformLayout();
            this.pnTutorial.ResumeLayout(false);
            this.pnTutorial.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private UserControls.MenuUserControl menuUserControl1;
        private System.Windows.Forms.Panel pnContact;
        private System.Windows.Forms.Label lblSent;
        private System.Windows.Forms.Label lblContact;
        private System.Windows.Forms.ComboBox cbPlace;
        private System.Windows.Forms.TextBox txtDescription;
        private System.Windows.Forms.Panel pnTutorial;
        private System.Windows.Forms.Label lblTutorial;
        private System.Windows.Forms.Button btnSend;
        private System.Windows.Forms.Label lblSelect;
        private System.Windows.Forms.Label lblTutorialText;
    }
}