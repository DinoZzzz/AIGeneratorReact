# AIGeneratorWebApp

This folder hosts a lightweight ASP.NET Core MVC experience that mirrors the WinForms client.

## Features

- Cookie-based login that reuses the same debug credentials (e.g. `debug` / `DebugP4ss`).
- Dashboard with paged customer cards, top customer/examiner widgets, and quick navigation to details.
- Customer pages with construction lists that link directly to report listings.
- Report listing that surfaces construction parts, author/certifier information, and compliance badges.
- Dependency Injection friendly architecture with swappable services (currently seeded in-memory for rapid prototyping).

## Running the app

1. Ensure the .NET 6 SDK is installed locally.
2. From the repository root execute:
   ```bash
   dotnet run --project AIGeneratorWebApp
   ```
3. Navigate to `https://localhost:5001` (or the console URL) and log in with one of the sample accounts defined in `SeedDataProvider` (admin/Admin#123, debug/DebugP4ss, field/FieldP@ss1).

Once the .NET Framework data/services are ported to .NET 6, you can replace the in-memory services by pointing the DI registrations in `Program.cs` to the new implementations.
