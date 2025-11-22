using System;
using System.Collections.Generic;
using AIGeneratorWebApp.Models;
using AIGeneratorWebApp.Services.Contracts;
using System.Linq;

namespace AIGeneratorWebApp.Services.Implementations
{
    public class SeedDataProvider : ISeedDataProvider
    {
        public IReadOnlyList<UserProfile> Users { get; }
        public IReadOnlyList<CustomerRecord> Customers { get; }
        public IReadOnlyList<ReportRecord> Reports { get; }

        public SeedDataProvider()
        {
            Users = BuildUsers();
            Customers = BuildCustomers();
            Reports = BuildReports(Customers, Users);
        }

        private static List<UserProfile> BuildUsers() => new()
        {
            new UserProfile
            {
                Id = Guid.NewGuid().ToString(),
                Username = "admin",
                Password = "Admin#123",
                FirstName = "Antonia",
                LastName = "Examiner",
                IsAdmin = true,
                IsDarkMode = false
            },
            new UserProfile
            {
                Id = Guid.NewGuid().ToString(),
                Username = "debug",
                Password = "DebugP4ss",
                FirstName = "Dario",
                LastName = "Inspector",
                IsDarkMode = true
            },
            new UserProfile
            {
                Id = Guid.NewGuid().ToString(),
                Username = "field",
                Password = "FieldP@ss1",
                FirstName = "Maja",
                LastName = "Fieldtech",
                IsDarkMode = true
            }
        };

        private static List<CustomerRecord> BuildCustomers()
        {
            var digitando = new CustomerRecord
            {
                Name = "Digitando Utilities",
                Location = "Split",
                WorkOrder = "DG-001"
            };
            digitando.Constructions.AddRange(new[]
            {
                new CustomerConstructionRecord { CustomerId = digitando.Id, WorkOrder = "DG-001", Construction = "Pump Station A" },
                new CustomerConstructionRecord { CustomerId = digitando.Id, WorkOrder = "DG-001", Construction = "Reservoir 3", IsActive = false },
                new CustomerConstructionRecord { CustomerId = digitando.Id, WorkOrder = "DG-002", Construction = "Collector North" }
            });

            var adriatic = new CustomerRecord
            {
                Name = "Adriatic Water",
                Location = "Zadar",
                WorkOrder = "AW-908"
            };
            adriatic.Constructions.AddRange(new[]
            {
                new CustomerConstructionRecord { CustomerId = adriatic.Id, WorkOrder = "AW-908", Construction = "Shaft 12" },
                new CustomerConstructionRecord { CustomerId = adriatic.Id, WorkOrder = "AW-908", Construction = "Shaft 13" }
            });

            var coastal = new CustomerRecord
            {
                Name = "Coastal Drainage",
                Location = "Dubrovnik",
                WorkOrder = "CD-301"
            };
            coastal.Constructions.Add(new CustomerConstructionRecord { CustomerId = coastal.Id, WorkOrder = "CD-301", Construction = "Sanitation Segment 5" });

            return new List<CustomerRecord> { digitando, adriatic, coastal };
        }

        private static List<ReportRecord> BuildReports(IEnumerable<CustomerRecord> customers, IEnumerable<UserProfile> users)
        {
            var list = new List<ReportRecord>();
            var rnd = new Random(1234);
            foreach (var customer in customers)
            {
                foreach (var construction in customer.Constructions)
                {
                    for (var i = 0; i < rnd.Next(2, 6); i++)
                    {
                        var inspector = users.ElementAt(rnd.Next(users.Count()));
                        var certifier = users.ElementAt(rnd.Next(users.Count()));
                        list.Add(new ReportRecord
                        {
                            CustomerId = customer.Id,
                            ConstructionId = construction.Id,
                            ConstructionPart = $"{construction.Construction} - Segment {i + 1}",
                            UserId = inspector.Id,
                            CertifierId = certifier.Id,
                            FormsCount = rnd.Next(1, 5),
                            Satisfies = rnd.NextDouble() > 0.2,
                            CreationTime = DateTime.UtcNow.AddDays(-rnd.Next(1, 60))
                        });
                    }
                }
            }
            return list;
        }
    }
}
