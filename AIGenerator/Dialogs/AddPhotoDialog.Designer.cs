namespace AIGenerator.Dialogs
{
    partial class AddPhotoDialog
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
            this.txtTitle = new System.Windows.Forms.TextBox();
            this.lblName = new System.Windows.Forms.Label();
            this.btnAdd = new System.Windows.Forms.Button();
            this.pbSelectedPhoto = new System.Windows.Forms.PictureBox();
            this.btnAddDeletePhoto = new System.Windows.Forms.Button();
            this.pbPDF = new System.Windows.Forms.PictureBox();
            ((System.ComponentModel.ISupportInitialize)(this.pbSelectedPhoto)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.pbPDF)).BeginInit();
            this.SuspendLayout();
            // 
            // txtTitle
            // 
            this.txtTitle.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtTitle.Location = new System.Drawing.Point(92, 265);
            this.txtTitle.Margin = new System.Windows.Forms.Padding(2);
            this.txtTitle.Name = "txtTitle";
            this.txtTitle.Size = new System.Drawing.Size(327, 26);
            this.txtTitle.TabIndex = 2;
            this.txtTitle.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.TextBox_KeyPress);
            // 
            // lblName
            // 
            this.lblName.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblName.Location = new System.Drawing.Point(10, 262);
            this.lblName.Name = "lblName";
            this.lblName.Size = new System.Drawing.Size(77, 34);
            this.lblName.TabIndex = 6;
            this.lblName.Text = "Naslov:";
            this.lblName.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblName.UseCompatibleTextRendering = true;
            // 
            // btnAdd
            // 
            this.btnAdd.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
            this.btnAdd.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnAdd.Location = new System.Drawing.Point(133, 304);
            this.btnAdd.Margin = new System.Windows.Forms.Padding(2);
            this.btnAdd.Name = "btnAdd";
            this.btnAdd.Size = new System.Drawing.Size(206, 45);
            this.btnAdd.TabIndex = 3;
            this.btnAdd.Text = "Dodaj";
            this.btnAdd.UseVisualStyleBackColor = true;
            this.btnAdd.Click += new System.EventHandler(this.btnAdd_Click);
            // 
            // pbSelectedPhoto
            // 
            this.pbSelectedPhoto.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Zoom;
            this.pbSelectedPhoto.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pbSelectedPhoto.Location = new System.Drawing.Point(10, 10);
            this.pbSelectedPhoto.Margin = new System.Windows.Forms.Padding(2);
            this.pbSelectedPhoto.Name = "pbSelectedPhoto";
            this.pbSelectedPhoto.Size = new System.Drawing.Size(458, 207);
            this.pbSelectedPhoto.TabIndex = 7;
            this.pbSelectedPhoto.TabStop = false;
            // 
            // btnAddDeletePhoto
            // 
            this.btnAddDeletePhoto.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
            this.btnAddDeletePhoto.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnAddDeletePhoto.Location = new System.Drawing.Point(305, 217);
            this.btnAddDeletePhoto.Margin = new System.Windows.Forms.Padding(2);
            this.btnAddDeletePhoto.Name = "btnAddDeletePhoto";
            this.btnAddDeletePhoto.Size = new System.Drawing.Size(162, 32);
            this.btnAddDeletePhoto.TabIndex = 8;
            this.btnAddDeletePhoto.Text = "Odaberi sliku/PDF";
            this.btnAddDeletePhoto.UseVisualStyleBackColor = true;
            this.btnAddDeletePhoto.Click += new System.EventHandler(this.btnAddDeletePhoto_Click);
            // 
            // pbPDF
            // 
            this.pbPDF.BackgroundImage = global::AIGenerator.Properties.Resources.pdf;
            this.pbPDF.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Zoom;
            this.pbPDF.Location = new System.Drawing.Point(428, 222);
            this.pbPDF.Name = "pbPDF";
            this.pbPDF.Size = new System.Drawing.Size(40, 40);
            this.pbPDF.TabIndex = 9;
            this.pbPDF.TabStop = false;
            this.pbPDF.Visible = false;
            // 
            // AddPhotoDialog
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(476, 358);
            this.Controls.Add(this.pbPDF);
            this.Controls.Add(this.btnAddDeletePhoto);
            this.Controls.Add(this.pbSelectedPhoto);
            this.Controls.Add(this.btnAdd);
            this.Controls.Add(this.txtTitle);
            this.Controls.Add(this.lblName);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.Margin = new System.Windows.Forms.Padding(2);
            this.Name = "AddPhotoDialog";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Nova datoteka";
            this.Load += new System.EventHandler(this.AddPhotoDialog_Load);
            ((System.ComponentModel.ISupportInitialize)(this.pbSelectedPhoto)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.pbPDF)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.TextBox txtTitle;
        private System.Windows.Forms.Label lblName;
        private System.Windows.Forms.Button btnAdd;
        private System.Windows.Forms.PictureBox pbSelectedPhoto;
        private System.Windows.Forms.Button btnAddDeletePhoto;
        private System.Windows.Forms.PictureBox pbPDF;
    }
}