using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.Common
{
    internal class LoadingScreenHelper
    {
        private static Thread FormThread;
        private static Form FormToDisplay;
        public static bool isActive = false;

        /// <summary>
        /// Starts displaying the logo screen for the user
        /// </summary>
        public static void StartLogoScreen()
        {
            FormThread = new Thread(new ThreadStart(ShowLogoScreen));
            FormThread.SetApartmentState(ApartmentState.STA);
            isActive = true;
            FormThread.Start();
        }

        /// <summary>
        /// Stops the logo or loading screen
        /// </summary>
        public static void EndScreen()
        {
            if (FormToDisplay == null) return;
            if (isActive)
            {
                if (FormToDisplay != null && FormToDisplay.InvokeRequired) FormToDisplay.Invoke(new MethodInvoker(EndScreen));
                else
                {
                    Application.ExitThread();
                    FormToDisplay = null;
                }
                isActive = false;
            }
        }

        /// <summary>
        /// Starts displaying the loading screen for the user
        /// </summary>
        public static void StartLoadingScreen()
        {
            if (isActive) return;
            FormThread = new Thread(new ThreadStart(() => ShowLoadingScreen("Učitavanje...")));
            FormThread.SetApartmentState(ApartmentState.STA);
            isActive = true;
            FormThread.Start();
        }

        /// <summary>
        /// Starts displaying the loading screen for the user
        /// </summary>
        /// <param name="text">The text to display on the form</param>
        public static void StartLoadingScreen(string text)
        {
            if (isActive) return;
            FormThread = new Thread(new ThreadStart(() => ShowLoadingScreen(text)));
            FormThread.SetApartmentState(ApartmentState.STA);
            isActive = true;
            FormThread.Start();
        }

        /// <summary>
        /// Shows the logo form for the user
        /// </summary>
        private static void ShowLogoScreen()
        {
            FormToDisplay = new LoadingDialog("Provjera novih ažuriranja...");
            ShowForm();
        }

        private static void FormToDisplay_FormClosed(object sender, FormClosedEventArgs e)
        {
            Application.Exit();
        }

        /// <summary>
        /// Shows the loading form for the users
        /// </summary>
        /// <param name="text">The form's text</param>
        private static void ShowLoadingScreen(string text)
        {
            FormToDisplay = new LoadingDialog(text);
            FormToDisplay.FormClosed += FormToDisplay_FormClosed;
            ShowForm();
        }

        /// <summary>
        /// Shows the form
        /// </summary>
        private static void ShowForm()
        {
            Application.Run(FormToDisplay);
        }
    }
}
