using AIGenerator.AppBindings;
using AIGenerator.Forms;
using Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AIGenerator.Common
{
    public class ExceptionHelper
    {
        public static void SaveLog(Exception exception)
        {
            CompositionRoot.Resolve<IAppLog>().AddAndSave(new Models.AppLog { Message = exception.ToString(), Userid = LoginForm.currentUser == null ? "" : LoginForm.currentUser.Id, Version = VersionClass.GetVersion() });
        }
    }
}
