namespace AIGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class init : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.Accreditations",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Type = c.String(),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.AppLogs",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Version = c.String(),
                        Userid = c.String(),
                        Message = c.String(),
                        CreationTime = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Contacts",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Description = c.String(),
                        ApplicationPart = c.String(),
                        CreationTime = c.DateTime(nullable: false),
                        Version = c.String(),
                        Fixed = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.CustomerConstructions",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        WorkOrder = c.String(),
                        CustomerId = c.String(),
                        Location = c.String(),
                        Construction = c.String(),
                        IsActive = c.Boolean(nullable: false),
                        CreationTime = c.DateTime(nullable: false),
                        UpdateTime = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Customers",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Name = c.String(),
                        Address = c.String(),
                        Location = c.String(),
                        WorkOrder = c.String(),
                        PostalCode = c.String(),
                        CreationTime = c.DateTime(nullable: false),
                        UpdateTime = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.ExaminationProcedures",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(),
                        Pressure = c.Int(nullable: false),
                        AllowedLoss = c.Double(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.FileLogs",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        UserId = c.String(),
                        ReportId = c.String(),
                        CreationTime = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Materials",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        TypeId = c.Int(nullable: false),
                        Name = c.String(),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.MaterialTypes",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.ReportDrafts",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        ReportFormTypeId = c.Int(nullable: false),
                        Name = c.String(),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.ReportExportForms",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        FormId = c.String(),
                        ExportId = c.String(),
                        Ordinal = c.Int(nullable: false),
                        CreationTime = c.DateTime(nullable: false),
                        UpdateTime = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.ReportExports",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        ConstructionId = c.String(),
                        CustomerId = c.String(),
                        Certifier = c.String(),
                        UserId = c.String(),
                        Drainage = c.String(),
                        WaterRemark = c.String(),
                        WaterDeviation = c.String(),
                        AirRemark = c.String(),
                        AirDeviation = c.String(),
                        IsFinished = c.Boolean(nullable: false),
                        CertificationTime = c.DateTime(nullable: false),
                        ExaminationDate = c.DateTime(nullable: false),
                        ConstructionPart = c.String(),
                        CreationTime = c.DateTime(nullable: false),
                        UpdateTime = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.ReportFiles",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        ReportExportId = c.String(),
                        PdfId = c.String(),
                        Name = c.String(),
                        Description = c.String(),
                        Ordinal = c.Int(nullable: false),
                        IsImage = c.Boolean(nullable: false),
                        Path = c.String(),
                        Thumbnail = c.String(),
                        Extension = c.String(),
                        CreationTime = c.DateTime(nullable: false),
                        UpdateTime = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.ReportForms",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Ordinal = c.Int(nullable: false),
                        UserId = c.String(),
                        TypeId = c.Int(nullable: false),
                        DraftId = c.Int(nullable: false),
                        Stock = c.String(),
                        ExaminationProcedureId = c.Int(nullable: false),
                        CustomerId = c.String(),
                        Temperature = c.Double(nullable: false),
                        PaneMaterialId = c.Int(nullable: false),
                        ConstructionId = c.String(),
                        MaterialTypeId = c.Int(nullable: false),
                        PipeMaterialId = c.Int(nullable: false),
                        PipeLength = c.Double(nullable: false),
                        PipeDiameter = c.Double(nullable: false),
                        PipelineSlope = c.Double(nullable: false),
                        PaneWidth = c.Double(nullable: false),
                        PaneHeight = c.Double(nullable: false),
                        PaneLength = c.Double(nullable: false),
                        SaturationOfTestSection = c.Double(nullable: false),
                        WaterHeight = c.Double(nullable: false),
                        WaterHeightStart = c.Double(nullable: false),
                        WaterHeightEnd = c.Double(nullable: false),
                        PressureStart = c.Double(nullable: false),
                        PressureEnd = c.Double(nullable: false),
                        RoHeight = c.Double(nullable: false),
                        PaneDiameter = c.Double(nullable: false),
                        StabilizationTime = c.DateTime(nullable: false),
                        SaturationTime = c.DateTime(nullable: false),
                        Satisfies = c.Boolean(nullable: false),
                        Remark = c.String(),
                        Deviation = c.String(),
                        ExaminationDate = c.DateTime(nullable: false),
                        ExaminationDuration = c.DateTime(nullable: false),
                        ExaminationStartTime = c.DateTime(nullable: false),
                        ExaminationEndTime = c.DateTime(nullable: false),
                        CreationTime = c.DateTime(nullable: false),
                        UpdateTime = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.ReportFormTypes",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Type = c.String(),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.UserAccreditations",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        UserId = c.String(),
                        AccreditationId = c.Int(nullable: false),
                        CreationTime = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Users",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Name = c.String(),
                        LastName = c.String(),
                        Username = c.String(),
                        Password = c.String(),
                        IsAdmin = c.Boolean(nullable: false),
                        IsDarkMode = c.Boolean(nullable: false),
                        CreationTime = c.DateTime(nullable: false),
                        UpdateTime = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
        }
        
        public override void Down()
        {
            DropTable("dbo.Users");
            DropTable("dbo.UserAccreditations");
            DropTable("dbo.ReportFormTypes");
            DropTable("dbo.ReportForms");
            DropTable("dbo.ReportFiles");
            DropTable("dbo.ReportExports");
            DropTable("dbo.ReportExportForms");
            DropTable("dbo.ReportDrafts");
            DropTable("dbo.MaterialTypes");
            DropTable("dbo.Materials");
            DropTable("dbo.FileLogs");
            DropTable("dbo.ExaminationProcedures");
            DropTable("dbo.Customers");
            DropTable("dbo.CustomerConstructions");
            DropTable("dbo.Contacts");
            DropTable("dbo.AppLogs");
            DropTable("dbo.Accreditations");
        }
    }
}
