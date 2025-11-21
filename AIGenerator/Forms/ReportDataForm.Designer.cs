namespace AIGenerator.Forms
{
    partial class ReportDataForm
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
            this.lblClearFilter = new System.Windows.Forms.Label();
            this.btnFilter = new System.Windows.Forms.Button();
            this.btnSavePDF = new System.Windows.Forms.Button();
            this.btnAddNew = new System.Windows.Forms.Button();
            this.lblForms = new System.Windows.Forms.Label();
            this.dtForms = new System.Windows.Forms.DataGridView();
            this.Stock = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Method = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.ExaminationDate = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Satisfies = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Id = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.btnBack = new System.Windows.Forms.Button();
            this.lblCustomer = new System.Windows.Forms.Label();
            this.lblConstruction = new System.Windows.Forms.Label();
            this.btnCloseConstruction = new System.Windows.Forms.Button();
            this.btnReports = new System.Windows.Forms.Button();
            this.lblConstructionClosed = new System.Windows.Forms.Label();
            this.pnReports.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.dtForms)).BeginInit();
            this.SuspendLayout();
            // 
            // pnReports
            // 
            this.pnReports.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnReports.Controls.Add(this.lblClearFilter);
            this.pnReports.Controls.Add(this.btnFilter);
            this.pnReports.Controls.Add(this.btnSavePDF);
            this.pnReports.Controls.Add(this.btnAddNew);
            this.pnReports.Controls.Add(this.lblForms);
            this.pnReports.Controls.Add(this.dtForms);
            this.pnReports.Location = new System.Drawing.Point(16, 121);
            this.pnReports.Margin = new System.Windows.Forms.Padding(4);
            this.pnReports.Name = "pnReports";
            this.pnReports.Size = new System.Drawing.Size(1869, 785);
            this.pnReports.TabIndex = 5;
            this.pnReports.Paint += new System.Windows.Forms.PaintEventHandler(this.pnReports_Paint);
            // 
            // lblClearFilter
            // 
            this.lblClearFilter.AutoSize = true;
            this.lblClearFilter.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Underline, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblClearFilter.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(0)))), ((int)(((byte)(0)))), ((int)(((byte)(192)))));
            this.lblClearFilter.Location = new System.Drawing.Point(885, 27);
            this.lblClearFilter.Name = "lblClearFilter";
            this.lblClearFilter.Size = new System.Drawing.Size(115, 26);
            this.lblClearFilter.TabIndex = 74;
            this.lblClearFilter.Text = "Očisti filter";
            this.lblClearFilter.Visible = false;
            this.lblClearFilter.Click += new System.EventHandler(this.lblClearFilter_Click);
            // 
            // btnFilter
            // 
            this.btnFilter.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.btnFilter.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnFilter.Location = new System.Drawing.Point(1006, 11);
            this.btnFilter.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnFilter.Name = "btnFilter";
            this.btnFilter.Size = new System.Drawing.Size(275, 55);
            this.btnFilter.TabIndex = 73;
            this.btnFilter.Text = "Filter";
            this.btnFilter.UseVisualStyleBackColor = true;
            this.btnFilter.Click += new System.EventHandler(this.btnFilter_Click);
            // 
            // btnSavePDF
            // 
            this.btnSavePDF.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.btnSavePDF.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnSavePDF.Location = new System.Drawing.Point(1287, 11);
            this.btnSavePDF.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnSavePDF.Name = "btnSavePDF";
            this.btnSavePDF.Size = new System.Drawing.Size(275, 55);
            this.btnSavePDF.TabIndex = 72;
            this.btnSavePDF.Text = "Spremi kao PDF";
            this.btnSavePDF.UseVisualStyleBackColor = true;
            this.btnSavePDF.Click += new System.EventHandler(this.btnSavePDF_Click);
            // 
            // btnAddNew
            // 
            this.btnAddNew.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.btnAddNew.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnAddNew.Location = new System.Drawing.Point(1568, 11);
            this.btnAddNew.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnAddNew.Name = "btnAddNew";
            this.btnAddNew.Size = new System.Drawing.Size(275, 55);
            this.btnAddNew.TabIndex = 71;
            this.btnAddNew.Text = "Dodaj obrazac";
            this.btnAddNew.UseVisualStyleBackColor = true;
            this.btnAddNew.Click += new System.EventHandler(this.btnAddNew_Click);
            // 
            // lblForms
            // 
            this.lblForms.Font = new System.Drawing.Font("Trebuchet MS", 18F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblForms.Location = new System.Drawing.Point(24, 17);
            this.lblForms.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblForms.Name = "lblForms";
            this.lblForms.Size = new System.Drawing.Size(407, 42);
            this.lblForms.TabIndex = 3;
            this.lblForms.Text = "Obrazci";
            this.lblForms.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblForms.UseCompatibleTextRendering = true;
            // 
            // dtForms
            // 
            this.dtForms.AllowDrop = true;
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
            this.Stock,
            this.Method,
            this.ExaminationDate,
            this.Satisfies,
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
            this.dtForms.DragDrop += new System.Windows.Forms.DragEventHandler(this.dtForms_DragDrop);
            this.dtForms.DragOver += new System.Windows.Forms.DragEventHandler(this.dtForms_DragOver);
            this.dtForms.MouseDown += new System.Windows.Forms.MouseEventHandler(this.dtForms_MouseDown);
            this.dtForms.MouseMove += new System.Windows.Forms.MouseEventHandler(this.dtForms_MouseMove);
            // 
            // Stock
            // 
            this.Stock.HeaderText = "Dionica";
            this.Stock.MinimumWidth = 6;
            this.Stock.Name = "Stock";
            // 
            // Method
            // 
            this.Method.FillWeight = 132.3175F;
            this.Method.HeaderText = "Metoda";
            this.Method.MinimumWidth = 150;
            this.Method.Name = "Method";
            // 
            // ExaminationDate
            // 
            this.ExaminationDate.FillWeight = 43.97796F;
            this.ExaminationDate.HeaderText = "Datum ispitivanja";
            this.ExaminationDate.MinimumWidth = 150;
            this.ExaminationDate.Name = "ExaminationDate";
            // 
            // Satisfies
            // 
            this.Satisfies.FillWeight = 35.01329F;
            this.Satisfies.HeaderText = "Zadovoljava";
            this.Satisfies.MinimumWidth = 6;
            this.Satisfies.Name = "Satisfies";
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
            this.lblCustomer.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblCustomer.Location = new System.Drawing.Point(299, 14);
            this.lblCustomer.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblCustomer.Name = "lblCustomer";
            this.lblCustomer.Size = new System.Drawing.Size(807, 46);
            this.lblCustomer.TabIndex = 11;
            this.lblCustomer.Text = "Naručitelj";
            this.lblCustomer.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblCustomer.UseCompatibleTextRendering = true;
            // 
            // lblConstruction
            // 
            this.lblConstruction.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblConstruction.Location = new System.Drawing.Point(299, 60);
            this.lblConstruction.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblConstruction.Name = "lblConstruction";
            this.lblConstruction.Size = new System.Drawing.Size(807, 46);
            this.lblConstruction.TabIndex = 12;
            this.lblConstruction.Text = "Naručitelj";
            this.lblConstruction.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblConstruction.UseCompatibleTextRendering = true;
            // 
            // btnCloseConstruction
            // 
            this.btnCloseConstruction.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnCloseConstruction.Location = new System.Drawing.Point(1329, 14);
            this.btnCloseConstruction.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnCloseConstruction.Name = "btnCloseConstruction";
            this.btnCloseConstruction.Size = new System.Drawing.Size(275, 62);
            this.btnCloseConstruction.TabIndex = 13;
            this.btnCloseConstruction.Text = "Arhiviraj gradilište";
            this.btnCloseConstruction.UseVisualStyleBackColor = true;
            this.btnCloseConstruction.Visible = false;
            this.btnCloseConstruction.Click += new System.EventHandler(this.btnCloseConstruction_Click);
            // 
            // btnReports
            // 
            this.btnReports.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnReports.Location = new System.Drawing.Point(1611, 14);
            this.btnReports.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnReports.Name = "btnReports";
            this.btnReports.Size = new System.Drawing.Size(275, 62);
            this.btnReports.TabIndex = 14;
            this.btnReports.Text = "Izvještaji";
            this.btnReports.UseVisualStyleBackColor = true;
            this.btnReports.Click += new System.EventHandler(this.btnReports_Click);
            // 
            // lblConstructionClosed
            // 
            this.lblConstructionClosed.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblConstructionClosed.Location = new System.Drawing.Point(1172, 14);
            this.lblConstructionClosed.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblConstructionClosed.Name = "lblConstructionClosed";
            this.lblConstructionClosed.Size = new System.Drawing.Size(432, 62);
            this.lblConstructionClosed.TabIndex = 67;
            this.lblConstructionClosed.Text = "Gradilište je arhivirano";
            this.lblConstructionClosed.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblConstructionClosed.UseCompatibleTextRendering = true;
            this.lblConstructionClosed.Visible = false;
            // 
            // ReportDataForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1901, 921);
            this.Controls.Add(this.btnReports);
            this.Controls.Add(this.lblConstruction);
            this.Controls.Add(this.lblCustomer);
            this.Controls.Add(this.btnBack);
            this.Controls.Add(this.pnReports);
            this.Controls.Add(this.btnCloseConstruction);
            this.Controls.Add(this.lblConstructionClosed);
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.Margin = new System.Windows.Forms.Padding(4, 2, 4, 2);
            this.MinimumSize = new System.Drawing.Size(1917, 953);
            this.Name = "ReportDataForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.Manual;
            this.Text = "AIGenerator";
            this.Activated += new System.EventHandler(this.ReportDataForm_Activated);
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.ReportFillingForm_FormClosed);
            this.Load += new System.EventHandler(this.ReportForm_Load);
            this.Resize += new System.EventHandler(this.ReportDataForm_Resize);
            this.pnReports.ResumeLayout(false);
            this.pnReports.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.dtForms)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion
        private System.Windows.Forms.Panel pnReports;
        private System.Windows.Forms.Label lblForms;
        private System.Windows.Forms.DataGridView dtForms;
        private System.Windows.Forms.Button btnAddNew;
        private System.Windows.Forms.Button btnBack;
        private System.Windows.Forms.Label lblCustomer;
        private System.Windows.Forms.Label lblConstruction;
        private System.Windows.Forms.Button btnCloseConstruction;
        private System.Windows.Forms.DataGridViewTextBoxColumn Stock;
        private System.Windows.Forms.DataGridViewTextBoxColumn Method;
        private System.Windows.Forms.DataGridViewTextBoxColumn ExaminationDate;
        private System.Windows.Forms.DataGridViewTextBoxColumn Satisfies;
        private System.Windows.Forms.DataGridViewTextBoxColumn Id;
        private System.Windows.Forms.Button btnReports;
        private System.Windows.Forms.Label lblConstructionClosed;
        private System.Windows.Forms.Button btnSavePDF;
        private System.Windows.Forms.Label lblClearFilter;
        private System.Windows.Forms.Button btnFilter;
    }
}