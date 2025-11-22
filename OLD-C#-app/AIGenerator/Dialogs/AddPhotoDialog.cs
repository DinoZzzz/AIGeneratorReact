using AIGenerator.Common;
using AIGenerator.Properties;
using Models;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Windows.Forms;

namespace AIGenerator.Dialogs
{
    public partial class AddPhotoDialog : Form
    {
        private readonly ReportExport reportExport;
        private readonly ReportFile reportFile;
        private readonly List<ReportFile> files = new List<ReportFile>();
        private readonly bool isEdit = false;

        public AddPhotoDialog(ReportExport reportExport, ReportFile reportFile, List<ReportFile> files)
        {
            InitializeComponent();
            isEdit = reportFile != null;
            this.reportFile = reportFile ?? new ReportFile() { ReportExportId = reportExport.Id, IsLocal = true };
            this.reportExport = reportExport;
            this.files = files;
        }

        public bool IsDesignerHosted
        {
            get
            {
                Control ctrl = this;
                while (ctrl != null)
                {
                    if ((ctrl.Site != null) && ctrl.Site.DesignMode)
                        return true;
                    ctrl = ctrl.Parent;
                }
                return false;
            }
        }

        private void btnAdd_Click(object sender, EventArgs e)
        {
            Enabled = false;
            try
            {
                if (Check())
                {
                    DateTime now = DateTime.Now;
                    reportFile.UpdateTime = now;
                    reportFile.Description = txtTitle.Text;
                    reportFile.Extension = Path.GetExtension(reportFile.Name);
                    if (!isEdit)
                    {
                        reportFile.Ordinal = (files.Count == 0 ? 0 : files.Max(x => x.Ordinal)) + 1;
                        reportFile.CreationTime = now;
                        files.Add(reportFile);
                    }
                    DialogResult = DialogResult.OK;
                    Close();
                }
            }
            catch
            {
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom spremanja datoteke... Molimo pokušajte ponovo kasnije!");
            }
            Enabled = true;
        }

        private bool Check()
        {
            if(pbSelectedPhoto.BackgroundImage == null)
            {
                MessageClass.ShowInfoBox("Odaberite datoteku koju želite dodati!");
                return false;
            }
            else if (string.IsNullOrEmpty(txtTitle.Text))
            {
                MessageClass.ShowInfoBox("Unesite naslov datoteke!");
                return false;
            }
            return true;
        }

        private void AddPhotoDialog_Load(object sender, EventArgs e)
        {
            if (!IsDesignerHosted)
            {
                btnAddDeletePhoto.Visible = !isEdit;
                BackColor = CustomColor.PrimaryBackground;
                lblName.ForeColor = CustomColor.Text1;
                btnAddDeletePhoto.ForeColor = btnAdd.ForeColor = txtTitle.ForeColor = CustomColor.Text1;
                btnAddDeletePhoto.BackColor= btnAdd.BackColor = txtTitle.BackColor = CustomColor.White10;
                btnAdd.Text = isEdit ? "Spremi" : "Dodaj";
                txtTitle.Text = reportFile.Description;
                if (isEdit)
                {
                    if (reportFile.IsLocal)
                    {
                        if (reportFile.Extension.ToLower() == ".pdf") pbSelectedPhoto.BackgroundImage = Resources.pdf;
                        else pbSelectedPhoto.BackgroundImage = new Bitmap(reportFile.Name);
                    }
                    else pbSelectedPhoto.BackgroundImage = ImageClass.GetImage(reportFile);
                    pbPDF.Visible = Path.GetExtension(reportFile.Name).ToLower() == ".pdf";
                }
            }
        }

        private void TextBox_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter)
            {
                e.Handled = true;
                btnAdd_Click(btnAdd, e);
            }
        }

        private void btnAddDeletePhoto_Click(object sender, EventArgs e)
        {
            Enabled = false;
            if(pbSelectedPhoto.BackgroundImage == null)
            {
                OpenFileDialog openFileDialog = new OpenFileDialog
                {
                    Filter = "Image or PDF|*.jpeg;*.jpg;*.webp;*.png;*.gif;*.bmp;*.wbmp;*.pdf",
                    InitialDirectory = Path.GetFullPath(Environment.GetFolderPath(Environment.SpecialFolder.Desktop)),
                    RestoreDirectory = true
                };
                if (openFileDialog.ShowDialog() == DialogResult.OK)
                {
                    reportFile.Name = openFileDialog.FileName;
                    reportFile.Extension = Path.GetExtension(openFileDialog.FileName);
                    if (reportFile.Extension.ToLower() == ".pdf") pbSelectedPhoto.BackgroundImage = Properties.Resources.pdf;
                    else pbSelectedPhoto.BackgroundImage = new Bitmap(openFileDialog.FileName);
                    byte[] bytes = File.ReadAllBytes(openFileDialog.FileName);
                    //using (var memoryStream = new MemoryStream(openFileDialog.FileName,))
                    //{
                    //    pbSelectedPhoto.BackgroundImage.Save(memoryStream, pbSelectedPhoto.BackgroundImage.RawFormat);
                        reportFile.Bytes = "[" + string.Join(", ", bytes.ToArray()) + "]";
                    //}
                    btnAddDeletePhoto.Text = "Ukloni datoteku";
                    btnAddDeletePhoto.ForeColor = CustomColor.Red;
                }
            }
            else
            {
                pbSelectedPhoto.BackgroundImage = null;
                reportFile.Bytes = "";
                btnAddDeletePhoto.Text = "Odaberi datoteku";
                btnAddDeletePhoto.ForeColor = CustomColor.Text1;
            }
            Enabled = true;
        }
    }
}
