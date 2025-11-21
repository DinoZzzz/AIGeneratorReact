namespace AIGenerator.Dialogs
{
    partial class FormsFilterDialog
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
            this.txtStock = new System.Windows.Forms.TextBox();
            this.lblStock = new System.Windows.Forms.Label();
            this.btnFilter = new System.Windows.Forms.Button();
            this.lblStartDate = new System.Windows.Forms.Label();
            this.dtStartDate = new System.Windows.Forms.DateTimePicker();
            this.lblEndDate = new System.Windows.Forms.Label();
            this.dtEndDate = new System.Windows.Forms.DateTimePicker();
            this.gbDate = new System.Windows.Forms.GroupBox();
            this.lblExaminer = new System.Windows.Forms.Label();
            this.lblFilter = new System.Windows.Forms.Label();
            this.cbExaminers = new System.Windows.Forms.ComboBox();
            this.cbType = new System.Windows.Forms.ComboBox();
            this.lblType = new System.Windows.Forms.Label();
            this.gbDate.SuspendLayout();
            this.SuspendLayout();
            // 
            // txtStock
            // 
            this.txtStock.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtStock.Location = new System.Drawing.Point(123, 119);
            this.txtStock.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.txtStock.Name = "txtStock";
            this.txtStock.Size = new System.Drawing.Size(447, 31);
            this.txtStock.TabIndex = 1;
            // 
            // lblStock
            // 
            this.lblStock.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblStock.Location = new System.Drawing.Point(13, 120);
            this.lblStock.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblStock.Name = "lblStock";
            this.lblStock.Size = new System.Drawing.Size(103, 31);
            this.lblStock.TabIndex = 6;
            this.lblStock.Text = "Dionica:";
            this.lblStock.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblStock.UseCompatibleTextRendering = true;
            // 
            // btnFilter
            // 
            this.btnFilter.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
            this.btnFilter.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnFilter.Location = new System.Drawing.Point(177, 482);
            this.btnFilter.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnFilter.Name = "btnFilter";
            this.btnFilter.Size = new System.Drawing.Size(275, 55);
            this.btnFilter.TabIndex = 2;
            this.btnFilter.Text = "Filtriraj";
            this.btnFilter.UseVisualStyleBackColor = true;
            this.btnFilter.Click += new System.EventHandler(this.btnFilter_Click);
            // 
            // lblStartDate
            // 
            this.lblStartDate.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblStartDate.Location = new System.Drawing.Point(57, 50);
            this.lblStartDate.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblStartDate.Name = "lblStartDate";
            this.lblStartDate.Size = new System.Drawing.Size(50, 42);
            this.lblStartDate.TabIndex = 36;
            this.lblStartDate.Text = "Od:";
            this.lblStartDate.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblStartDate.UseCompatibleTextRendering = true;
            // 
            // dtStartDate
            // 
            this.dtStartDate.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.dtStartDate.Location = new System.Drawing.Point(115, 54);
            this.dtStartDate.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.dtStartDate.Name = "dtStartDate";
            this.dtStartDate.Size = new System.Drawing.Size(381, 31);
            this.dtStartDate.TabIndex = 35;
            this.dtStartDate.ValueChanged += new System.EventHandler(this.dtStartDate_ValueChanged);
            // 
            // lblEndDate
            // 
            this.lblEndDate.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblEndDate.Location = new System.Drawing.Point(57, 92);
            this.lblEndDate.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblEndDate.Name = "lblEndDate";
            this.lblEndDate.Size = new System.Drawing.Size(50, 42);
            this.lblEndDate.TabIndex = 38;
            this.lblEndDate.Text = "Do:";
            this.lblEndDate.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblEndDate.UseCompatibleTextRendering = true;
            // 
            // dtEndDate
            // 
            this.dtEndDate.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.dtEndDate.Location = new System.Drawing.Point(115, 96);
            this.dtEndDate.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.dtEndDate.Name = "dtEndDate";
            this.dtEndDate.Size = new System.Drawing.Size(381, 31);
            this.dtEndDate.TabIndex = 37;
            // 
            // gbDate
            // 
            this.gbDate.Controls.Add(this.lblStartDate);
            this.gbDate.Controls.Add(this.lblEndDate);
            this.gbDate.Controls.Add(this.dtStartDate);
            this.gbDate.Controls.Add(this.dtEndDate);
            this.gbDate.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.gbDate.Location = new System.Drawing.Point(27, 270);
            this.gbDate.Name = "gbDate";
            this.gbDate.Size = new System.Drawing.Size(556, 164);
            this.gbDate.TabIndex = 39;
            this.gbDate.TabStop = false;
            this.gbDate.Text = "Datum:";
            // 
            // lblExaminer
            // 
            this.lblExaminer.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblExaminer.Location = new System.Drawing.Point(13, 170);
            this.lblExaminer.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblExaminer.Name = "lblExaminer";
            this.lblExaminer.Size = new System.Drawing.Size(103, 31);
            this.lblExaminer.TabIndex = 40;
            this.lblExaminer.Text = "Ispitivač:";
            this.lblExaminer.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblExaminer.UseCompatibleTextRendering = true;
            // 
            // lblFilter
            // 
            this.lblFilter.Font = new System.Drawing.Font("Trebuchet MS", 18F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblFilter.Location = new System.Drawing.Point(13, 30);
            this.lblFilter.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblFilter.Name = "lblFilter";
            this.lblFilter.Size = new System.Drawing.Size(609, 42);
            this.lblFilter.TabIndex = 41;
            this.lblFilter.Text = "Filter obrazaca";
            this.lblFilter.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this.lblFilter.UseCompatibleTextRendering = true;
            // 
            // cbExaminers
            // 
            this.cbExaminers.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbExaminers.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.cbExaminers.FormattingEnabled = true;
            this.cbExaminers.Location = new System.Drawing.Point(123, 169);
            this.cbExaminers.Name = "cbExaminers";
            this.cbExaminers.Size = new System.Drawing.Size(447, 34);
            this.cbExaminers.TabIndex = 42;
            // 
            // cbType
            // 
            this.cbType.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbType.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.cbType.FormattingEnabled = true;
            this.cbType.Location = new System.Drawing.Point(123, 219);
            this.cbType.Name = "cbType";
            this.cbType.Size = new System.Drawing.Size(447, 34);
            this.cbType.TabIndex = 44;
            // 
            // lblType
            // 
            this.lblType.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblType.Location = new System.Drawing.Point(13, 220);
            this.lblType.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblType.Name = "lblType";
            this.lblType.Size = new System.Drawing.Size(103, 31);
            this.lblType.TabIndex = 43;
            this.lblType.Text = "Metoda:";
            this.lblType.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblType.UseCompatibleTextRendering = true;
            // 
            // FormsFilterDialog
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(635, 547);
            this.Controls.Add(this.cbType);
            this.Controls.Add(this.lblType);
            this.Controls.Add(this.cbExaminers);
            this.Controls.Add(this.lblFilter);
            this.Controls.Add(this.lblExaminer);
            this.Controls.Add(this.gbDate);
            this.Controls.Add(this.btnFilter);
            this.Controls.Add(this.txtStock);
            this.Controls.Add(this.lblStock);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.Name = "FormsFilterDialog";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Filter";
            this.Load += new System.EventHandler(this.FormsFilterDialog_Load);
            this.gbDate.ResumeLayout(false);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.TextBox txtStock;
        private System.Windows.Forms.Label lblStock;
        private System.Windows.Forms.Button btnFilter;
        private System.Windows.Forms.Label lblStartDate;
        private System.Windows.Forms.DateTimePicker dtStartDate;
        private System.Windows.Forms.Label lblEndDate;
        private System.Windows.Forms.DateTimePicker dtEndDate;
        private System.Windows.Forms.GroupBox gbDate;
        private System.Windows.Forms.Label lblExaminer;
        private System.Windows.Forms.Label lblFilter;
        private System.Windows.Forms.ComboBox cbExaminers;
        private System.Windows.Forms.ComboBox cbType;
        private System.Windows.Forms.Label lblType;
    }
}