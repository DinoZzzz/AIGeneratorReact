namespace AIGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class init4 : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.ReportTypes",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Type = c.String(),
                    })
                .PrimaryKey(t => t.Id);
            
            AddColumn("dbo.ReportDrafts", "DraftId", c => c.Int(nullable: false));
            DropColumn("dbo.ReportDrafts", "Name");
        }
        
        public override void Down()
        {
            AddColumn("dbo.ReportDrafts", "Name", c => c.String());
            DropColumn("dbo.ReportDrafts", "DraftId");
            DropTable("dbo.ReportTypes");
        }
    }
}
