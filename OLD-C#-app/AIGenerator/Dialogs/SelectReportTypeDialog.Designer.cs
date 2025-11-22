namespace AIGenerator.Dialogs
{
    partial class SelectReportTypeDialog
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
            this.flpTypes = new System.Windows.Forms.FlowLayoutPanel();
            this.lblSelect = new System.Windows.Forms.Label();
            this.lblInfoText = new System.Windows.Forms.Label();
            this.btnSave = new System.Windows.Forms.Button();
            this.lblCustomer = new System.Windows.Forms.Label();
            this.lblCustomerText = new System.Windows.Forms.Label();
            this.lblWorkOrder = new System.Windows.Forms.Label();
            this.lblWorkOrderText = new System.Windows.Forms.Label();
            this.lblConstructionText = new System.Windows.Forms.Label();
            this.lblConstruction = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // flpTypes
            // 
            this.flpTypes.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.flpTypes.FlowDirection = System.Windows.Forms.FlowDirection.TopDown;
            this.flpTypes.Location = new System.Drawing.Point(16, 272);
            this.flpTypes.Margin = new System.Windows.Forms.Padding(4);
            this.flpTypes.Name = "flpTypes";
            this.flpTypes.Size = new System.Drawing.Size(900, 249);
            this.flpTypes.TabIndex = 0;
            // 
            // lblSelect
            // 
            this.lblSelect.Font = new System.Drawing.Font("Trebuchet MS", 18F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblSelect.Location = new System.Drawing.Point(16, 7);
            this.lblSelect.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblSelect.Name = "lblSelect";
            this.lblSelect.Size = new System.Drawing.Size(900, 42);
            this.lblSelect.TabIndex = 31;
            this.lblSelect.Text = "Kreiranje izvještaja";
            this.lblSelect.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this.lblSelect.UseCompatibleTextRendering = true;
            // 
            // lblInfoText
            // 
            this.lblInfoText.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblInfoText.Location = new System.Drawing.Point(16, 226);
            this.lblInfoText.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblInfoText.Name = "lblInfoText";
            this.lblInfoText.Size = new System.Drawing.Size(235, 42);
            this.lblInfoText.TabIndex = 32;
            this.lblInfoText.Text = "Odaberite tip:";
            this.lblInfoText.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblInfoText.UseCompatibleTextRendering = true;
            // 
            // btnSave
            // 
            this.btnSave.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.btnSave.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnSave.Location = new System.Drawing.Point(325, 528);
            this.btnSave.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
            this.btnSave.Name = "btnSave";
            this.btnSave.Size = new System.Drawing.Size(275, 55);
            this.btnSave.TabIndex = 73;
            this.btnSave.Text = "Nastavi";
            this.btnSave.UseVisualStyleBackColor = true;
            this.btnSave.Click += new System.EventHandler(this.btnSave_Click);
            // 
            // lblCustomer
            // 
            this.lblCustomer.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblCustomer.Location = new System.Drawing.Point(215, 69);
            this.lblCustomer.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblCustomer.Name = "lblCustomer";
            this.lblCustomer.Size = new System.Drawing.Size(701, 42);
            this.lblCustomer.TabIndex = 79;
            this.lblCustomer.Text = "Radni nalog:";
            this.lblCustomer.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblCustomer.UseCompatibleTextRendering = true;
            // 
            // lblCustomerText
            // 
            this.lblCustomerText.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblCustomerText.Location = new System.Drawing.Point(16, 69);
            this.lblCustomerText.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblCustomerText.Name = "lblCustomerText";
            this.lblCustomerText.Size = new System.Drawing.Size(192, 42);
            this.lblCustomerText.TabIndex = 78;
            this.lblCustomerText.Text = "Naručitelj:";
            this.lblCustomerText.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblCustomerText.UseCompatibleTextRendering = true;
            // 
            // lblWorkOrder
            // 
            this.lblWorkOrder.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblWorkOrder.Location = new System.Drawing.Point(215, 111);
            this.lblWorkOrder.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblWorkOrder.Name = "lblWorkOrder";
            this.lblWorkOrder.Size = new System.Drawing.Size(701, 42);
            this.lblWorkOrder.TabIndex = 77;
            this.lblWorkOrder.Text = "Radni nalog:";
            this.lblWorkOrder.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblWorkOrder.UseCompatibleTextRendering = true;
            // 
            // lblWorkOrderText
            // 
            this.lblWorkOrderText.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblWorkOrderText.Location = new System.Drawing.Point(16, 111);
            this.lblWorkOrderText.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblWorkOrderText.Name = "lblWorkOrderText";
            this.lblWorkOrderText.Size = new System.Drawing.Size(192, 42);
            this.lblWorkOrderText.TabIndex = 76;
            this.lblWorkOrderText.Text = "Radni nalog:";
            this.lblWorkOrderText.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblWorkOrderText.UseCompatibleTextRendering = true;
            // 
            // lblConstructionText
            // 
            this.lblConstructionText.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblConstructionText.Location = new System.Drawing.Point(16, 153);
            this.lblConstructionText.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblConstructionText.Name = "lblConstructionText";
            this.lblConstructionText.Size = new System.Drawing.Size(192, 42);
            this.lblConstructionText.TabIndex = 75;
            this.lblConstructionText.Text = "Gradilište:";
            this.lblConstructionText.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblConstructionText.UseCompatibleTextRendering = true;
            // 
            // lblConstruction
            // 
            this.lblConstruction.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblConstruction.Location = new System.Drawing.Point(215, 153);
            this.lblConstruction.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblConstruction.Name = "lblConstruction";
            this.lblConstruction.Size = new System.Drawing.Size(139, 42);
            this.lblConstruction.TabIndex = 80;
            this.lblConstruction.Text = "Radni nalog:";
            this.lblConstruction.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblConstruction.UseCompatibleTextRendering = true;
            // 
            // SelectReportTypeDialog
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(932, 594);
            this.Controls.Add(this.lblConstruction);
            this.Controls.Add(this.lblCustomer);
            this.Controls.Add(this.lblCustomerText);
            this.Controls.Add(this.lblWorkOrder);
            this.Controls.Add(this.lblWorkOrderText);
            this.Controls.Add(this.lblConstructionText);
            this.Controls.Add(this.btnSave);
            this.Controls.Add(this.lblInfoText);
            this.Controls.Add(this.lblSelect);
            this.Controls.Add(this.flpTypes);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.Margin = new System.Windows.Forms.Padding(4);
            this.Name = "SelectReportTypeDialog";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Kreiranje izvještaja";
            this.Load += new System.EventHandler(this.SelectFormTypeDialog_Load);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.FlowLayoutPanel flpTypes;
        private System.Windows.Forms.Label lblSelect;
        private System.Windows.Forms.Label lblInfoText;
        private System.Windows.Forms.Button btnSave;
        private System.Windows.Forms.Label lblCustomer;
        private System.Windows.Forms.Label lblCustomerText;
        private System.Windows.Forms.Label lblWorkOrder;
        private System.Windows.Forms.Label lblWorkOrderText;
        private System.Windows.Forms.Label lblConstructionText;
        private System.Windows.Forms.Label lblConstruction;
    }
}