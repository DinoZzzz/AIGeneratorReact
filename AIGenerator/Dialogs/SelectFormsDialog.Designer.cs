namespace AIGenerator.Dialogs
{
    partial class SelectFormsDialog
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
            this.btnAdd = new System.Windows.Forms.Button();
            this.pnReports = new System.Windows.Forms.Panel();
            this.lblClearFilter = new System.Windows.Forms.Label();
            this.btnFilter = new System.Windows.Forms.Button();
            this.lblForms = new System.Windows.Forms.Label();
            this.dtForms = new System.Windows.Forms.DataGridView();
            this.Stock = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Method = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.ExaminationDate = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Id = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.pnReports.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.dtForms)).BeginInit();
            this.SuspendLayout();
            // 
            // btnAdd
            // 
            this.btnAdd.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnAdd.Location = new System.Drawing.Point(346, 450);
            this.btnAdd.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.btnAdd.Name = "btnAdd";
            this.btnAdd.Size = new System.Drawing.Size(206, 45);
            this.btnAdd.TabIndex = 2;
            this.btnAdd.Text = "Spremi";
            this.btnAdd.UseVisualStyleBackColor = true;
            this.btnAdd.Click += new System.EventHandler(this.btnAdd_Click);
            // 
            // pnReports
            // 
            this.pnReports.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.pnReports.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnReports.Controls.Add(this.lblClearFilter);
            this.pnReports.Controls.Add(this.btnFilter);
            this.pnReports.Controls.Add(this.lblForms);
            this.pnReports.Controls.Add(this.dtForms);
            this.pnReports.Location = new System.Drawing.Point(10, 11);
            this.pnReports.Name = "pnReports";
            this.pnReports.Size = new System.Drawing.Size(869, 429);
            this.pnReports.TabIndex = 6;
            // 
            // lblClearFilter
            // 
            this.lblClearFilter.AutoSize = true;
            this.lblClearFilter.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Underline, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblClearFilter.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(0)))), ((int)(((byte)(0)))), ((int)(((byte)(192)))));
            this.lblClearFilter.Location = new System.Drawing.Point(552, 22);
            this.lblClearFilter.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.lblClearFilter.Name = "lblClearFilter";
            this.lblClearFilter.Size = new System.Drawing.Size(92, 22);
            this.lblClearFilter.TabIndex = 76;
            this.lblClearFilter.Text = "Očisti filter";
            this.lblClearFilter.Visible = false;
            this.lblClearFilter.Click += new System.EventHandler(this.lblClearFilter_Click);
            // 
            // btnFilter
            // 
            this.btnFilter.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.btnFilter.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnFilter.Location = new System.Drawing.Point(643, 9);
            this.btnFilter.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.btnFilter.Name = "btnFilter";
            this.btnFilter.Size = new System.Drawing.Size(206, 45);
            this.btnFilter.TabIndex = 75;
            this.btnFilter.Text = "Filter";
            this.btnFilter.UseVisualStyleBackColor = true;
            this.btnFilter.Click += new System.EventHandler(this.btnFilter_Click);
            // 
            // lblForms
            // 
            this.lblForms.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblForms.Location = new System.Drawing.Point(18, 14);
            this.lblForms.Name = "lblForms";
            this.lblForms.Size = new System.Drawing.Size(501, 34);
            this.lblForms.TabIndex = 3;
            this.lblForms.Text = "Odaberite obrazce koje želite dodati na izvještaj";
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
            this.Id});
            this.dtForms.EditMode = System.Windows.Forms.DataGridViewEditMode.EditProgrammatically;
            this.dtForms.Location = new System.Drawing.Point(18, 59);
            this.dtForms.Name = "dtForms";
            this.dtForms.RowHeadersVisible = false;
            this.dtForms.RowHeadersWidth = 51;
            this.dtForms.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
            this.dtForms.Size = new System.Drawing.Size(831, 360);
            this.dtForms.TabIndex = 1;
            this.dtForms.Scroll += new System.Windows.Forms.ScrollEventHandler(this.dtForms_Scroll);
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
            // Id
            // 
            this.Id.HeaderText = "Id";
            this.Id.MinimumWidth = 6;
            this.Id.Name = "Id";
            this.Id.Visible = false;
            // 
            // SelectFormsDialog
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(886, 505);
            this.Controls.Add(this.pnReports);
            this.Controls.Add(this.btnAdd);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.Name = "SelectFormsDialog";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Odaberite obrazce";
            this.Load += new System.EventHandler(this.SelectFormsDialog_Load);
            this.pnReports.ResumeLayout(false);
            this.pnReports.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.dtForms)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion
        private System.Windows.Forms.Button btnAdd;
        private System.Windows.Forms.Panel pnReports;
        private System.Windows.Forms.Label lblForms;
        private System.Windows.Forms.DataGridView dtForms;
        private System.Windows.Forms.DataGridViewTextBoxColumn Stock;
        private System.Windows.Forms.DataGridViewTextBoxColumn Method;
        private System.Windows.Forms.DataGridViewTextBoxColumn ExaminationDate;
        private System.Windows.Forms.DataGridViewTextBoxColumn Id;
        private System.Windows.Forms.Label lblClearFilter;
        private System.Windows.Forms.Button btnFilter;
    }
}