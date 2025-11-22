namespace AIGenerator.Forms
{
    partial class HistoryForm
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
            this.pnReports = new System.Windows.Forms.Panel();
            this.pbSearch = new System.Windows.Forms.PictureBox();
            this.txtSearch = new System.Windows.Forms.TextBox();
            this.lblShortView = new System.Windows.Forms.Label();
            this.dtReports = new System.Windows.Forms.DataGridView();
            this.Construction = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.CreatedBy = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Certifier = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Id = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.FormsCount = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.CreationTime = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.pnReports.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbSearch)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.dtReports)).BeginInit();
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
            // pnReports
            // 
            this.pnReports.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.pnReports.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnReports.Controls.Add(this.pbSearch);
            this.pnReports.Controls.Add(this.txtSearch);
            this.pnReports.Controls.Add(this.lblShortView);
            this.pnReports.Controls.Add(this.dtReports);
            this.pnReports.Location = new System.Drawing.Point(360, 34);
            this.pnReports.Margin = new System.Windows.Forms.Padding(4);
            this.pnReports.Name = "pnReports";
            this.pnReports.Size = new System.Drawing.Size(1526, 855);
            this.pnReports.TabIndex = 3;
            this.pnReports.Paint += new System.Windows.Forms.PaintEventHandler(this.pnReports_Paint);
            // 
            // pbSearch
            // 
            this.pbSearch.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.pbSearch.BackgroundImage = global::AIGenerator.Properties.Resources.search;
            this.pbSearch.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Zoom;
            this.pbSearch.Location = new System.Drawing.Point(1469, 21);
            this.pbSearch.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.pbSearch.Name = "pbSearch";
            this.pbSearch.Size = new System.Drawing.Size(29, 30);
            this.pbSearch.TabIndex = 5;
            this.pbSearch.TabStop = false;
            this.pbSearch.Click += new System.EventHandler(this.pbSearch_Click);
            // 
            // txtSearch
            // 
            this.txtSearch.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.txtSearch.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtSearch.Location = new System.Drawing.Point(1125, 20);
            this.txtSearch.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.txtSearch.Name = "txtSearch";
            this.txtSearch.Size = new System.Drawing.Size(319, 31);
            this.txtSearch.TabIndex = 4;
            this.txtSearch.TextChanged += new System.EventHandler(this.txtSearch_TextChanged);
            this.txtSearch.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.txtSearch_KeyPress);
            // 
            // lblShortView
            // 
            this.lblShortView.Font = new System.Drawing.Font("Trebuchet MS", 18F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblShortView.Location = new System.Drawing.Point(24, 17);
            this.lblShortView.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblShortView.Name = "lblShortView";
            this.lblShortView.Size = new System.Drawing.Size(1095, 42);
            this.lblShortView.TabIndex = 3;
            this.lblShortView.Text = "Pregled povijesti generiranja izvještaja";
            this.lblShortView.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblShortView.UseCompatibleTextRendering = true;
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
            this.dtReports.Size = new System.Drawing.Size(1476, 769);
            this.dtReports.TabIndex = 1;
            this.dtReports.CellClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dtReports_CellClick);
            this.dtReports.CellDoubleClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dtReports_CellDoubleClick);
            this.dtReports.Scroll += new System.Windows.Forms.ScrollEventHandler(this.dtReports_Scroll);
            this.dtReports.Sorted += new System.EventHandler(this.dtReports_Sorted);
            // 
            // Construction
            // 
            this.Construction.FillWeight = 35F;
            this.Construction.HeaderText = "Dio Građevine";
            this.Construction.MinimumWidth = 150;
            this.Construction.Name = "Construction";
            // 
            // CreatedBy
            // 
            this.CreatedBy.FillWeight = 35F;
            this.CreatedBy.HeaderText = "Izvještaj izradio";
            this.CreatedBy.MinimumWidth = 100;
            this.CreatedBy.Name = "CreatedBy";
            this.CreatedBy.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
            // 
            // Certifier
            // 
            this.Certifier.FillWeight = 20F;
            this.Certifier.HeaderText = "Ovjerio";
            this.Certifier.MinimumWidth = 100;
            this.Certifier.Name = "Certifier";
            this.Certifier.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
            // 
            // Id
            // 
            this.Id.HeaderText = "Id";
            this.Id.MinimumWidth = 6;
            this.Id.Name = "Id";
            this.Id.Visible = false;
            // 
            // FormsCount
            // 
            this.FormsCount.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.FormsCount.FillWeight = 10F;
            this.FormsCount.HeaderText = "Br. obrazaca";
            this.FormsCount.MinimumWidth = 100;
            this.FormsCount.Name = "FormsCount";
            this.FormsCount.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
            this.FormsCount.Width = 125;
            // 
            // CreationTime
            // 
            this.CreationTime.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.CreationTime.FillWeight = 10F;
            this.CreationTime.HeaderText = "Datum kreiranja";
            this.CreationTime.MinimumWidth = 135;
            this.CreationTime.Name = "CreationTime";
            this.CreationTime.Width = 135;
            // 
            // HistoryForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1899, 912);
            this.Controls.Add(this.pnReports);
            this.Controls.Add(this.menuUserControl1);
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.Margin = new System.Windows.Forms.Padding(4, 2, 4, 2);
            this.MinimumSize = new System.Drawing.Size(1914, 941);
            this.Name = "HistoryForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.Manual;
            this.Text = "AIGenerator";
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.HistoryForm_FormClosed);
            this.Load += new System.EventHandler(this.HistoryForm_Load);
            this.Resize += new System.EventHandler(this.HistoryForm_Resize);
            this.pnReports.ResumeLayout(false);
            this.pnReports.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbSearch)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.dtReports)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private UserControls.MenuUserControl menuUserControl1;
        private System.Windows.Forms.Panel pnReports;
        private System.Windows.Forms.Label lblShortView;
        private System.Windows.Forms.DataGridView dtReports;
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