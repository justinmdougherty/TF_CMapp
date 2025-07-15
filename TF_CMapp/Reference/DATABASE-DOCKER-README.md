# TFPM Database Docker Setup

This directory contains Docker configuration files to run Microsoft SQL Server for the TFPM (TF Project Management) application.

## Prerequisites

1. **Docker Desktop** - Install from [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. **Docker Compose** - Usually included with Docker Desktop

## Quick Start

### Option 1: Using PowerShell Script (Recommended for Windows)

```powershell
# Start the database (automatically initializes on first run)
.\database-docker.ps1 start

# Check status
.\database-docker.ps1 status

# View logs
.\database-docker.ps1 logs

# Initialize database manually (if needed)
.\database-docker.ps1 init

# Stop the database
.\database-docker.ps1 stop
```

### Option 2: Manual Setup

```bash
# Start the database
docker-compose up -d

# Wait for the database to be ready (about 30 seconds)
# Then initialize the database schema
powershell -ExecutionPolicy Bypass -File ".\init-database.ps1"

# Check logs
docker-compose logs -f

# Stop the database
docker-compose down
```

## Database Connection Details

Once the container is running, you can connect to the database using:

- **Server**: `localhost,1433` or `localhost:1433`
- **Username**: `SA`
- **Password**: `TFPMPassword123!`
- **Database**: `TFPM`

## Files Description

- **`docker-compose.yml`** - Docker Compose configuration for MSSQL Server
- **`database-docker.ps1`** - PowerShell management script
- **`database-docker.bat`** - Batch file management script (legacy)
- **`init-database.ps1`** - PowerShell database initialization script
- **`init-database.sh`** - Bash database initialization script (for Linux/Mac)
- **`mssql.sql`** - Your database schema and initial data
- **`.env.template`** - Environment variables template

## Database Schema

The database includes the following main tables:

- **Projects** - Product lines or project types
- **InventoryItems** - Master catalog of parts/materials
- **AttributeDefinitions** - Custom fields for project items
- **ProjectSteps** - Production/assembly steps
- **TrackedItems** - Individual units being produced
- **StepInventoryRequirements** - Links steps to required inventory
- **ItemAttributeValues** - Attribute values for tracked items
- **TrackedItemStepProgress** - Step completion tracking
- **InventoryTransactions** - Inventory change audit log

## Management Commands

### PowerShell Script Commands

```powershell
.\database-docker.ps1 start    # Start the database container
.\database-docker.ps1 stop     # Stop the database container
.\database-docker.ps1 restart  # Restart the database container
.\database-docker.ps1 logs     # Show container logs
.\database-docker.ps1 status   # Show container status
.\database-docker.ps1 clean    # Remove container and volumes (WARNING: Deletes all data!)
.\database-docker.ps1 connect  # Connect to database using sqlcmd
.\database-docker.ps1 init     # Initialize database schema (run after first start)
```

## Connecting from Your Application

Update your application's database connection string to:

```
Server=localhost,1433;Database=TFPM;User Id=SA;Password=TFPMPassword123!;TrustServerCertificate=true;
```

## Data Persistence

The database data is stored in a Docker volume named `mssql-data`. This means:

- Data persists between container restarts
- Data is lost only when you run the `clean` command
- You can backup the volume if needed

## Troubleshooting

### Container Won't Start

1. Make sure Docker Desktop is running
2. Check if port 1433 is available:
   ```powershell
   netstat -an | findstr :1433
   ```
3. View container logs:
   ```powershell
   .\database-docker.ps1 logs
   ```

### Can't Connect to Database

1. Wait 30-60 seconds after starting for full initialization
2. Check container health:
   ```powershell
   .\database-docker.ps1 status
   ```
3. Verify the password is correct: `TFPMPassword123!`

### Permission Issues

If you get permission errors on Windows:

1. Run PowerShell as Administrator
2. Or use the batch file instead

### Database Initialization Failed

If the database schema isn't created:

1. Check the logs for SQL errors
2. Make sure the `mssql.sql` file is in the same directory
3. Try cleaning and restarting:
   ```powershell
   .\database-docker.ps1 clean
   .\database-docker.ps1 start
   ```

## Security Notes

- The SA password is set to `TFPMPassword123!` for development
- Change this password for production use
- The database is only accessible from localhost by default
- Consider using Windows Authentication or Azure AD for production

## Customization

### Changing the Password

1. Edit `docker-compose.yml` and change the `SA_PASSWORD` value
2. Update the password in the management scripts
3. Rebuild the container:
   ```powershell
   .\database-docker.ps1 clean
   .\database-docker.ps1 start
   ```

### Adding Initial Data

Add INSERT statements to the `mssql.sql` file to populate tables with initial data.

### Using Different SQL Server Version

Change the base image in `Dockerfile.mssql`:

```dockerfile
FROM mcr.microsoft.com/mssql/server:2019-latest
```

## Backup and Restore

### Creating a Backup

```powershell
# Connect to the database
.\database-docker.ps1 connect

# Run SQL backup command
BACKUP DATABASE TFPM TO DISK = '/var/opt/mssql/backup/tfpm_backup.bak'
```

### Restoring from Backup

```powershell
# Connect to the database
.\database-docker.ps1 connect

# Run SQL restore command
RESTORE DATABASE TFPM FROM DISK = '/var/opt/mssql/backup/tfpm_backup.bak'
```

## Support

For issues with this Docker setup, check:

1. Docker Desktop logs
2. Container logs: `.\database-docker.ps1 logs`
3. SQL Server documentation: [https://docs.microsoft.com/en-us/sql/](https://docs.microsoft.com/en-us/sql/)
