using AIGenerator.AppBindings;
using AIGenerator.Common;
using AIGenerator.Dialogs;
using Common;
using Interfaces;
using Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace AIGenerator.Forms
{
    public partial class ExaminersForm : BaseForm
    {
        private readonly IUser IUser;
        private readonly IUserReportAccreditation IUserReportAccreditation;
        private readonly IReportType IReportType;
        private readonly IReportExport IReportExport;
        private List<User> users = new List<User>();
        private int currentPage = 0;
        private int pageSize = 50;
        private bool dataSourceChanged = true;
        private bool lastPage = false;
        private string search = "";

        public ExaminersForm(IUser user,IUserReportAccreditation userReportAccreditation, IReportExport iReportExport, IReportType iReportType) : base()
        {
            IUser = user;
            IUserReportAccreditation = userReportAccreditation;
            InitializeComponent();
            menuUserControl1.SetSelectedItem(MenuItems.Examiners);
            IReportExport = iReportExport;
            IReportType = iReportType;
        }

        private void LoadExaminers()
        {
            try
            {
                if (dataSourceChanged)
                {
                    dataSourceChanged = lastPage = false;
                    currentPage = 0;
                    dtExaminers.Rows.Clear();
                    users.Clear();
                }
                if (lastPage) return;
                LoadingScreenHelper.StartLoadingScreen();
                IQueryable<User> usersQuery = IUser.GetAll();
                if (!string.IsNullOrEmpty(search))
                {
                    usersQuery = usersQuery.Where(x => x.Username.ToLower().Contains(search) || x.Name.ToLower().Contains(search) || x.LastName.ToLower().Contains(search));
                }
                usersQuery = SortExaminers(usersQuery).Skip(currentPage * pageSize).Take(pageSize);
                lastPage = usersQuery.Count() < pageSize;
                foreach (User user in usersQuery)
                {
                    if (users.Any(x => x.Id == user.Id)) continue;
                    users.Add(user);
                    int rowIndex = dtExaminers.Rows.Add();
                    dtExaminers["Id", rowIndex].Value = user.Id;
                    dtExaminers["FullName", rowIndex].Value = user.GetName();
                    dtExaminers["Username", rowIndex].Value = user.Username;
                    StringBuilder sb = new StringBuilder();
                    foreach (UserReportAccreditation userAccreditation in IUserReportAccreditation.GetByUser(user.Id).OrderBy(x => x.ReportTypeId))
                    {
                        sb.Append((sb.Length == 0 ? "" : ", ") + IReportType.GetById(userAccreditation.ReportTypeId).Type);
                    }
                    dtExaminers["Accreditations", rowIndex].Value = sb.ToString();
                    dtExaminers["ReportsCount", rowIndex].Value = IReportExport.GetByUser(user.Id).Count();
                    rowIndex++;
                }
            }
            catch (Exception ex)
            {
                ExceptionHelper.SaveLog(ex);
                dtExaminers.Rows.Clear();
                users.Clear();
                LoadingScreenHelper.EndScreen();
                MessageClass.ShowErrorBox("Došlo je do pogreške prilikom učitavanja ispitivača... Molimo pokušajte ponovo kasnije!");
            }
            LoadingScreenHelper.EndScreen();
        }

        private IQueryable<User> SortExaminers(IQueryable<User> examiners)
        {
            DataGridViewColumn column = dtExaminers.SortedColumn;
            SortOrder order = dtExaminers.SortOrder;
            if (column == null)
            {
                examiners = examiners.OrderBy(x => x.Username);
            }
            else if (dtExaminers.Columns[0].Name == column.Name)
            {
                if (order == SortOrder.Descending) examiners = examiners.OrderByDescending(x => x.Name).ThenByDescending(x => x.LastName);
                else examiners = examiners.OrderBy(x => x.Name).ThenBy(x => x.LastName);
            }
            else if (dtExaminers.Columns[1].Name == column.Name)
            {
                if (order == SortOrder.Descending) examiners = examiners.OrderByDescending(x => x.Username);
                else examiners = examiners.OrderBy(x => x.Username);
            }
            return examiners;
        }

        private void ExaminersForm_Load(object sender, EventArgs e)
        {
            if (IsDesignerHosted) return;
            BackColor = CustomColor.Background;
            btnAddNew.Visible = LoginForm.currentUser.IsAdmin;
            DataGridHelper.SetDefaultStyle(dtExaminers);
            if (LoginForm.currentUser.IsAdmin)
            {
                DataGridHelper.CreateButtonColumn(dtExaminers, "EditColumn", "Uredi");
                DataGridHelper.CreateButtonColumn(dtExaminers, "RemoveColumn", "Ukloni");
                dtExaminers.Columns["EditColumn"].DefaultCellStyle.ForeColor = CustomColor.MainColor;
                dtExaminers.Columns["RemoveColumn"].DefaultCellStyle.ForeColor = CustomColor.Red;
            }
            lblExaminers.ForeColor = CustomColor.Text1;
            btnAddNew.ForeColor = CustomColor.MainColor;
            btnAddNew.BackColor = CustomColor.PrimaryBackground;
            txtSearch.BackColor = CustomColor.White10;
            txtSearch.ForeColor = CustomColor.Text1;
            containerPanel.Size = pnBody.Size;
            LoadExaminers();
        }

        private void pnReports_Paint(object sender, PaintEventArgs e)
        {
            Panel p = sender as Panel;
            p.BackColor = CustomColor.PrimaryBackground;
            ControlPaint.DrawBorder(e.Graphics, p.DisplayRectangle, CustomColor.MainColor20, ButtonBorderStyle.Solid);
        }

        private void ExaminersForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            FormHelper.CloseApp();
        }

        private void dtExaminers_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex == -1 || !LoginForm.currentUser.IsAdmin) return;
            string userId = Convert.ToString(dtExaminers["Id", e.RowIndex].Value);
            if (e.ColumnIndex == dtExaminers.Columns["EditColumn"].Index)
            {
                Enabled = false;
                if (CompositionRoot.Resolve<AddExaminerDialog>("user", users.SingleOrDefault(x => x.Id == userId)).ShowDialog() == DialogResult.OK)
                {
                    dataSourceChanged = true;
                    LoadExaminers();
                }
                Enabled = true;
            }
            else if (e.ColumnIndex == dtExaminers.Columns["RemoveColumn"].Index)
            {
                Enabled = false;
                if (userId == AppData.AdminId || userId == AppData.DebugId) MessageClass.ShowInfoBox("Nije moguće ukloniti ovaj račun!");
                else if (userId == LoginForm.currentUser.Id) MessageClass.ShowInfoBox("Ne možete ukloniti vaš račun!");
                else if (MessageClass.ShowQuestionBox("Jeste li sigurni da želite ukloniti ovog korisnika zajedno sa svim njegovim izvještajima?") == DialogResult.Yes)
                {
                    try
                    {
                        IReportExport.RemoveByUser(userId);
                        IReportExport.SaveChanges();
                        IUserReportAccreditation.RemoveByUser(userId);
                        IUserReportAccreditation.SaveChanges();
                        IUser.Remove(userId);
                        IUser.SaveChanges();
                    }
                    catch (Exception ex)
                    {
                        ExceptionHelper.SaveLog(ex);
                        MessageClass.ShowErrorBox("Došlo je do pogreške prilikom uklanjanja ispitivača... Molimo pokušajte ponovo kasnije!");
                        Enabled = true;
                        return;
                    }
                    dataSourceChanged = true;
                    LoadExaminers();
                }
                Enabled = true;
            }
        }

        private void dtExaminers_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0 || !LoginForm.currentUser.IsAdmin) return;
            Enabled = false;
            string userId = Convert.ToString(dtExaminers["Id", e.RowIndex].Value);
            if (CompositionRoot.Resolve<AddExaminerDialog>("user", users.SingleOrDefault(x => x.Id == userId)).ShowDialog() == DialogResult.OK)
            {
                dataSourceChanged = true;
                LoadExaminers();
            }
            Enabled = true;
        }

        private void btnAddNew_Click(object sender, EventArgs e)
        {
            Enabled = false;
            if (CompositionRoot.Resolve<AddExaminerDialog>("user", null).ShowDialog() == DialogResult.OK)
            {
                dataSourceChanged = true;
                LoadExaminers();
            }
            Enabled = true;
        }

        private void dtExaminers_Scroll(object sender, ScrollEventArgs e)
        {
            if (dtExaminers.DisplayedRowCount(true) + e.NewValue >= dtExaminers.Rows.Count - 5)
            {
                currentPage++;
                LoadExaminers();
            }
        }

        private void pbSearch_Click(object sender, EventArgs e)
        {
            Enabled = false;
            search = txtSearch.Text.ToLower();
            dataSourceChanged = true;
            LoadExaminers();
            Enabled = true;
        }

        private void txtSearch_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter)
            {
                e.Handled = true;
                pbSearch_Click(pbSearch, e);
            }
        }

        private void dtExaminers_Sorted(object sender, EventArgs e)
        {
            pbSearch_Click(pbSearch, e);
        }

        private void ExaminersForm_Resize(object sender, EventArgs e)
        {
            Size newSize = minimumSize;
            if (Size.Width > minimumSize.Width) newSize.Width = Size.Width;
            if (Size.Height > minimumSize.Height) newSize.Height = Size.Height;
            pnReports.Size = new Size(newSize.Width - pnReports.Location.X - rightMargin, newSize.Height - pnReports.Location.Y - bottomMargin);
            dtExaminers.Size = new Size(pnReports.Size.Width - 2 * dtExaminers.Left, pnReports.Size.Height - dtExaminers.Location.Y - 2 * btnAddNew.Location.Y);
            btnAddNew.Location = new Point(pnReports.Size.Width - dtExaminers.Left - btnAddNew.Size.Width, btnAddNew.Location.Y);
            pbSearch.Location = new Point(btnAddNew.Location.X - pbSearch.Width - 6, pbSearch.Location.Y);
            txtSearch.Location = new Point(pbSearch.Location.X - 6 - txtSearch.Width, txtSearch.Location.Y);
        }
    }
}
