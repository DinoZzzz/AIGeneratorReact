using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common
{
    public class AppData
    {
        public const string AdminId = "fbcac85b-33ea-4610-8525-8ed20df22bc4";
        public const string DebugId = "a041e475-25b2-49c2-9115-09a6f4f93153";
        public const string AI_FTP_USERNAME = "karlo";
        public const string AI_FTP_PASSWORD = "12Imotski34";
        public const string AI_FTP_HOST = "ftp://aistari.ddns.net";
        public static readonly string FTP_USERNAME = $"{FTP_DOMAIN}|aigenerator_user";
        public const string FTP_PASSWORD = "jK@P#66f291o";
        public const string APP_NAME = "AIGenerator.exe";
        public const string UPDATER_NAME = "AIGeneratorUpdater.exe";
#if TEST
        public const string FILES_FOLDER_NAME = "AIGeneratorFilesTest";
        public const string APP_FOLDER_NAME = "AIGeneratorTest";
#else
        public const string FILES_FOLDER_NAME = "AIGeneratorFiles";
        public const string APP_FOLDER_NAME = "AIGenerator";
#endif
        public const string PRODUCT_CODE = "{5CA5A6AB-A672-485E-A9E0-D00E7E764256}";
        public const string FTP_DOMAIN = "ftp.digitando-server.com.hr";
#if RELEASE
        public const string FTP_HOST = "ftp://ftp.digitando-server.com.hr/AIGenerator";
#else
        public const string FTP_HOST = "ftp://ftp.digitando-server.com.hr/AIGeneratorTest";
#endif
        public static string APP_EXE_PATH;
        public static string FILES_FOLDER_PATH;
        public static string UPDATER_PATH;
        public static string TEMP_FOLDER_PATH;
        public static string INSTALL_FOLDER_PATH;
        public static string SETTINGS_PATH;
#if DEBUG
        public const string SERVER_URL = "https://test.digitando-server.com.hr/";
        public const string CONNECTION_STRING = "Server=194.36.45.88,1433;Database=AIGenerator_Dev;User id=digitando;password=54Ac%vWuQ1f*;MultipleActiveResultSets=true";
#elif TEST
        public const string SERVER_URL = "https://test.digitando-server.com.hr/";
        public const string CONNECTION_STRING = "Server=194.36.45.88,1433;Database=AIGenerator_Dev;User id=digitando;password=54Ac%vWuQ1f*;MultipleActiveResultSets=true";
#else
        public const string SERVER_URL = "https://live.digitando-server.com.hr/";
        public const string CONNECTION_STRING = "Server=194.36.45.88,1433;Database=AIGenerator_Live;User id=digitando;password=54Ac%vWuQ1f*;MultipleActiveResultSets=true";
#endif

        static AppData()
        {
            INSTALL_FOLDER_PATH = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), APP_FOLDER_NAME);
            APP_EXE_PATH = Path.Combine(INSTALL_FOLDER_PATH, APP_NAME);
            FILES_FOLDER_PATH = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), FILES_FOLDER_NAME);
            UPDATER_PATH = Path.Combine(FILES_FOLDER_PATH, UPDATER_NAME);
            TEMP_FOLDER_PATH = Path.Combine(Path.GetTempPath(), APP_FOLDER_NAME);
            SETTINGS_PATH = Path.Combine(FILES_FOLDER_PATH, "settings.json");
        }
    }
}
