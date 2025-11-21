namespace AIGenerator.Dialogs
{
    partial class SelectFormTypeDialog
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
            this.btnBack = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // flpTypes
            // 
            this.flpTypes.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.flpTypes.FlowDirection = System.Windows.Forms.FlowDirection.TopDown;
            this.flpTypes.Location = new System.Drawing.Point(12, 221);
            this.flpTypes.Name = "flpTypes";
            this.flpTypes.Size = new System.Drawing.Size(675, 202);
            this.flpTypes.TabIndex = 0;
            // 
            // lblSelect
            // 
            this.lblSelect.Font = new System.Drawing.Font("Trebuchet MS", 18F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblSelect.Location = new System.Drawing.Point(12, 6);
            this.lblSelect.Name = "lblSelect";
            this.lblSelect.Size = new System.Drawing.Size(675, 34);
            this.lblSelect.TabIndex = 31;
            this.lblSelect.Text = "Kreiranje obrazca";
            this.lblSelect.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this.lblSelect.UseCompatibleTextRendering = true;
            // 
            // lblInfoText
            // 
            this.lblInfoText.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblInfoText.Location = new System.Drawing.Point(12, 184);
            this.lblInfoText.Name = "lblInfoText";
            this.lblInfoText.Size = new System.Drawing.Size(176, 34);
            this.lblInfoText.TabIndex = 32;
            this.lblInfoText.Text = "Odaberite metodu:";
            this.lblInfoText.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblInfoText.UseCompatibleTextRendering = true;
            // 
            // btnSave
            // 
            this.btnSave.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.btnSave.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnSave.Location = new System.Drawing.Point(244, 429);
            this.btnSave.Margin = new System.Windows.Forms.Padding(2);
            this.btnSave.Name = "btnSave";
            this.btnSave.Size = new System.Drawing.Size(206, 45);
            this.btnSave.TabIndex = 73;
            this.btnSave.Text = "Nastavi";
            this.btnSave.UseVisualStyleBackColor = true;
            this.btnSave.Click += new System.EventHandler(this.btnSave_Click);
            // 
            // lblCustomer
            // 
            this.lblCustomer.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblCustomer.Location = new System.Drawing.Point(161, 56);
            this.lblCustomer.Name = "lblCustomer";
            this.lblCustomer.Size = new System.Drawing.Size(526, 34);
            this.lblCustomer.TabIndex = 79;
            this.lblCustomer.Text = "Radni nalog:";
            this.lblCustomer.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblCustomer.UseCompatibleTextRendering = true;
            // 
            // lblCustomerText
            // 
            this.lblCustomerText.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblCustomerText.Location = new System.Drawing.Point(12, 56);
            this.lblCustomerText.Name = "lblCustomerText";
            this.lblCustomerText.Size = new System.Drawing.Size(144, 34);
            this.lblCustomerText.TabIndex = 78;
            this.lblCustomerText.Text = "Naručitelj:";
            this.lblCustomerText.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblCustomerText.UseCompatibleTextRendering = true;
            // 
            // lblWorkOrder
            // 
            this.lblWorkOrder.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblWorkOrder.Location = new System.Drawing.Point(161, 90);
            this.lblWorkOrder.Name = "lblWorkOrder";
            this.lblWorkOrder.Size = new System.Drawing.Size(526, 34);
            this.lblWorkOrder.TabIndex = 77;
            this.lblWorkOrder.Text = "Radni nalog:";
            this.lblWorkOrder.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblWorkOrder.UseCompatibleTextRendering = true;
            // 
            // lblWorkOrderText
            // 
            this.lblWorkOrderText.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblWorkOrderText.Location = new System.Drawing.Point(12, 90);
            this.lblWorkOrderText.Name = "lblWorkOrderText";
            this.lblWorkOrderText.Size = new System.Drawing.Size(144, 34);
            this.lblWorkOrderText.TabIndex = 76;
            this.lblWorkOrderText.Text = "Radni nalog:";
            this.lblWorkOrderText.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblWorkOrderText.UseCompatibleTextRendering = true;
            // 
            // lblConstructionText
            // 
            this.lblConstructionText.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblConstructionText.Location = new System.Drawing.Point(12, 124);
            this.lblConstructionText.Name = "lblConstructionText";
            this.lblConstructionText.Size = new System.Drawing.Size(144, 34);
            this.lblConstructionText.TabIndex = 75;
            this.lblConstructionText.Text = "Gradilište:";
            this.lblConstructionText.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            this.lblConstructionText.UseCompatibleTextRendering = true;
            // 
            // lblConstruction
            // 
            this.lblConstruction.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblConstruction.Location = new System.Drawing.Point(161, 124);
            this.lblConstruction.Name = "lblConstruction";
            this.lblConstruction.Size = new System.Drawing.Size(104, 34);
            this.lblConstruction.TabIndex = 80;
            this.lblConstruction.Text = "Radni nalog:";
            this.lblConstruction.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblConstruction.UseCompatibleTextRendering = true;
            // 
            // btnBack
            // 
            this.btnBack.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.btnBack.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnBack.Location = new System.Drawing.Point(559, 184);
            this.btnBack.Margin = new System.Windows.Forms.Padding(2);
            this.btnBack.Name = "btnBack";
            this.btnBack.Size = new System.Drawing.Size(128, 32);
            this.btnBack.TabIndex = 81;
            this.btnBack.Text = "Povratak";
            this.btnBack.UseVisualStyleBackColor = true;
            this.btnBack.Visible = false;
            this.btnBack.Click += new System.EventHandler(this.btnBack_Click);
            // 
            // SelectFormTypeDialog
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(699, 483);
            this.Controls.Add(this.btnBack);
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
            this.Name = "SelectFormTypeDialog";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Kreiranje obrazca";
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
        private System.Windows.Forms.Button btnBack;
    }
}