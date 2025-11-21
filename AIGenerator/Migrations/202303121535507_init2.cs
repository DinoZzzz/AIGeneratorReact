namespace AIGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class init2 : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Users", "Version", c => c.String());
        }
        
        public override void Down()
        {
            DropColumn("dbo.Users", "Version");
        }
    }
}
