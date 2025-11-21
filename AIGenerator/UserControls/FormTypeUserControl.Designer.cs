namespace AIGenerator.UserControls
{
    partial class FormTypeUserControl
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

        #region Component Designer generated code

        /// <summary> 
        /// Required method for Designer support - do not modify 
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.lblType = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // lblType
            // 
            this.lblType.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.lblType.Font = new System.Drawing.Font("Trebuchet MS", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblType.Location = new System.Drawing.Point(3, 3);
            this.lblType.Name = "lblType";
            this.lblType.Size = new System.Drawing.Size(517, 43);
            this.lblType.TabIndex = 1;
            this.lblType.Text = "label1";
            this.lblType.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this.lblType.Click += new System.EventHandler(this.SelectionChanged);
            // 
            // FormTypeUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.lblType);
            this.Name = "FormTypeUserControl";
            this.Size = new System.Drawing.Size(523, 49);
            this.Load += new System.EventHandler(this.FormTypeUserControl_Load);
            this.Click += new System.EventHandler(this.SelectionChanged);
            this.Paint += new System.Windows.Forms.PaintEventHandler(this.FormTypeUserControl_Paint);
            this.ResumeLayout(false);

        }

        #endregion
        private System.Windows.Forms.Label lblType;
    }
}
