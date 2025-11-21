namespace AIGenerator.Forms
{
    partial class CustomersForm
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
            this.dtCustomers = new System.Windows.Forms.DataGridView();
            this.WorkOrder = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.FullName = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Address = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.CustomerLocation = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Id = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.menuUserControl1 = new AIGenerator.UserControls.MenuUserControl();
            this.pnReports.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbSearch)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.dtCustomers)).BeginInit();
            this.SuspendLayout();
            // 
            // pnReports
            // 
            this.pnReports.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnReports.Controls.Add(this.pbSearch);
            this.pnReports.Controls.Add(this.txtSearch);
            this.pnReports.Controls.Add(this.btnAddNew);
            this.pnReports.Controls.Add(this.lblExaminers);
            this.pnReports.Controls.Add(this.dtCustomers);
            this.pnReports.Location = new System.Drawing.Point(270, 28);
            this.pnReports.Name = "pnReports";
            this.pnReports.Size = new System.Drawing.Size(1138, 694);
            this.pnReports.TabIndex = 4;
            this.pnReports.Paint += new System.Windows.Forms.PaintEventHandler(this.pnReports_Paint);
            // 
            // pbSearch
            // 
            this.pbSearch.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.pbSearch.BackgroundImage = global::AIGenerator.Properties.Resources.search;
            this.pbSearch.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Zoom;
            this.pbSearch.Location = new System.Drawing.Point(886, 20);
            this.pbSearch.Margin = new System.Windows.Forms.Padding(2);
            this.pbSearch.Name = "pbSearch";
            this.pbSearch.Size = new System.Drawing.Size(22, 24);
            this.pbSearch.TabIndex = 79;
            this.pbSearch.TabStop = false;
            this.pbSearch.Click += new System.EventHandler(this.pbSearch_Click);
            // 
            // txtSearch
            // 
            this.txtSearch.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.txtSearch.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtSearch.Location = new System.Drawing.Point(642, 19);
            this.txtSearch.Margin = new System.Windows.Forms.Padding(2);
            this.txtSearch.Name = "txtSearch";
            this.txtSearch.Size = new System.Drawing.Size(240, 26);
            this.txtSearch.TabIndex = 78;
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
            this.btnAddNew.TabIndex = 72;
            this.btnAddNew.Text = "Dodaj naručitelja";
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
            this.lblExaminers.Text = "Naručitelji";
            this.lblExaminers.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblExaminers.UseCompatibleTextRendering = true;
            // 
            // dtCustomers
            // 
            this.dtCustomers.AllowUserToAddRows = false;
            this.dtCustomers.AllowUserToDeleteRows = false;
            this.dtCustomers.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.dtCustomers.AutoSizeColumnsMode = System.Windows.Forms.DataGridViewAutoSizeColumnsMode.Fill;
            this.dtCustomers.BorderStyle = System.Windows.Forms.BorderStyle.None;
            this.dtCustomers.CellBorderStyle = System.Windows.Forms.DataGridViewCellBorderStyle.None;
            this.dtCustomers.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.dtCustomers.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.WorkOrder,
            this.FullName,
            this.Address,
            this.CustomerLocation,
            this.Id});
            this.dtCustomers.EditMode = System.Windows.Forms.DataGridViewEditMode.EditProgrammatically;
            this.dtCustomers.Location = new System.Drawing.Point(18, 59);
            this.dtCustomers.Name = "dtCustomers";
            this.dtCustomers.RowHeadersVisible = false;
            this.dtCustomers.RowHeadersWidth = 51;
            this.dtCustomers.Size = new System.Drawing.Size(1100, 624);
            this.dtCustomers.TabIndex = 1;
            this.dtCustomers.CellClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dtCustomers_CellClick);
            this.dtCustomers.CellDoubleClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dtCustomers_CellDoubleClick);
            this.dtCustomers.Scroll += new System.Windows.Forms.ScrollEventHandler(this.dtCustomers_Scroll);
            this.dtCustomers.Sorted += new System.EventHandler(this.dtCustomers_Sorted);
            // 
            // WorkOrder
            // 
            this.WorkOrder.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.WorkOrder.HeaderText = "Broj";
            this.WorkOrder.MinimumWidth = 75;
            this.WorkOrder.Name = "WorkOrder";
            this.WorkOrder.Width = 75;
            // 
            // FullName
            // 
            this.FullName.HeaderText = "Naručitelj";
            this.FullName.MinimumWidth = 200;
            this.FullName.Name = "FullName";
            // 
            // Address
            // 
            this.Address.FillWeight = 80F;
            this.Address.HeaderText = "Adresa";
            this.Address.MinimumWidth = 200;
            this.Address.Name = "Address";
            // 
            // CustomerLocation
            // 
            this.CustomerLocation.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.CustomerLocation.FillWeight = 18.4106F;
            this.CustomerLocation.HeaderText = "Lokacija";
            this.CustomerLocation.MinimumWidth = 200;
            this.CustomerLocation.Name = "CustomerLocation";
            this.CustomerLocation.Width = 200;
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
            // CustomersForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1424, 741);
            this.Controls.Add(this.pnReports);
            this.Controls.Add(this.menuUserControl1);
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.MinimumSize = new System.Drawing.Size(1440, 773);
            this.Name = "CustomersForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.Manual;
            this.Text = "AIGenerator";
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.CustomersForm_FormClosed);
            this.Load += new System.EventHandler(this.CustomersForm_Load);
            this.Resize += new System.EventHandler(this.CustomersForm_Resize);
            this.pnReports.ResumeLayout(false);
            this.pnReports.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbSearch)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.dtCustomers)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private UserControls.MenuUserControl menuUserControl1;
        private System.Windows.Forms.Panel pnReports;
        private System.Windows.Forms.Label lblExaminers;
        private System.Windows.Forms.DataGridView dtCustomers;
        private System.Windows.Forms.Button btnAddNew;
        private System.Windows.Forms.PictureBox pbSearch;
        private System.Windows.Forms.TextBox txtSearch;
        private System.Windows.Forms.DataGridViewTextBoxColumn WorkOrder;
        private System.Windows.Forms.DataGridViewTextBoxColumn FullName;
        private System.Windows.Forms.DataGridViewTextBoxColumn Address;
        private System.Windows.Forms.DataGridViewTextBoxColumn CustomerLocation;
        private System.Windows.Forms.DataGridViewTextBoxColumn Id;
    }
}