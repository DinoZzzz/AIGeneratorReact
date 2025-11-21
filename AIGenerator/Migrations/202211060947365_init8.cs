namespace AIGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class init8 : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.Stocks",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        TypeId = c.Int(nullable: false),
                        Name = c.String(),
                        AllowedLoss = c.Double(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            AddColumn("dbo.ReportForms", "StockId", c => c.Int(nullable: false));
            AddColumn("dbo.ReportForms", "Temperature", c => c.Double(nullable: false));
            DropColumn("dbo.Reports", "Temperature");
            DropColumn("dbo.Reports", "Stock");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Reports", "Stock", c => c.String());
            AddColumn("dbo.Reports", "Temperature", c => c.Double(nullable: false));
            DropColumn("dbo.ReportForms", "Temperature");
            DropColumn("dbo.ReportForms", "StockId");
            DropTable("dbo.Stocks");
        }
    }
}
