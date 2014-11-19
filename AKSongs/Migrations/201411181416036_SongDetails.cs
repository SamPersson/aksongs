namespace AKSongs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class SongDetails : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Songs", "Melody", c => c.String());
            AddColumn("dbo.Songs", "Author", c => c.String());
            AddColumn("dbo.Songs", "Year", c => c.Int());
        }
        
        public override void Down()
        {
            DropColumn("dbo.Songs", "Year");
            DropColumn("dbo.Songs", "Author");
            DropColumn("dbo.Songs", "Melody");
        }
    }
}
