namespace AIGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class init3 : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Users", "LastLogin", c => c.DateTime());
        }
        
        public override void Down()
        {
            DropColumn("dbo.Users", "LastLogin");
        }
    }
}
