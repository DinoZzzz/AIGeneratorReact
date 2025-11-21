namespace AIGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class init1 : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.ReportExports", "CertifierId", c => c.String(defaultValue: ""));
            AddColumn("dbo.Users", "Title", c => c.String(defaultValue: ""));
            DropColumn("dbo.ReportExports", "Certifier");
        }
        
        public override void Down()
        {
            AddColumn("dbo.ReportExports", "Certifier", c => c.String());
            DropColumn("dbo.Users", "Title");
            DropColumn("dbo.ReportExports", "CertifierId");
        }
    }
}
