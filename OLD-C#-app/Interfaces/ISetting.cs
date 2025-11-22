using Models;

namespace Interfaces
{
    public interface ISetting
    {
        Setting Get();
        bool DarkMode();
        void SaveData(Setting setting);
    }
}
