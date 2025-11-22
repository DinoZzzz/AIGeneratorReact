namespace AIGenerator.Forms
{
    partial class ConstructionsForm
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
            this.lblConstructions = new System.Windows.Forms.Label();
            this.dtForms = new System.Windows.Forms.DataGridView();
            this.WorkOrder = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.ConstructionSite = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Id = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.btnBack = new System.Windows.Forms.Button();
            this.lblCustomer = new System.Windows.Forms.Label();
            this.pnReports.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbSearch)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.dtForms)).BeginInit();
            this.SuspendLayout();
            // 
            // pnReports
            // 
            this.pnReports.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnReports.Controls.Add(this.pbSearch);
            this.pnReports.Controls.Add(this.txtSearch);
            this.pnReports.Controls.Add(this.btnAddNew);
            this.pnReports.Controls.Add(this.lblConstructions);
            this.pnReports.Controls.Add(this.dtForms);
            this.pnReports.Location = new System.Drawing.Point(16, 121);
            this.pnReports.Margin = new System.Windows.Forms.Padding(4);
            this.pnReports.Name = "pnReports";
            this.pnReports.Size = new System.Drawing.Size(1869, 785);
            this.pnReports.TabIndex = 5;
            this.pnReports.Paint += new System.Windows.Forms.PaintEventHandler(this.pnReports_Paint);
            // 
            // pbSearch
            // 
            this.pbSearch.BackgroundImage = global::AIGenerator.Properties.Resources.search;
            this.pbSearch.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Zoom;
            this.pbSearch.Location = new System.Drawing.Point(1533, 26);
            this.pbSearch.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.pbSearch.Name = "pbSearch";
            this.pbSearch.Size = new System.Drawing.Size(29, 30);
            this.pbSearch.TabIndex = 80;
            this.pbSearch.TabStop = false;
            this.pbSearch.Click += new System.EventHandler(this.pbSearch_Click);
            // 
            // txtSearch
            // 
            this.txtSearch.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtSearch.Location = new System.Drawing.Point(1208, 24);
            this.txtSearch.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.txtSearch.Name = "txtSearch";
            this.txtSearch.Size = new System.Drawing.Size(319, 31);
            this.txtSearch.TabIndex = 72;
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
            this.btnAddNew.Text = "Dodaj gradilište";
            this.btnAddNew.UseVisualStyleBackColor = true;
            this.btnAddNew.Click += new System.EventHandler(this.btnAddNew_Click);
            // 
            // lblConstructions
            // 
            this.lblConstructions.Font = new System.Drawing.Font("Microsoft Sans Serif", 18F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblConstructions.Location = new System.Drawing.Point(24, 17);
            this.lblConstructions.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblConstructions.Name = "lblConstructions";
            this.lblConstructions.Size = new System.Drawing.Size(407, 42);
            this.lblConstructions.TabIndex = 3;
            this.lblConstructions.Text = "Gradilišta";
            this.lblConstructions.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblConstructions.UseCompatibleTextRendering = true;
            // 
            // dtForms
            // 
            this.dtForms.AllowUserToAddRows = false;
            this.dtForms.AllowUserToDeleteRows = false;
            this.dtForms.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.dtForms.AutoSizeColumnsMode = System.Windows.Forms.DataGridViewAutoSizeColumnsMode.Fill;
            this.dtForms.BorderStyle = System.Windows.Forms.BorderStyle.None;
            this.dtForms.CellBorderStyle = System.Windows.Forms.DataGridViewCellBorderStyle.None;
            this.dtForms.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.dtForms.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.WorkOrder,
            this.ConstructionSite,
            this.Id});
            this.dtForms.EditMode = System.Windows.Forms.DataGridViewEditMode.EditProgrammatically;
            this.dtForms.Location = new System.Drawing.Point(24, 73);
            this.dtForms.Margin = new System.Windows.Forms.Padding(4);
            this.dtForms.Name = "dtForms";
            this.dtForms.RowHeadersVisible = false;
            this.dtForms.RowHeadersWidth = 51;
            this.dtForms.Size = new System.Drawing.Size(1819, 699);
            this.dtForms.TabIndex = 1;
            this.dtForms.CellClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dtForms_CellClick);
            this.dtForms.CellDoubleClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dtForms_CellDoubleClick);
            this.dtForms.Scroll += new System.Windows.Forms.ScrollEventHandler(this.dtForms_Scroll);
            this.dtForms.Sorted += new System.EventHandler(this.dtForms_Sorted);
            // 
            // WorkOrder
            // 
            this.WorkOrder.HeaderText = "Radni nalog";
            this.WorkOrder.MinimumWidth = 6;
            this.WorkOrder.Name = "WorkOrder";
            // 
            // ConstructionSite
            // 
            this.ConstructionSite.HeaderText = "Gradilište";
            this.ConstructionSite.MinimumWidth = 6;
            this.ConstructionSite.Name = "ConstructionSite";
            // 
            // Id
            // 
            this.Id.HeaderText = "Id";
            this.Id.MinimumWidth = 6;
            this.Id.Name = "Id";
            this.Id.Visible = false;
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
            // lblCustomer
            // 
            this.lblCustomer.Font = new System.Drawing.Font("Microsoft Sans Serif", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblCustomer.Location = new System.Drawing.Point(297, 14);
            this.lblCustomer.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblCustomer.Name = "lblCustomer";
            this.lblCustomer.Size = new System.Drawing.Size(1245, 62);
            this.lblCustomer.TabIndex = 10;
            this.lblCustomer.Text = "Naručitelj";
            this.lblCustomer.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblCustomer.UseCompatibleTextRendering = true;
            // 
            // ConstructionsForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1901, 921);
            this.Controls.Add(this.lblCustomer);
            this.Controls.Add(this.btnBack);
            this.Controls.Add(this.pnReports);
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.Margin = new System.Windows.Forms.Padding(4, 2, 4, 2);
            this.MinimumSize = new System.Drawing.Size(1917, 952);
            this.Name = "ConstructionsForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.Manual;
            this.Text = "AIGenerator";
            this.Activated += new System.EventHandler(this.ConstructionsForm_Activated);
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.ReportFillingForm_FormClosed);
            this.Load += new System.EventHandler(this.ReportForm_Load);
            this.Resize += new System.EventHandler(this.ConstructionsForm_Resize);
            this.pnReports.ResumeLayout(false);
            this.pnReports.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbSearch)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.dtForms)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion
        private System.Windows.Forms.Panel pnReports;
        private System.Windows.Forms.Label lblConstructions;
        private System.Windows.Forms.DataGridView dtForms;
        private System.Windows.Forms.Button btnAddNew;
        private System.Windows.Forms.Button btnBack;
        private System.Windows.Forms.Label lblCustomer;
        private System.Windows.Forms.TextBox txtSearch;
        private System.Windows.Forms.PictureBox pbSearch;
        private System.Windows.Forms.DataGridViewTextBoxColumn WorkOrder;
        private System.Windows.Forms.DataGridViewTextBoxColumn ConstructionSite;
        private System.Windows.Forms.DataGridViewTextBoxColumn Id;
    }
}