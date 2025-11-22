namespace AIGenerator.Forms
{
    partial class ReportPhotosForm
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
            this.pnReports = new System.Windows.Forms.Panel();
            this.btnAddNew = new System.Windows.Forms.Button();
            this.lblPhotos = new System.Windows.Forms.Label();
            this.flpPhotos = new System.Windows.Forms.FlowLayoutPanel();
            this.btnBack = new System.Windows.Forms.Button();
            this.btnSave = new System.Windows.Forms.Button();
            this.pnReports.SuspendLayout();
            this.SuspendLayout();
            // 
            // pnReports
            // 
            this.pnReports.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnReports.Controls.Add(this.btnAddNew);
            this.pnReports.Controls.Add(this.lblPhotos);
            this.pnReports.Controls.Add(this.flpPhotos);
            this.pnReports.Location = new System.Drawing.Point(12, 98);
            this.pnReports.Name = "pnReports";
            this.pnReports.Size = new System.Drawing.Size(1402, 638);
            this.pnReports.TabIndex = 5;
            this.pnReports.Paint += new System.Windows.Forms.PaintEventHandler(this.pnReports_Paint);
            // 
            // btnAddNew
            // 
            this.btnAddNew.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.btnAddNew.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnAddNew.Location = new System.Drawing.Point(1176, 9);
            this.btnAddNew.Margin = new System.Windows.Forms.Padding(2);
            this.btnAddNew.Name = "btnAddNew";
            this.btnAddNew.Size = new System.Drawing.Size(206, 45);
            this.btnAddNew.TabIndex = 71;
            this.btnAddNew.Text = "Dodaj sliku ili PDF";
            this.btnAddNew.UseVisualStyleBackColor = true;
            this.btnAddNew.Click += new System.EventHandler(this.btnAddNew_Click);
            // 
            // lblPhotos
            // 
            this.lblPhotos.Font = new System.Drawing.Font("Trebuchet MS", 18F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblPhotos.Location = new System.Drawing.Point(18, 14);
            this.lblPhotos.Name = "lblPhotos";
            this.lblPhotos.Size = new System.Drawing.Size(305, 34);
            this.lblPhotos.TabIndex = 3;
            this.lblPhotos.Text = "Slike";
            this.lblPhotos.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblPhotos.UseCompatibleTextRendering = true;
            // 
            // flpPhotos
            // 
            this.flpPhotos.AutoScroll = true;
            this.flpPhotos.Location = new System.Drawing.Point(18, 59);
            this.flpPhotos.Margin = new System.Windows.Forms.Padding(2);
            this.flpPhotos.Name = "flpPhotos";
            this.flpPhotos.Size = new System.Drawing.Size(1364, 568);
            this.flpPhotos.TabIndex = 72;
            // 
            // btnBack
            // 
            this.btnBack.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnBack.Location = new System.Drawing.Point(12, 11);
            this.btnBack.Margin = new System.Windows.Forms.Padding(2);
            this.btnBack.Name = "btnBack";
            this.btnBack.Size = new System.Drawing.Size(206, 50);
            this.btnBack.TabIndex = 9;
            this.btnBack.Text = "Povratak";
            this.btnBack.UseVisualStyleBackColor = true;
            this.btnBack.Click += new System.EventHandler(this.btnBack_Click);
            // 
            // btnSave
            // 
            this.btnSave.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnSave.Location = new System.Drawing.Point(223, 11);
            this.btnSave.Margin = new System.Windows.Forms.Padding(2);
            this.btnSave.Name = "btnSave";
            this.btnSave.Size = new System.Drawing.Size(206, 50);
            this.btnSave.TabIndex = 10;
            this.btnSave.Text = "Spremi i završi";
            this.btnSave.UseVisualStyleBackColor = true;
            this.btnSave.Click += new System.EventHandler(this.btnSave_Click);
            // 
            // ReportPhotosForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1426, 748);
            this.Controls.Add(this.pnReports);
            this.Controls.Add(this.btnBack);
            this.Controls.Add(this.btnSave);
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.MinimumSize = new System.Drawing.Size(1442, 782);
            this.Name = "ReportPhotosForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.Manual;
            this.Text = "AIGenerator";
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.ReportFillingForm_FormClosed);
            this.Load += new System.EventHandler(this.ReportPhotosForm_Load);
            this.Resize += new System.EventHandler(this.ReportPhotosForm_Resize);
            this.pnReports.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion
        private System.Windows.Forms.Panel pnReports;
        private System.Windows.Forms.Label lblPhotos;
        private System.Windows.Forms.Button btnAddNew;
        private System.Windows.Forms.Button btnBack;
        private System.Windows.Forms.FlowLayoutPanel flpPhotos;
        private System.Windows.Forms.Button btnSave;
    }
}