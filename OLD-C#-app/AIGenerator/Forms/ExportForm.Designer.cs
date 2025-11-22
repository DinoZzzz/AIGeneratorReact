namespace AIGenerator.Forms
{
    partial class ExportForm
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
            this.txtConstructionPart = new System.Windows.Forms.TextBox();
            this.lblConstructionPart = new System.Windows.Forms.Label();
            this.btnSave = new System.Windows.Forms.Button();
            this.btnCertify = new System.Windows.Forms.Button();
            this.btnGenerate = new System.Windows.Forms.Button();
            this.pnReports = new System.Windows.Forms.Panel();
            this.btnAddNew = new System.Windows.Forms.Button();
            this.lblForms = new System.Windows.Forms.Label();
            this.dtForms = new System.Windows.Forms.DataGridView();
            this.Stock = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Method = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.ExaminationDate = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Satisfies = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Id = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.dtExaminationDate = new System.Windows.Forms.DateTimePicker();
            this.lblExaminationDate = new System.Windows.Forms.Label();
            this.txtDrainage = new System.Windows.Forms.TextBox();
            this.lblDrainage = new System.Windows.Forms.Label();
            this.gbWater = new System.Windows.Forms.GroupBox();
            this.txtWaterDeviation = new System.Windows.Forms.TextBox();
            this.lblWaterDeviation = new System.Windows.Forms.Label();
            this.txtWaterRemark = new System.Windows.Forms.TextBox();
            this.lblWaterRemark = new System.Windows.Forms.Label();
            this.gbInfo = new System.Windows.Forms.GroupBox();
            this.cbCertifier = new System.Windows.Forms.ComboBox();
            this.lblCertifier = new System.Windows.Forms.Label();
            this.gbAir = new System.Windows.Forms.GroupBox();
            this.txtAirDeviation = new System.Windows.Forms.TextBox();
            this.lblAirDeviation = new System.Windows.Forms.Label();
            this.txtAirRemark = new System.Windows.Forms.TextBox();
            this.lblAirRemark = new System.Windows.Forms.Label();
            this.btnPhotos = new System.Windows.Forms.Button();
            this.pnReports.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.dtForms)).BeginInit();
            this.gbWater.SuspendLayout();
            this.gbInfo.SuspendLayout();
            this.gbAir.SuspendLayout();
            this.SuspendLayout();
            // 
            // txtConstructionPart
            // 
            this.txtConstructionPart.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtConstructionPart.Location = new System.Drawing.Point(241, 18);
            this.txtConstructionPart.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.txtConstructionPart.Name = "txtConstructionPart";
            this.txtConstructionPart.Size = new System.Drawing.Size(435, 31);
            this.txtConstructionPart.TabIndex = 2;
            // 
            // lblConstructionPart
            // 
            this.lblConstructionPart.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblConstructionPart.Location = new System.Drawing.Point(8, 21);
            this.lblConstructionPart.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblConstructionPart.Name = "lblConstructionPart";
            this.lblConstructionPart.Size = new System.Drawing.Size(227, 31);
            this.lblConstructionPart.TabIndex = 60;
            this.lblConstructionPart.Text = "Dio građevine:";
            this.lblConstructionPart.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblConstructionPart.UseCompatibleTextRendering = true;
            // 
            // btnSave
            // 
            this.btnSave.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnSave.Location = new System.Drawing.Point(16, 14);
            this.btnSave.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnSave.Name = "btnSave";
            this.btnSave.Size = new System.Drawing.Size(275, 62);
            this.btnSave.TabIndex = 16;
            this.btnSave.Text = "Spremi i završi";
            this.btnSave.UseVisualStyleBackColor = true;
            this.btnSave.Click += new System.EventHandler(this.btnSave_Click);
            // 
            // btnCertify
            // 
            this.btnCertify.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.btnCertify.Font = new System.Drawing.Font("Trebuchet MS", 13.8F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnCertify.Location = new System.Drawing.Point(1613, 14);
            this.btnCertify.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnCertify.Name = "btnCertify";
            this.btnCertify.Size = new System.Drawing.Size(275, 62);
            this.btnCertify.TabIndex = 11;
            this.btnCertify.Text = "Ovjeri";
            this.btnCertify.UseVisualStyleBackColor = true;
            this.btnCertify.Visible = false;
            this.btnCertify.Click += new System.EventHandler(this.btnCertify_Click);
            // 
            // btnGenerate
            // 
            this.btnGenerate.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnGenerate.Location = new System.Drawing.Point(1615, 14);
            this.btnGenerate.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnGenerate.Name = "btnGenerate";
            this.btnGenerate.Size = new System.Drawing.Size(275, 62);
            this.btnGenerate.TabIndex = 12;
            this.btnGenerate.Text = "Generiraj izvještaj";
            this.btnGenerate.UseVisualStyleBackColor = true;
            this.btnGenerate.Visible = false;
            this.btnGenerate.Click += new System.EventHandler(this.btnGenerate_Click);
            // 
            // pnReports
            // 
            this.pnReports.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnReports.Controls.Add(this.btnAddNew);
            this.pnReports.Controls.Add(this.lblForms);
            this.pnReports.Controls.Add(this.dtForms);
            this.pnReports.Location = new System.Drawing.Point(16, 437);
            this.pnReports.Margin = new System.Windows.Forms.Padding(4);
            this.pnReports.Name = "pnReports";
            this.pnReports.Size = new System.Drawing.Size(1869, 470);
            this.pnReports.TabIndex = 67;
            this.pnReports.Paint += new System.Windows.Forms.PaintEventHandler(this.pnReports_Paint);
            // 
            // btnAddNew
            // 
            this.btnAddNew.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.btnAddNew.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnAddNew.Location = new System.Drawing.Point(1568, 11);
            this.btnAddNew.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnAddNew.Name = "btnAddNew";
            this.btnAddNew.Size = new System.Drawing.Size(275, 55);
            this.btnAddNew.TabIndex = 13;
            this.btnAddNew.Text = "Dodaj obrazce";
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
            this.dtForms.Size = new System.Drawing.Size(1819, 384);
            this.dtForms.TabIndex = 14;
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
            // dtExaminationDate
            // 
            this.dtExaminationDate.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.dtExaminationDate.Location = new System.Drawing.Point(243, 126);
            this.dtExaminationDate.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.dtExaminationDate.Name = "dtExaminationDate";
            this.dtExaminationDate.Size = new System.Drawing.Size(324, 31);
            this.dtExaminationDate.TabIndex = 4;
            // 
            // lblExaminationDate
            // 
            this.lblExaminationDate.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblExaminationDate.Location = new System.Drawing.Point(8, 128);
            this.lblExaminationDate.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblExaminationDate.Name = "lblExaminationDate";
            this.lblExaminationDate.Size = new System.Drawing.Size(227, 31);
            this.lblExaminationDate.TabIndex = 69;
            this.lblExaminationDate.Text = "Datum izrade:";
            this.lblExaminationDate.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblExaminationDate.UseCompatibleTextRendering = true;
            // 
            // txtDrainage
            // 
            this.txtDrainage.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtDrainage.Location = new System.Drawing.Point(11, 207);
            this.txtDrainage.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.txtDrainage.Multiline = true;
            this.txtDrainage.Name = "txtDrainage";
            this.txtDrainage.Size = new System.Drawing.Size(665, 110);
            this.txtDrainage.TabIndex = 5;
            // 
            // lblDrainage
            // 
            this.lblDrainage.AutoSize = true;
            this.lblDrainage.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblDrainage.Location = new System.Drawing.Point(12, 171);
            this.lblDrainage.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblDrainage.Name = "lblDrainage";
            this.lblDrainage.Size = new System.Drawing.Size(221, 29);
            this.lblDrainage.TabIndex = 70;
            this.lblDrainage.Text = "Opis i stanje odvodnje:";
            this.lblDrainage.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblDrainage.UseCompatibleTextRendering = true;
            // 
            // gbWater
            // 
            this.gbWater.Controls.Add(this.txtWaterDeviation);
            this.gbWater.Controls.Add(this.lblWaterDeviation);
            this.gbWater.Controls.Add(this.txtWaterRemark);
            this.gbWater.Controls.Add(this.lblWaterRemark);
            this.gbWater.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.gbWater.Location = new System.Drawing.Point(717, 91);
            this.gbWater.Margin = new System.Windows.Forms.Padding(4);
            this.gbWater.Name = "gbWater";
            this.gbWater.Padding = new System.Windows.Forms.Padding(4);
            this.gbWater.Size = new System.Drawing.Size(580, 329);
            this.gbWater.TabIndex = 6;
            this.gbWater.TabStop = false;
            this.gbWater.Text = "Metoda voda";
            // 
            // txtWaterDeviation
            // 
            this.txtWaterDeviation.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtWaterDeviation.Location = new System.Drawing.Point(12, 207);
            this.txtWaterDeviation.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.txtWaterDeviation.Multiline = true;
            this.txtWaterDeviation.Name = "txtWaterDeviation";
            this.txtWaterDeviation.Size = new System.Drawing.Size(556, 91);
            this.txtWaterDeviation.TabIndex = 8;
            // 
            // lblWaterDeviation
            // 
            this.lblWaterDeviation.AutoSize = true;
            this.lblWaterDeviation.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblWaterDeviation.Location = new System.Drawing.Point(12, 171);
            this.lblWaterDeviation.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblWaterDeviation.Name = "lblWaterDeviation";
            this.lblWaterDeviation.Size = new System.Drawing.Size(214, 29);
            this.lblWaterDeviation.TabIndex = 74;
            this.lblWaterDeviation.Text = "Odstupanje od norme:";
            this.lblWaterDeviation.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblWaterDeviation.UseCompatibleTextRendering = true;
            // 
            // txtWaterRemark
            // 
            this.txtWaterRemark.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtWaterRemark.Location = new System.Drawing.Point(12, 74);
            this.txtWaterRemark.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.txtWaterRemark.Multiline = true;
            this.txtWaterRemark.Name = "txtWaterRemark";
            this.txtWaterRemark.Size = new System.Drawing.Size(556, 91);
            this.txtWaterRemark.TabIndex = 7;
            // 
            // lblWaterRemark
            // 
            this.lblWaterRemark.AutoSize = true;
            this.lblWaterRemark.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblWaterRemark.Location = new System.Drawing.Point(12, 42);
            this.lblWaterRemark.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblWaterRemark.Name = "lblWaterRemark";
            this.lblWaterRemark.Size = new System.Drawing.Size(112, 29);
            this.lblWaterRemark.TabIndex = 72;
            this.lblWaterRemark.Text = "Napomena:";
            this.lblWaterRemark.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblWaterRemark.UseCompatibleTextRendering = true;
            // 
            // gbInfo
            // 
            this.gbInfo.Controls.Add(this.cbCertifier);
            this.gbInfo.Controls.Add(this.lblCertifier);
            this.gbInfo.Controls.Add(this.lblDrainage);
            this.gbInfo.Controls.Add(this.txtDrainage);
            this.gbInfo.Controls.Add(this.txtConstructionPart);
            this.gbInfo.Controls.Add(this.dtExaminationDate);
            this.gbInfo.Controls.Add(this.lblConstructionPart);
            this.gbInfo.Controls.Add(this.lblExaminationDate);
            this.gbInfo.Location = new System.Drawing.Point(16, 91);
            this.gbInfo.Margin = new System.Windows.Forms.Padding(4);
            this.gbInfo.Name = "gbInfo";
            this.gbInfo.Padding = new System.Windows.Forms.Padding(4);
            this.gbInfo.Size = new System.Drawing.Size(693, 329);
            this.gbInfo.TabIndex = 1;
            this.gbInfo.TabStop = false;
            // 
            // cbCertifier
            // 
            this.cbCertifier.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbCertifier.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.cbCertifier.FormattingEnabled = true;
            this.cbCertifier.Items.AddRange(new object[] {
            "Marijan Jažić mag.ing.aedif.",
            "Tomislav Vuković bacc.ing.aedif."});
            this.cbCertifier.Location = new System.Drawing.Point(241, 71);
            this.cbCertifier.Margin = new System.Windows.Forms.Padding(4);
            this.cbCertifier.Name = "cbCertifier";
            this.cbCertifier.Size = new System.Drawing.Size(435, 34);
            this.cbCertifier.TabIndex = 3;
            // 
            // lblCertifier
            // 
            this.lblCertifier.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblCertifier.Location = new System.Drawing.Point(8, 74);
            this.lblCertifier.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblCertifier.Name = "lblCertifier";
            this.lblCertifier.Size = new System.Drawing.Size(227, 31);
            this.lblCertifier.TabIndex = 71;
            this.lblCertifier.Text = "Ovjerio:";
            this.lblCertifier.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblCertifier.UseCompatibleTextRendering = true;
            // 
            // gbAir
            // 
            this.gbAir.Controls.Add(this.txtAirDeviation);
            this.gbAir.Controls.Add(this.lblAirDeviation);
            this.gbAir.Controls.Add(this.txtAirRemark);
            this.gbAir.Controls.Add(this.lblAirRemark);
            this.gbAir.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.gbAir.Location = new System.Drawing.Point(1305, 91);
            this.gbAir.Margin = new System.Windows.Forms.Padding(4);
            this.gbAir.Name = "gbAir";
            this.gbAir.Padding = new System.Windows.Forms.Padding(4);
            this.gbAir.Size = new System.Drawing.Size(580, 329);
            this.gbAir.TabIndex = 9;
            this.gbAir.TabStop = false;
            this.gbAir.Text = "Metoda zrak";
            // 
            // txtAirDeviation
            // 
            this.txtAirDeviation.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtAirDeviation.Location = new System.Drawing.Point(12, 207);
            this.txtAirDeviation.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.txtAirDeviation.Multiline = true;
            this.txtAirDeviation.Name = "txtAirDeviation";
            this.txtAirDeviation.Size = new System.Drawing.Size(556, 91);
            this.txtAirDeviation.TabIndex = 11;
            // 
            // lblAirDeviation
            // 
            this.lblAirDeviation.AutoSize = true;
            this.lblAirDeviation.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblAirDeviation.Location = new System.Drawing.Point(12, 171);
            this.lblAirDeviation.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblAirDeviation.Name = "lblAirDeviation";
            this.lblAirDeviation.Size = new System.Drawing.Size(214, 29);
            this.lblAirDeviation.TabIndex = 74;
            this.lblAirDeviation.Text = "Odstupanje od norme:";
            this.lblAirDeviation.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblAirDeviation.UseCompatibleTextRendering = true;
            // 
            // txtAirRemark
            // 
            this.txtAirRemark.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtAirRemark.Location = new System.Drawing.Point(12, 74);
            this.txtAirRemark.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.txtAirRemark.Multiline = true;
            this.txtAirRemark.Name = "txtAirRemark";
            this.txtAirRemark.Size = new System.Drawing.Size(556, 91);
            this.txtAirRemark.TabIndex = 10;
            // 
            // lblAirRemark
            // 
            this.lblAirRemark.AutoSize = true;
            this.lblAirRemark.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblAirRemark.Location = new System.Drawing.Point(12, 42);
            this.lblAirRemark.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblAirRemark.Name = "lblAirRemark";
            this.lblAirRemark.Size = new System.Drawing.Size(112, 29);
            this.lblAirRemark.TabIndex = 72;
            this.lblAirRemark.Text = "Napomena:";
            this.lblAirRemark.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblAirRemark.UseCompatibleTextRendering = true;
            // 
            // btnPhotos
            // 
            this.btnPhotos.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnPhotos.Location = new System.Drawing.Point(297, 14);
            this.btnPhotos.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnPhotos.Name = "btnPhotos";
            this.btnPhotos.Size = new System.Drawing.Size(275, 62);
            this.btnPhotos.TabIndex = 15;
            this.btnPhotos.Text = "Slike";
            this.btnPhotos.UseVisualStyleBackColor = true;
            this.btnPhotos.Click += new System.EventHandler(this.btnPhotos_Click);
            // 
            // ExportForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1901, 921);
            this.Controls.Add(this.btnPhotos);
            this.Controls.Add(this.gbAir);
            this.Controls.Add(this.gbInfo);
            this.Controls.Add(this.gbWater);
            this.Controls.Add(this.pnReports);
            this.Controls.Add(this.btnSave);
            this.Controls.Add(this.btnGenerate);
            this.Controls.Add(this.btnCertify);
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.Margin = new System.Windows.Forms.Padding(4, 2, 4, 2);
            this.MinimumSize = new System.Drawing.Size(1917, 950);
            this.Name = "ExportForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.Manual;
            this.Text = "AIGenerator";
            this.Activated += new System.EventHandler(this.ExportForm_Activated);
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.ExportForm_FormClosed);
            this.Load += new System.EventHandler(this.ExportForm_Load);
            this.Resize += new System.EventHandler(this.ExportForm_Resize);
            this.pnReports.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.dtForms)).EndInit();
            this.gbWater.ResumeLayout(false);
            this.gbWater.PerformLayout();
            this.gbInfo.ResumeLayout(false);
            this.gbInfo.PerformLayout();
            this.gbAir.ResumeLayout(false);
            this.gbAir.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.TextBox txtConstructionPart;
        private System.Windows.Forms.Label lblConstructionPart;
        private System.Windows.Forms.Button btnSave;
        private System.Windows.Forms.Button btnCertify;
        private System.Windows.Forms.Button btnGenerate;
        private System.Windows.Forms.Panel pnReports;
        private System.Windows.Forms.Button btnAddNew;
        private System.Windows.Forms.Label lblForms;
        private System.Windows.Forms.DataGridView dtForms;
        private System.Windows.Forms.DataGridViewTextBoxColumn Stock;
        private System.Windows.Forms.DataGridViewTextBoxColumn Method;
        private System.Windows.Forms.DataGridViewTextBoxColumn ExaminationDate;
        private System.Windows.Forms.DataGridViewTextBoxColumn Satisfies;
        private System.Windows.Forms.DataGridViewTextBoxColumn Id;
        private System.Windows.Forms.DateTimePicker dtExaminationDate;
        private System.Windows.Forms.Label lblExaminationDate;
        private System.Windows.Forms.TextBox txtDrainage;
        private System.Windows.Forms.Label lblDrainage;
        private System.Windows.Forms.GroupBox gbWater;
        private System.Windows.Forms.TextBox txtWaterDeviation;
        private System.Windows.Forms.Label lblWaterDeviation;
        private System.Windows.Forms.TextBox txtWaterRemark;
        private System.Windows.Forms.Label lblWaterRemark;
        private System.Windows.Forms.GroupBox gbInfo;
        private System.Windows.Forms.GroupBox gbAir;
        private System.Windows.Forms.TextBox txtAirDeviation;
        private System.Windows.Forms.Label lblAirDeviation;
        private System.Windows.Forms.TextBox txtAirRemark;
        private System.Windows.Forms.Label lblAirRemark;
        private System.Windows.Forms.Button btnPhotos;
        private System.Windows.Forms.ComboBox cbCertifier;
        private System.Windows.Forms.Label lblCertifier;
    }
}