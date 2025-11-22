using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.Common
{
    public class DataGridHelper
    {
        private static Font font = new Font("Trebuchet MS", 12F, FontStyle.Regular, GraphicsUnit.Point, ((byte)(0)));


        public static void SetDefaultStyle(DataGridView dataGridView)
        {
            dataGridView.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            dataGridView.AutoSizeRowsMode = DataGridViewAutoSizeRowsMode.AllCells;
            foreach (DataGridViewColumn column in dataGridView.Columns)
            {
                column.DefaultCellStyle.WrapMode = DataGridViewTriState.True;
                column.DefaultCellStyle.ForeColor = CustomColor.Text1;
                column.DefaultCellStyle.Font = font;
            }
            dataGridView.ColumnHeadersDefaultCellStyle = new DataGridViewCellStyle
            {
                BackColor = CustomColor.MainColor20,
                ForeColor = CustomColor.Green,
                Font = font,
                Alignment = DataGridViewContentAlignment.MiddleLeft,
            };
            dataGridView.ColumnHeadersDefaultCellStyle.BackColor = CustomColor.MainColor20;
            dataGridView.ColumnHeadersHeight = 45;
            dataGridView.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
            dataGridView.EnableHeadersVisualStyles = false;
            dataGridView.DefaultCellStyle = new DataGridViewCellStyle
            {
                BackColor = CustomColor.PrimaryBackground,
                ForeColor = CustomColor.Text1,
                Font = font,
                Alignment = DataGridViewContentAlignment.MiddleLeft,
            };
            dataGridView.BackgroundColor = CustomColor.PrimaryBackground;
        }

        public static void CreateButtonColumn(DataGridView dataGridView, string name, string text)
        {
            DataGridViewColumn column = new DataGridViewColumn
            {
                Name = name,
                HeaderText = text,
                AutoSizeMode = DataGridViewAutoSizeColumnMode.None,
                DefaultCellStyle = new DataGridViewCellStyle
                {
                    NullValue = text,
                    Alignment = DataGridViewContentAlignment.MiddleCenter,
                    ForeColor = text.ToLower() == "ukloni" ? CustomColor.Red : CustomColor.Green,
                    Font = font
                },
                CellTemplate = new DataGridViewButtonCell()
                {
                    FlatStyle = FlatStyle.Popup,
                }
            };
            dataGridView.Columns.Add(column);
        }
    }
}
