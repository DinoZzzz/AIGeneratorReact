namespace AIGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class init6 : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.ReportForms", "DepositionalHeight", c => c.Double(nullable: false, defaultValue: 0));
            AddColumn("dbo.ReportFormTypes", "TypeId", c => c.Int(nullable: false));
            AddColumn("dbo.ReportFormTypes", "Name", c => c.String());
            DropColumn("dbo.ReportFormTypes", "Type");
        }
        
        public override void Down()
        {
            AddColumn("dbo.ReportFormTypes", "Type", c => c.String());
            DropColumn("dbo.ReportFormTypes", "Name");
            DropColumn("dbo.ReportFormTypes", "TypeId");
            DropColumn("dbo.ReportForms", "DepositionalHeight");
        }
    }
}
