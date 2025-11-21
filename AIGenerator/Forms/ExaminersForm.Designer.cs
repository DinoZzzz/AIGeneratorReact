namespace AIGenerator.Forms
{
    partial class ExaminersForm
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
            this.pbSearch = new System.Windows.Forms.PictureBox();
            this.txtSearch = new System.Windows.Forms.TextBox();
            this.btnAddNew = new System.Windows.Forms.Button();
            this.lblExaminers = new System.Windows.Forms.Label();
            this.dtExaminers = new System.Windows.Forms.DataGridView();
            this.FullName = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Username = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Accreditations = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.ReportsCount = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Id = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.menuUserControl1 = new AIGenerator.UserControls.MenuUserControl();
            this.pnReports.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbSearch)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.dtExaminers)).BeginInit();
            this.SuspendLayout();
            // 
            // pnReports
            // 
            this.pnReports.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnReports.Controls.Add(this.pbSearch);
            this.pnReports.Controls.Add(this.txtSearch);
            this.pnReports.Controls.Add(this.btnAddNew);
            this.pnReports.Controls.Add(this.lblExaminers);
            this.pnReports.Controls.Add(this.dtExaminers);
            this.pnReports.Location = new System.Drawing.Point(270, 28);
            this.pnReports.Name = "pnReports";
            this.pnReports.Size = new System.Drawing.Size(1138, 694);
            this.pnReports.TabIndex = 3;
            this.pnReports.Paint += new System.Windows.Forms.PaintEventHandler(this.pnReports_Paint);
            // 
            // pbSearch
            // 
            this.pbSearch.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.pbSearch.BackgroundImage = global::AIGenerator.Properties.Resources.search;
            this.pbSearch.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Zoom;
            this.pbSearch.Location = new System.Drawing.Point(885, 20);
            this.pbSearch.Margin = new System.Windows.Forms.Padding(2);
            this.pbSearch.Name = "pbSearch";
            this.pbSearch.Size = new System.Drawing.Size(22, 24);
            this.pbSearch.TabIndex = 77;
            this.pbSearch.TabStop = false;
            this.pbSearch.Click += new System.EventHandler(this.pbSearch_Click);
            // 
            // txtSearch
            // 
            this.txtSearch.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.txtSearch.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtSearch.Location = new System.Drawing.Point(641, 19);
            this.txtSearch.Margin = new System.Windows.Forms.Padding(2);
            this.txtSearch.Name = "txtSearch";
            this.txtSearch.Size = new System.Drawing.Size(240, 26);
            this.txtSearch.TabIndex = 76;
            this.txtSearch.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.txtSearch_KeyPress);
            // 
            // btnAddNew
            // 
            this.btnAddNew.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.btnAddNew.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnAddNew.Location = new System.Drawing.Point(912, 9);
            this.btnAddNew.Margin = new System.Windows.Forms.Padding(2);
            this.btnAddNew.Name = "btnAddNew";
            this.btnAddNew.Size = new System.Drawing.Size(206, 45);
            this.btnAddNew.TabIndex = 73;
            this.btnAddNew.Text = "Dodaj ispitivača";
            this.btnAddNew.UseVisualStyleBackColor = true;
            this.btnAddNew.Click += new System.EventHandler(this.btnAddNew_Click);
            // 
            // lblExaminers
            // 
            this.lblExaminers.Font = new System.Drawing.Font("Trebuchet MS", 18F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblExaminers.Location = new System.Drawing.Point(18, 14);
            this.lblExaminers.Name = "lblExaminers";
            this.lblExaminers.Size = new System.Drawing.Size(305, 34);
            this.lblExaminers.TabIndex = 3;
            this.lblExaminers.Text = "Ispitivači";
            this.lblExaminers.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblExaminers.UseCompatibleTextRendering = true;
            // 
            // dtExaminers
            // 
            this.dtExaminers.AllowUserToAddRows = false;
            this.dtExaminers.AllowUserToDeleteRows = false;
            this.dtExaminers.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.dtExaminers.AutoSizeColumnsMode = System.Windows.Forms.DataGridViewAutoSizeColumnsMode.Fill;
            this.dtExaminers.BorderStyle = System.Windows.Forms.BorderStyle.None;
            this.dtExaminers.CellBorderStyle = System.Windows.Forms.DataGridViewCellBorderStyle.None;
            this.dtExaminers.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.dtExaminers.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.FullName,
            this.Username,
            this.Accreditations,
            this.ReportsCount,
            this.Id});
            this.dtExaminers.EditMode = System.Windows.Forms.DataGridViewEditMode.EditProgrammatically;
            this.dtExaminers.Location = new System.Drawing.Point(18, 59);
            this.dtExaminers.Name = "dtExaminers";
            this.dtExaminers.RowHeadersVisible = false;
            this.dtExaminers.RowHeadersWidth = 51;
            this.dtExaminers.Size = new System.Drawing.Size(1100, 624);
            this.dtExaminers.TabIndex = 1;
            this.dtExaminers.CellClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dtExaminers_CellClick);
            this.dtExaminers.CellDoubleClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dtExaminers_CellDoubleClick);
            this.dtExaminers.Scroll += new System.Windows.Forms.ScrollEventHandler(this.dtExaminers_Scroll);
            this.dtExaminers.Sorted += new System.EventHandler(this.dtExaminers_Sorted);
            // 
            // FullName
            // 
            this.FullName.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.FullName.FillWeight = 25F;
            this.FullName.HeaderText = "Ispitivač";
            this.FullName.MinimumWidth = 250;
            this.FullName.Name = "FullName";
            this.FullName.Width = 250;
            // 
            // Username
            // 
            this.Username.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.Username.FillWeight = 20F;
            this.Username.HeaderText = "Korisničko ime";
            this.Username.MinimumWidth = 250;
            this.Username.Name = "Username";
            this.Username.Width = 250;
            // 
            // Accreditations
            // 
            this.Accreditations.HeaderText = "Osposobljenost";
            this.Accreditations.MinimumWidth = 6;
            this.Accreditations.Name = "Accreditations";
            this.Accreditations.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
            // 
            // ReportsCount
            // 
            this.ReportsCount.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.ReportsCount.FillWeight = 15F;
            this.ReportsCount.HeaderText = "Kreirao izvještaja";
            this.ReportsCount.MinimumWidth = 150;
            this.ReportsCount.Name = "ReportsCount";
            this.ReportsCount.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
            this.ReportsCount.Width = 150;
            // 
            // Id
            // 
            this.Id.HeaderText = "Id";
            this.Id.MinimumWidth = 6;
            this.Id.Name = "Id";
            this.Id.Visible = false;
            // 
            // menuUserControl1
            // 
            this.menuUserControl1.BackColor = System.Drawing.Color.White;
            this.menuUserControl1.Dock = System.Windows.Forms.DockStyle.Left;
            this.menuUserControl1.Location = new System.Drawing.Point(0, 0);
            this.menuUserControl1.Margin = new System.Windows.Forms.Padding(2);
            this.menuUserControl1.Name = "menuUserControl1";
            this.menuUserControl1.Size = new System.Drawing.Size(256, 741);
            this.menuUserControl1.TabIndex = 0;
            // 
            // ExaminersForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1424, 741);
            this.Controls.Add(this.pnReports);
            this.Controls.Add(this.menuUserControl1);
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.MinimumSize = new System.Drawing.Size(1440, 775);
            this.Name = "ExaminersForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.Manual;
            this.Text = "AIGenerator";
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.ExaminersForm_FormClosed);
            this.Load += new System.EventHandler(this.ExaminersForm_Load);
            this.Resize += new System.EventHandler(this.ExaminersForm_Resize);
            this.pnReports.ResumeLayout(false);
            this.pnReports.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbSearch)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.dtExaminers)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private UserControls.MenuUserControl menuUserControl1;
        private System.Windows.Forms.Panel pnReports;
        private System.Windows.Forms.Label lblExaminers;
        private System.Windows.Forms.DataGridView dtExaminers;
        private System.Windows.Forms.Button btnAddNew;
        private System.Windows.Forms.PictureBox pbSearch;
        private System.Windows.Forms.TextBox txtSearch;
        private System.Windows.Forms.DataGridViewTextBoxColumn FullName;
        private System.Windows.Forms.DataGridViewTextBoxColumn Username;
        private System.Windows.Forms.DataGridViewTextBoxColumn Accreditations;
        private System.Windows.Forms.DataGridViewTextBoxColumn ReportsCount;
        private System.Windows.Forms.DataGridViewTextBoxColumn Id;
    }
}