namespace AIGenerator.Migrations
{
    using AIGenerator.Common;
    using Interfaces;
    using Models;
    using Models.Common;
    using System;
    using System.Data.Entity;
    using System.Data.Entity.Migrations;
    using System.Linq;

    internal sealed class Configuration : DbMigrationsConfiguration<AppDbContext>
    {
        public Configuration()
        {
            AutomaticMigrationsEnabled = false;
        }

        protected override void Seed(AppDbContext context)
        {
            DatabaseInitializer.OnlineSeed(context);
        }
    }
}
