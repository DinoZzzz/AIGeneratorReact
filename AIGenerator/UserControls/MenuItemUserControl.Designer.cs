namespace AIGenerator.UserControls
{
    partial class MenuItemUserControl
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
            this.pnIcon = new System.Windows.Forms.Panel();
            this.lblName = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // pnIcon
            // 
            this.pnIcon.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Zoom;
            this.pnIcon.Location = new System.Drawing.Point(30, 8);
            this.pnIcon.Margin = new System.Windows.Forms.Padding(2);
            this.pnIcon.Name = "pnIcon";
            this.pnIcon.Size = new System.Drawing.Size(18, 20);
            this.pnIcon.TabIndex = 0;
            this.pnIcon.Click += new System.EventHandler(this.Control_Click);
            // 
            // lblName
            // 
            this.lblName.Font = new System.Drawing.Font("Trebuchet MS", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblName.Location = new System.Drawing.Point(63, 0);
            this.lblName.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.lblName.Name = "lblName";
            this.lblName.Size = new System.Drawing.Size(143, 36);
            this.lblName.TabIndex = 1;
            this.lblName.Text = "label1";
            this.lblName.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.lblName.UseCompatibleTextRendering = true;
            this.lblName.Click += new System.EventHandler(this.Control_Click);
            // 
            // MenuItemUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.White;
            this.Controls.Add(this.lblName);
            this.Controls.Add(this.pnIcon);
            this.Margin = new System.Windows.Forms.Padding(2);
            this.Name = "MenuItemUserControl";
            this.Size = new System.Drawing.Size(206, 36);
            this.Click += new System.EventHandler(this.Control_Click);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Panel pnIcon;
        private System.Windows.Forms.Label lblName;
    }
}
