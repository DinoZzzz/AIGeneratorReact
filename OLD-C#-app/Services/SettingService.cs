using Common;
using Interfaces;
using Models;
using Newtonsoft.Json;
using Repositories;
using System.IO;
using System.Linq;
using System.Runtime;

namespace Services
{
    public class SettingService : ISetting
    {
        public Setting Get()
        {
            Setting setting;
            if (!File.Exists(AppData.SETTINGS_PATH))
            {
                setting = new Setting();
                SaveData(setting);
            }
            else
            {
                using (StreamReader sr = new StreamReader(AppData.SETTINGS_PATH))
                using (JsonTextReader reader = new JsonTextReader(sr))
                {
                    JsonSerializer serializer = new JsonSerializer();
                    setting = serializer.Deserialize<Setting>(reader);
                }
            }
            return setting;
        }

        public bool DarkMode() => Get().DarkMode;

        public void SaveData(Setting setting) => File.WriteAllText(AppData.SETTINGS_PATH, JsonConvert.SerializeObject(setting));
    }
}
