namespace AIGenerator.Forms
{
    partial class PlatformForm
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
            System.Windows.Forms.DataVisualization.Charting.ChartArea chartArea1 = new System.Windows.Forms.DataVisualization.Charting.ChartArea();
            System.Windows.Forms.DataVisualization.Charting.Legend legend1 = new System.Windows.Forms.DataVisualization.Charting.Legend();
            System.Windows.Forms.DataVisualization.Charting.Series series1 = new System.Windows.Forms.DataVisualization.Charting.Series();
            this.dtCustomers = new System.Windows.Forms.DataGridView();
            this.Number = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Customer = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.ActiveWorkOrders = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Id = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.pnReports = new System.Windows.Forms.Panel();
            this.pbSearch = new System.Windows.Forms.PictureBox();
            this.txtSearch = new System.Windows.Forms.TextBox();
            this.btnAddNew = new System.Windows.Forms.Button();
            this.lblCustomersTable = new System.Windows.Forms.Label();
            this.lblWelcome = new System.Windows.Forms.Label();
            this.lblInfoText = new System.Windows.Forms.Label();
            this.pnCustomers = new System.Windows.Forms.Panel();
            this.btnCheckAllCustomers = new System.Windows.Forms.Button();
            this.chartCustomers = new System.Windows.Forms.DataVisualization.Charting.Chart();
            this.lblCustomers = new System.Windows.Forms.Label();
            this.pnExaminers = new System.Windows.Forms.Panel();
            this.btnCheckAllExaminers = new System.Windows.Forms.Button();
            this.lblExaminerThreeCount = new System.Windows.Forms.Label();
            this.lblExaminerThree = new System.Windows.Forms.Label();
            this.lblExaminerTwoCount = new System.Windows.Forms.Label();
            this.lblExaminerTwo = new System.Windows.Forms.Label();
            this.lblExaminerOneCount = new System.Windows.Forms.Label();
            this.lblExaminerOne = new System.Windows.Forms.Label();
            this.lblExaminers = new System.Windows.Forms.Label();
            this.pbProfile = new System.Windows.Forms.PictureBox();
            this.pbNotification = new System.Windows.Forms.PictureBox();
            this.menuUserControl1 = new AIGenerator.UserControls.MenuUserControl();
            this.lblName = new System.Windows.Forms.Label();
            ((System.ComponentModel.ISupportInitialize)(this.dtCustomers)).BeginInit();
            this.pnReports.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbSearch)).BeginInit();
            this.pnCustomers.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.chartCustomers)).BeginInit();
            this.pnExaminers.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbProfile)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.pbNotification)).BeginInit();
            this.SuspendLayout();
            // 
            // dtCustomers
            // 
            this.dtCustomers.AllowDrop = true;
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
            this.Number,
            this.Customer,
            this.ActiveWorkOrders,
            this.Id});
            this.dtCustomers.EditMode = System.Windows.Forms.DataGridViewEditMode.EditProgrammatically;
            this.dtCustomers.Location = new System.Drawing.Point(18, 59);
            this.dtCustomers.Margin = new System.Windows.Forms.Padding(2);
            this.dtCustomers.Name = "dtCustomers";
            this.dtCustomers.RowHeadersVisible = false;
            this.dtCustomers.RowHeadersWidth = 51;
            this.dtCustomers.Size = new System.Drawing.Size(1084, 310);
            this.dtCustomers.TabIndex = 1;
            this.dtCustomers.CellClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dtCustomers_CellClick);
            this.dtCustomers.CellDoubleClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dtCustomers_CellDoubleClick);
            this.dtCustomers.Scroll += new System.Windows.Forms.ScrollEventHandler(this.dtCustomers_Scroll);
            this.dtCustomers.Sorted += new System.EventHandler(this.dtCustomers_Sorted);
            // 
            // Number
            // 
            this.Number.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.Number.FillWeight = 10F;
            this.Number.HeaderText = "Broj";
            this.Number.MinimumWidth = 75;
            this.Number.Name = "Number";
            this.Number.Width = 75;
            // 
            // Customer
            // 
            this.Customer.FillWeight = 48.6802F;
            this.Customer.HeaderText = "Naručitelj";
            this.Customer.MinimumWidth = 6;
            this.Customer.Name = "Customer";
            // 
            // ActiveWorkOrders
            // 
            this.ActiveWorkOrders.FillWeight = 48.6802F;
            this.ActiveWorkOrders.HeaderText = "Aktivni Radni Nalozi";
            this.ActiveWorkOrders.MinimumWidth = 6;
            this.ActiveWorkOrders.Name = "ActiveWorkOrders";
            this.ActiveWorkOrders.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
            // 
            // Id
            // 
            this.Id.HeaderText = "Id";
            this.Id.MinimumWidth = 6;
            this.Id.Name = "Id";
            this.Id.Visible = false;
            // 
            // pnReports
            // 
            this.pnReports.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnReports.Controls.Add(this.pbSearch);
            this.pnReports.Controls.Add(this.txtSearch);
            this.pnReports.Controls.Add(this.btnAddNew);
            this.pnReports.Controls.Add(this.lblCustomersTable);
            this.pnReports.Controls.Add(this.dtCustomers);
            this.pnReports.Location = new System.Drawing.Point(285, 349);
            this.pnReports.Name = "pnReports";
            this.pnReports.Size = new System.Drawing.Size(1122, 380);
            this.pnReports.TabIndex = 2;
            this.pnReports.Paint += new System.Windows.Forms.PaintEventHandler(this.pnReports_Paint);
            // 
            // pbSearch
            // 
            this.pbSearch.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.pbSearch.BackgroundImage = global::AIGenerator.Properties.Resources.search;
            this.pbSearch.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Zoom;
            this.pbSearch.Location = new System.Drawing.Point(868, 19);
            this.pbSearch.Margin = new System.Windows.Forms.Padding(2);
            this.pbSearch.Name = "pbSearch";
            this.pbSearch.Size = new System.Drawing.Size(22, 24);
            this.pbSearch.TabIndex = 75;
            this.pbSearch.TabStop = false;
            this.pbSearch.Click += new System.EventHandler(this.pbSearch_Click);
            // 
            // txtSearch
            // 
            this.txtSearch.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.txtSearch.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtSearch.Location = new System.Drawing.Point(624, 18);
            this.txtSearch.Margin = new System.Windows.Forms.Padding(2);
            this.txtSearch.Name = "txtSearch";
            this.txtSearch.Size = new System.Drawing.Size(240, 26);
            this.txtSearch.TabIndex = 74;
            this.txtSearch.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.txtSearch_KeyPress);
            // 
            // btnAddNew
            // 
            this.btnAddNew.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.btnAddNew.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnAddNew.Location = new System.Drawing.Point(896, 9);
            this.btnAddNew.Margin = new System.Windows.Forms.Padding(2);
            this.btnAddNew.Name = "btnAddNew";
            this.btnAddNew.Size = new System.Drawing.Size(206, 45);
            this.btnAddNew.TabIndex = 73;
            this.btnAddNew.Text = "Dodaj naručitelja";
            this.btnAddNew.UseVisualStyleBackColor = true;
            this.btnAddNew.Click += new System.EventHandler(this.btnAddNew_Click);
            // 
            // lblCustomersTable
            // 
            this.lblCustomersTable.Font = new System.Drawing.Font("Trebuchet MS", 18F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblCustomersTable.Location = new System.Drawing.Point(18, 14);
            this.lblCustomersTable.Name = "lblCustomersTable";
            this.lblCustomersTable.Size = new System.Drawing.Size(279, 34);
            this.lblCustomersTable.TabIndex = 3;
            this.lblCustomersTable.Text = "Naručitelji";
            this.lblCustomersTable.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblCustomersTable.UseCompatibleTextRendering = true;
            // 
            // lblWelcome
            // 
            this.lblWelcome.AutoSize = true;
            this.lblWelcome.Font = new System.Drawing.Font("Trebuchet MS", 27.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblWelcome.Location = new System.Drawing.Point(285, 24);
            this.lblWelcome.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.lblWelcome.Name = "lblWelcome";
            this.lblWelcome.Size = new System.Drawing.Size(161, 51);
            this.lblWelcome.TabIndex = 3;
            this.lblWelcome.Text = "Pozdrav,";
            this.lblWelcome.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblWelcome.UseCompatibleTextRendering = true;
            // 
            // lblInfoText
            // 
            this.lblInfoText.AutoSize = true;
            this.lblInfoText.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblInfoText.Location = new System.Drawing.Point(291, 71);
            this.lblInfoText.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.lblInfoText.Name = "lblInfoText";
            this.lblInfoText.Size = new System.Drawing.Size(239, 28);
            this.lblInfoText.TabIndex = 5;
            this.lblInfoText.Text = "Vaš generator je spreman:";
            this.lblInfoText.UseCompatibleTextRendering = true;
            // 
            // pnCustomers
            // 
            this.pnCustomers.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnCustomers.Controls.Add(this.btnCheckAllCustomers);
            this.pnCustomers.Controls.Add(this.chartCustomers);
            this.pnCustomers.Controls.Add(this.lblCustomers);
            this.pnCustomers.Location = new System.Drawing.Point(285, 120);
            this.pnCustomers.Name = "pnCustomers";
            this.pnCustomers.Size = new System.Drawing.Size(260, 214);
            this.pnCustomers.TabIndex = 9;
            this.pnCustomers.Paint += new System.Windows.Forms.PaintEventHandler(this.Panel_Paint);
            // 
            // btnCheckAllCustomers
            // 
            this.btnCheckAllCustomers.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.btnCheckAllCustomers.Font = new System.Drawing.Font("Trebuchet MS", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnCheckAllCustomers.Location = new System.Drawing.Point(129, 11);
            this.btnCheckAllCustomers.Margin = new System.Windows.Forms.Padding(2);
            this.btnCheckAllCustomers.Name = "btnCheckAllCustomers";
            this.btnCheckAllCustomers.Size = new System.Drawing.Size(120, 28);
            this.btnCheckAllCustomers.TabIndex = 73;
            this.btnCheckAllCustomers.Text = "Pregledaj sve";
            this.btnCheckAllCustomers.UseVisualStyleBackColor = true;
            this.btnCheckAllCustomers.Click += new System.EventHandler(this.btnCheckAllCustomers_Click);
            // 
            // chartCustomers
            // 
            chartArea1.Name = "ChartArea1";
            this.chartCustomers.ChartAreas.Add(chartArea1);
            legend1.Name = "Legend1";
            this.chartCustomers.Legends.Add(legend1);
            this.chartCustomers.Location = new System.Drawing.Point(14, 47);
            this.chartCustomers.Name = "chartCustomers";
            this.chartCustomers.Palette = System.Windows.Forms.DataVisualization.Charting.ChartColorPalette.None;
            this.chartCustomers.PaletteCustomColors = new System.Drawing.Color[] {
        System.Drawing.Color.FromArgb(((int)(((byte)(35)))), ((int)(((byte)(177)))), ((int)(((byte)(77))))),
        System.Drawing.Color.FromArgb(((int)(((byte)(242)))), ((int)(((byte)(159)))), ((int)(((byte)(5))))),
        System.Drawing.Color.FromArgb(((int)(((byte)(211)))), ((int)(((byte)(239)))), ((int)(((byte)(219)))))};
            series1.ChartArea = "ChartArea1";
            series1.ChartType = System.Windows.Forms.DataVisualization.Charting.SeriesChartType.Doughnut;
            series1.Legend = "Legend1";
            series1.Name = "Series1";
            this.chartCustomers.Series.Add(series1);
            this.chartCustomers.Size = new System.Drawing.Size(232, 156);
            this.chartCustomers.TabIndex = 5;
            this.chartCustomers.Text = "chart1";
            // 
            // lblCustomers
            // 
            this.lblCustomers.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblCustomers.Location = new System.Drawing.Point(11, 12);
            this.lblCustomers.Name = "lblCustomers";
            this.lblCustomers.Size = new System.Drawing.Size(92, 27);
            this.lblCustomers.TabIndex = 0;
            this.lblCustomers.Text = "Naručitelji";
            this.lblCustomers.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // pnExaminers
            // 
            this.pnExaminers.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnExaminers.Controls.Add(this.btnCheckAllExaminers);
            this.pnExaminers.Controls.Add(this.lblExaminerThreeCount);
            this.pnExaminers.Controls.Add(this.lblExaminerThree);
            this.pnExaminers.Controls.Add(this.lblExaminerTwoCount);
            this.pnExaminers.Controls.Add(this.lblExaminerTwo);
            this.pnExaminers.Controls.Add(this.lblExaminerOneCount);
            this.pnExaminers.Controls.Add(this.lblExaminerOne);
            this.pnExaminers.Controls.Add(this.lblExaminers);
            this.pnExaminers.Location = new System.Drawing.Point(565, 120);
            this.pnExaminers.Name = "pnExaminers";
            this.pnExaminers.Size = new System.Drawing.Size(260, 214);
            this.pnExaminers.TabIndex = 10;
            this.pnExaminers.Paint += new System.Windows.Forms.PaintEventHandler(this.Panel_Paint);
            // 
            // btnCheckAllExaminers
            // 
            this.btnCheckAllExaminers.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.btnCheckAllExaminers.Font = new System.Drawing.Font("Trebuchet MS", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnCheckAllExaminers.Location = new System.Drawing.Point(129, 11);
            this.btnCheckAllExaminers.Margin = new System.Windows.Forms.Padding(2);
            this.btnCheckAllExaminers.Name = "btnCheckAllExaminers";
            this.btnCheckAllExaminers.Size = new System.Drawing.Size(120, 28);
            this.btnCheckAllExaminers.TabIndex = 74;
            this.btnCheckAllExaminers.Text = "Pregledaj sve";
            this.btnCheckAllExaminers.UseVisualStyleBackColor = true;
            this.btnCheckAllExaminers.Click += new System.EventHandler(this.btnCheckAllExaminers_Click);
            // 
            // lblExaminerThreeCount
            // 
            this.lblExaminerThreeCount.AutoSize = true;
            this.lblExaminerThreeCount.Font = new System.Drawing.Font("Trebuchet MS", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblExaminerThreeCount.Location = new System.Drawing.Point(11, 187);
            this.lblExaminerThreeCount.Name = "lblExaminerThreeCount";
            this.lblExaminerThreeCount.Size = new System.Drawing.Size(113, 16);
            this.lblExaminerThreeCount.TabIndex = 11;
            this.lblExaminerThreeCount.Text = "Kreirao 12 izvještaja";
            this.lblExaminerThreeCount.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this.lblExaminerThreeCount.Visible = false;
            // 
            // lblExaminerThree
            // 
            this.lblExaminerThree.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblExaminerThree.Location = new System.Drawing.Point(10, 158);
            this.lblExaminerThree.Name = "lblExaminerThree";
            this.lblExaminerThree.Size = new System.Drawing.Size(240, 22);
            this.lblExaminerThree.TabIndex = 10;
            this.lblExaminerThree.Text = "Ispitivači";
            this.lblExaminerThree.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblExaminerThree.Visible = false;
            // 
            // lblExaminerTwoCount
            // 
            this.lblExaminerTwoCount.AutoSize = true;
            this.lblExaminerTwoCount.Font = new System.Drawing.Font("Trebuchet MS", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblExaminerTwoCount.Location = new System.Drawing.Point(13, 134);
            this.lblExaminerTwoCount.Name = "lblExaminerTwoCount";
            this.lblExaminerTwoCount.Size = new System.Drawing.Size(113, 16);
            this.lblExaminerTwoCount.TabIndex = 9;
            this.lblExaminerTwoCount.Text = "Kreirao 12 izvještaja";
            this.lblExaminerTwoCount.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this.lblExaminerTwoCount.Visible = false;
            // 
            // lblExaminerTwo
            // 
            this.lblExaminerTwo.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblExaminerTwo.Location = new System.Drawing.Point(11, 106);
            this.lblExaminerTwo.Name = "lblExaminerTwo";
            this.lblExaminerTwo.Size = new System.Drawing.Size(240, 22);
            this.lblExaminerTwo.TabIndex = 8;
            this.lblExaminerTwo.Text = "Ispitivači";
            this.lblExaminerTwo.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblExaminerTwo.Visible = false;
            // 
            // lblExaminerOneCount
            // 
            this.lblExaminerOneCount.AutoSize = true;
            this.lblExaminerOneCount.Font = new System.Drawing.Font("Trebuchet MS", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblExaminerOneCount.Location = new System.Drawing.Point(13, 81);
            this.lblExaminerOneCount.Name = "lblExaminerOneCount";
            this.lblExaminerOneCount.Size = new System.Drawing.Size(113, 16);
            this.lblExaminerOneCount.TabIndex = 7;
            this.lblExaminerOneCount.Text = "Kreirao 12 izvještaja";
            this.lblExaminerOneCount.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this.lblExaminerOneCount.Visible = false;
            // 
            // lblExaminerOne
            // 
            this.lblExaminerOne.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblExaminerOne.Location = new System.Drawing.Point(11, 53);
            this.lblExaminerOne.Name = "lblExaminerOne";
            this.lblExaminerOne.Size = new System.Drawing.Size(240, 22);
            this.lblExaminerOne.TabIndex = 6;
            this.lblExaminerOne.Text = "Ispitivači";
            this.lblExaminerOne.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblExaminerOne.Visible = false;
            // 
            // lblExaminers
            // 
            this.lblExaminers.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblExaminers.Location = new System.Drawing.Point(11, 12);
            this.lblExaminers.Name = "lblExaminers";
            this.lblExaminers.Size = new System.Drawing.Size(98, 27);
            this.lblExaminers.TabIndex = 0;
            this.lblExaminers.Text = "Ispitivači";
            this.lblExaminers.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // pbProfile
            // 
            this.pbProfile.BackgroundImage = global::AIGenerator.Properties.Resources.user;
            this.pbProfile.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Zoom;
            this.pbProfile.Location = new System.Drawing.Point(1367, 30);
            this.pbProfile.Name = "pbProfile";
            this.pbProfile.Size = new System.Drawing.Size(40, 40);
            this.pbProfile.TabIndex = 11;
            this.pbProfile.TabStop = false;
            // 
            // pbNotification
            // 
            this.pbNotification.BackgroundImage = global::AIGenerator.Properties.Resources.notification;
            this.pbNotification.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Zoom;
            this.pbNotification.Location = new System.Drawing.Point(1322, 35);
            this.pbNotification.Name = "pbNotification";
            this.pbNotification.Size = new System.Drawing.Size(30, 30);
            this.pbNotification.TabIndex = 12;
            this.pbNotification.TabStop = false;
            // 
            // menuUserControl1
            // 
            this.menuUserControl1.BackColor = System.Drawing.Color.White;
            this.menuUserControl1.Dock = System.Windows.Forms.DockStyle.Left;
            this.menuUserControl1.Location = new System.Drawing.Point(0, 0);
            this.menuUserControl1.Margin = new System.Windows.Forms.Padding(2);
            this.menuUserControl1.Name = "menuUserControl1";
            this.menuUserControl1.Size = new System.Drawing.Size(256, 748);
            this.menuUserControl1.TabIndex = 0;
            // 
            // lblName
            // 
            this.lblName.AutoSize = true;
            this.lblName.Font = new System.Drawing.Font("Microsoft Sans Serif", 27.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblName.Location = new System.Drawing.Point(450, 25);
            this.lblName.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.lblName.Name = "lblName";
            this.lblName.Size = new System.Drawing.Size(169, 50);
            this.lblName.TabIndex = 4;
            this.lblName.Text = "Pozdrav,";
            this.lblName.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblName.UseCompatibleTextRendering = true;
            // 
            // PlatformForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.White;
            this.ClientSize = new System.Drawing.Size(1426, 748);
            this.Controls.Add(this.pbNotification);
            this.Controls.Add(this.pbProfile);
            this.Controls.Add(this.pnExaminers);
            this.Controls.Add(this.pnCustomers);
            this.Controls.Add(this.lblInfoText);
            this.Controls.Add(this.lblName);
            this.Controls.Add(this.lblWelcome);
            this.Controls.Add(this.pnReports);
            this.Controls.Add(this.menuUserControl1);
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.MinimumSize = new System.Drawing.Size(1442, 781);
            this.Name = "PlatformForm";
            this.Text = "AIGenerator";
            this.WindowState = System.Windows.Forms.FormWindowState.Maximized;
            this.Activated += new System.EventHandler(this.PlatformForm_Activated);
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.DashboardForm_FormClosed);
            this.Load += new System.EventHandler(this.DashboardForm_Load);
            this.Resize += new System.EventHandler(this.PlatformForm_Resize);
            ((System.ComponentModel.ISupportInitialize)(this.dtCustomers)).EndInit();
            this.pnReports.ResumeLayout(false);
            this.pnReports.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbSearch)).EndInit();
            this.pnCustomers.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.chartCustomers)).EndInit();
            this.pnExaminers.ResumeLayout(false);
            this.pnExaminers.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbProfile)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.pbNotification)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private UserControls.MenuUserControl menuUserControl1;
        private System.Windows.Forms.DataGridView dtCustomers;
        private System.Windows.Forms.Panel pnReports;
        private System.Windows.Forms.Label lblCustomersTable;
        private System.Windows.Forms.Label lblWelcome;
        private System.Windows.Forms.Label lblInfoText;
        private System.Windows.Forms.Panel pnCustomers;
        private System.Windows.Forms.Label lblCustomers;
        private System.Windows.Forms.Panel pnExaminers;
        private System.Windows.Forms.Label lblExaminers;
        private System.Windows.Forms.PictureBox pbProfile;
        private System.Windows.Forms.PictureBox pbNotification;
        private System.Windows.Forms.DataVisualization.Charting.Chart chartCustomers;
        private System.Windows.Forms.Label lblExaminerThreeCount;
        private System.Windows.Forms.Label lblExaminerThree;
        private System.Windows.Forms.Label lblExaminerTwoCount;
        private System.Windows.Forms.Label lblExaminerTwo;
        private System.Windows.Forms.Label lblExaminerOneCount;
        private System.Windows.Forms.Label lblExaminerOne;
        private System.Windows.Forms.Button btnCheckAllCustomers;
        private System.Windows.Forms.Button btnCheckAllExaminers;
        private System.Windows.Forms.Button btnAddNew;
        private System.Windows.Forms.PictureBox pbSearch;
        private System.Windows.Forms.TextBox txtSearch;
        private System.Windows.Forms.DataGridViewTextBoxColumn Number;
        private System.Windows.Forms.DataGridViewTextBoxColumn Customer;
        private System.Windows.Forms.DataGridViewTextBoxColumn ActiveWorkOrders;
        private System.Windows.Forms.DataGridViewTextBoxColumn Id;
        private System.Windows.Forms.Label lblName;
    }
}