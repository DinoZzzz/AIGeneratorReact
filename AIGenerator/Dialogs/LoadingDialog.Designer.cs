namespace AIGenerator
{
    partial class LoadingDialog
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
            this.loadingUserControl1 = new AIGenerator.UserControls.LoadingUserControl();
            this.SuspendLayout();
            // 
            // loadingUserControl1
            // 
            this.loadingUserControl1.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(250)))), ((int)(((byte)(251)))), ((int)(((byte)(250)))));
            this.loadingUserControl1.Location = new System.Drawing.Point(0, 0);
            this.loadingUserControl1.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.loadingUserControl1.Name = "loadingUserControl1";
            this.loadingUserControl1.Size = new System.Drawing.Size(687, 277);
            this.loadingUserControl1.TabIndex = 0;
            this.loadingUserControl1.DisplayedText = "Spremanje datoteka...";
            // 
            // LoadingDialog
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(687, 277);
            this.Controls.Add(this.loadingUserControl1);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Icon = global::AIGenerator.Properties.Resources.icon;
            this.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.Name = "LoadingDialog";
            this.ShowInTaskbar = false;
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Load += new System.EventHandler(this.LoadingDialog_Load);
            this.ResumeLayout(false);

        }

        #endregion

        private UserControls.LoadingUserControl loadingUserControl1;
    }
}

