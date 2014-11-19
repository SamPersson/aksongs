namespace AKSongs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class Notications : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.Notifications",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        SongId = c.String(maxLength: 128),
                        Created = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Songs", t => t.SongId)
                .Index(t => t.SongId);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.Notifications", "SongId", "dbo.Songs");
            DropIndex("dbo.Notifications", new[] { "SongId" });
            DropTable("dbo.Notifications");
        }
    }
}
