namespace AIGenerator.Forms
{
    partial class ReportsForm
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
            this.lblReports = new System.Windows.Forms.Label();
            this.dtReports = new System.Windows.Forms.DataGridView();
            this.Construction = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.CreatedBy = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Certifier = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Id = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.FormsCount = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.CreationTime = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.btnBack = new System.Windows.Forms.Button();
            this.lblConstruction = new System.Windows.Forms.Label();
            this.lblCustomer = new System.Windows.Forms.Label();
            this.pnReports.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbSearch)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.dtReports)).BeginInit();
            this.SuspendLayout();
            // 
            // pnReports
            // 
            this.pnReports.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnReports.Controls.Add(this.pbSearch);
            this.pnReports.Controls.Add(this.txtSearch);
            this.pnReports.Controls.Add(this.btnAddNew);
            this.pnReports.Controls.Add(this.lblReports);
            this.pnReports.Controls.Add(this.dtReports);
            this.pnReports.Location = new System.Drawing.Point(16, 121);
            this.pnReports.Margin = new System.Windows.Forms.Padding(4);
            this.pnReports.Name = "pnReports";
            this.pnReports.Size = new System.Drawing.Size(1869, 772);
            this.pnReports.TabIndex = 5;
            this.pnReports.Paint += new System.Windows.Forms.PaintEventHandler(this.pnReports_Paint);
            // 
            // pbSearch
            // 
            this.pbSearch.BackgroundImage = global::AIGenerator.Properties.Resources.search;
            this.pbSearch.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Zoom;
            this.pbSearch.Location = new System.Drawing.Point(1532, 27);
            this.pbSearch.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.pbSearch.Name = "pbSearch";
            this.pbSearch.Size = new System.Drawing.Size(29, 30);
            this.pbSearch.TabIndex = 82;
            this.pbSearch.TabStop = false;
            this.pbSearch.Click += new System.EventHandler(this.pbSearch_Click);
            // 
            // txtSearch
            // 
            this.txtSearch.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtSearch.Location = new System.Drawing.Point(1207, 26);
            this.txtSearch.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.txtSearch.Name = "txtSearch";
            this.txtSearch.Size = new System.Drawing.Size(319, 31);
            this.txtSearch.TabIndex = 81;
            this.txtSearch.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.txtSearch_KeyPress);
            // 
            // btnAddNew
            // 
            this.btnAddNew.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnAddNew.Location = new System.Drawing.Point(1568, 11);
            this.btnAddNew.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnAddNew.Name = "btnAddNew";
            this.btnAddNew.Size = new System.Drawing.Size(275, 55);
            this.btnAddNew.TabIndex = 71;
            this.btnAddNew.Text = "Kreiraj izvještaj";
            this.btnAddNew.UseVisualStyleBackColor = true;
            this.btnAddNew.Click += new System.EventHandler(this.btnAddNew_Click);
            // 
            // lblReports
            // 
            this.lblReports.Font = new System.Drawing.Font("Trebuchet MS", 18F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblReports.Location = new System.Drawing.Point(24, 17);
            this.lblReports.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblReports.Name = "lblReports";
            this.lblReports.Size = new System.Drawing.Size(407, 42);
            this.lblReports.TabIndex = 3;
            this.lblReports.Text = "Izvještaji";
            this.lblReports.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblReports.UseCompatibleTextRendering = true;
            // 
            // dtReports
            // 
            this.dtReports.AllowUserToAddRows = false;
            this.dtReports.AllowUserToDeleteRows = false;
            this.dtReports.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.dtReports.AutoSizeColumnsMode = System.Windows.Forms.DataGridViewAutoSizeColumnsMode.Fill;
            this.dtReports.BorderStyle = System.Windows.Forms.BorderStyle.None;
            this.dtReports.CellBorderStyle = System.Windows.Forms.DataGridViewCellBorderStyle.None;
            this.dtReports.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.dtReports.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.Construction,
            this.CreatedBy,
            this.Certifier,
            this.Id,
            this.FormsCount,
            this.CreationTime});
            this.dtReports.EditMode = System.Windows.Forms.DataGridViewEditMode.EditProgrammatically;
            this.dtReports.Location = new System.Drawing.Point(24, 73);
            this.dtReports.Margin = new System.Windows.Forms.Padding(4);
            this.dtReports.Name = "dtReports";
            this.dtReports.RowHeadersVisible = false;
            this.dtReports.RowHeadersWidth = 51;
            this.dtReports.Size = new System.Drawing.Size(1819, 687);
            this.dtReports.TabIndex = 1;
            this.dtReports.CellClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dtReports_CellClick);
            this.dtReports.CellDoubleClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dtReports_CellDoubleClick);
            this.dtReports.Scroll += new System.Windows.Forms.ScrollEventHandler(this.dtReports_Scroll);
            this.dtReports.Sorted += new System.EventHandler(this.dtReports_Sorted);
            // 
            // Construction
            // 
            this.Construction.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.Construction.FillWeight = 60F;
            this.Construction.HeaderText = "Dio Građevine";
            this.Construction.MinimumWidth = 150;
            this.Construction.Name = "Construction";
            this.Construction.Width = 437;
            // 
            // CreatedBy
            // 
            this.CreatedBy.FillWeight = 40F;
            this.CreatedBy.HeaderText = "Izvještaj izradio";
            this.CreatedBy.MinimumWidth = 150;
            this.CreatedBy.Name = "CreatedBy";
            this.CreatedBy.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
            // 
            // Certifier
            // 
            this.Certifier.FillWeight = 40F;
            this.Certifier.HeaderText = "Ovjerio";
            this.Certifier.MinimumWidth = 150;
            this.Certifier.Name = "Certifier";
            this.Certifier.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
            // 
            // Id
            // 
            this.Id.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.Id.HeaderText = "Id";
            this.Id.MinimumWidth = 6;
            this.Id.Name = "Id";
            this.Id.Visible = false;
            this.Id.Width = 125;
            // 
            // FormsCount
            // 
            this.FormsCount.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.FormsCount.HeaderText = "Br. obrazaca";
            this.FormsCount.MinimumWidth = 100;
            this.FormsCount.Name = "FormsCount";
            this.FormsCount.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
            this.FormsCount.Width = 125;
            // 
            // CreationTime
            // 
            this.CreationTime.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.CreationTime.HeaderText = "Datum kreiranja";
            this.CreationTime.MinimumWidth = 135;
            this.CreationTime.Name = "CreationTime";
            this.CreationTime.Width = 135;
            // 
            // btnBack
            // 
            this.btnBack.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnBack.Location = new System.Drawing.Point(16, 14);
            this.btnBack.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnBack.Name = "btnBack";
            this.btnBack.Size = new System.Drawing.Size(275, 62);
            this.btnBack.TabIndex = 9;
            this.btnBack.Text = "Povratak";
            this.btnBack.UseVisualStyleBackColor = true;
            this.btnBack.Click += new System.EventHandler(this.btnBack_Click);
            // 
            // lblConstruction
            // 
            this.lblConstruction.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblConstruction.Location = new System.Drawing.Point(299, 60);
            this.lblConstruction.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblConstruction.Name = "lblConstruction";
            this.lblConstruction.Size = new System.Drawing.Size(807, 46);
            this.lblConstruction.TabIndex = 15;
            this.lblConstruction.Text = "Naručitelj";
            this.lblConstruction.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblConstruction.UseCompatibleTextRendering = true;
            // 
            // lblCustomer
            // 
            this.lblCustomer.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblCustomer.Location = new System.Drawing.Point(299, 14);
            this.lblCustomer.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblCustomer.Name = "lblCustomer";
            this.lblCustomer.Size = new System.Drawing.Size(807, 46);
            this.lblCustomer.TabIndex = 14;
            this.lblCustomer.Text = "Naručitelj";
            this.lblCustomer.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblCustomer.UseCompatibleTextRendering = true;
            // 
            // ReportsForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1901, 921);
            this.Controls.Add(this.lblConstruction);
            this.Controls.Add(this.lblCustomer);
            this.Controls.Add(this.btnBack);
            this.Controls.Add(this.pnReports);
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.Margin = new System.Windows.Forms.Padding(4, 2, 4, 2);
            this.MinimumSize = new System.Drawing.Size(1917, 953);
            this.Name = "ReportsForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.Manual;
            this.Text = "AIGenerator";
            this.Activated += new System.EventHandler(this.ReportDataForm_Activated);
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.ReportFillingForm_FormClosed);
            this.Load += new System.EventHandler(this.ReportsForm_Load);
            this.Resize += new System.EventHandler(this.ReportsForm_Resize);
            this.pnReports.ResumeLayout(false);
            this.pnReports.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbSearch)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.dtReports)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion
        private System.Windows.Forms.Panel pnReports;
        private System.Windows.Forms.Label lblReports;
        private System.Windows.Forms.DataGridView dtReports;
        private System.Windows.Forms.Button btnAddNew;
        private System.Windows.Forms.Button btnBack;
        private System.Windows.Forms.Label lblConstruction;
        private System.Windows.Forms.Label lblCustomer;
        private System.Windows.Forms.PictureBox pbSearch;
        private System.Windows.Forms.TextBox txtSearch;
        private System.Windows.Forms.DataGridViewTextBoxColumn Construction;
        private System.Windows.Forms.DataGridViewTextBoxColumn CreatedBy;
        private System.Windows.Forms.DataGridViewTextBoxColumn Certifier;
        private System.Windows.Forms.DataGridViewTextBoxColumn Id;
        private System.Windows.Forms.DataGridViewTextBoxColumn FormsCount;
        private System.Windows.Forms.DataGridViewTextBoxColumn CreationTime;
    }
}