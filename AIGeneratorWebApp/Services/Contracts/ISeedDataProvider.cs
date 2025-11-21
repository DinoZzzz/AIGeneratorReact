using System.Collections.Generic;
using AIGeneratorWebApp.Models;

namespace AIGeneratorWebApp.Services.Contracts
{
    public interface ISeedDataProvider
    {
        IReadOnlyList<UserProfile> Users { get; }
        IReadOnlyList<CustomerRecord> Customers { get; }
        IReadOnlyList<ReportRecord> Reports { get; }
    }
}
