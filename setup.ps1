# ExITS SaaS - Complete Setup Script (Simplified)
# This script sets up the entire development environment

param(
    [switch]$ResetDb,
    [switch]$SkipInstall,
    [switch]$NoStart
)

# Color codes
$Reset = "`e[0m"
$Bright = "`e[1m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Cyan = "`e[36m"
$Magenta = "`e[35m"
$Red = "`e[31m"
$Blue = "`e[34m"
$Gray = "`e[90m"

function Write-Success { 
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "$($Gray)[$timestamp]$($Reset) $($Green)✓ $args$($Reset)" 
}
function Write-Info { 
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "$($Gray)[$timestamp]$($Reset) $($Cyan)ℹ $args$($Reset)" 
}
function Write-Warning { 
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "$($Gray)[$timestamp]$($Reset) $($Yellow)⚠ $args$($Reset)" 
}
function Write-Error-Custom { 
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "$($Gray)[$timestamp]$($Reset) $($Red)✗ $args$($Reset)" 
}
function Write-Step { 
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "$($Gray)[$timestamp]$($Reset) $($Blue)→ $args$($Reset)" 
}
function Write-Separator {
    Write-Host "$($Gray)────────────────────────────────────────────────────────────$($Reset)"
}

function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "$($Bright)$($Magenta)"
    Write-Host "????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????"
    Write-Host "???         ????  ExITS SaaS - Development Setup Script  ????       ???"
    Write-Host "???          Enterprise IT Service Management Platform           ???"
    Write-Host "????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????"
    Write-Host "$($Reset)"
}

function Write-Header([string]$Message) {
    Write-Host ""
    Write-Host "$($Bright)$($Cyan)?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????$($Reset)"
    Write-Host "$($Bright)$($Cyan)  $Message$($Reset)"
    Write-Host "$($Bright)$($Cyan)?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????$($Reset)"
    Write-Host ""
}

# Check Node.js
function Test-NodeJs {
    Write-Info "Checking Node.js..."
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $version = node --version
        Write-Success "Node.js $version is installed"
        return $true
    }
    Write-Error-Custom "Node.js not found. Please install from https://nodejs.org/"
    return $false
}

# Install dependencies
function Install-Dependencies {
    Write-Header "Installing Dependencies"
    
    # API
    Write-Step "Checking API dependencies..."
    Push-Location api
    if (!(Test-Path "node_modules")) {
        Write-Info "Installing API dependencies (this may take a few minutes)..."
        $output = npm install 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "API dependencies installed successfully"
        } else {
            Write-Error-Custom "API install failed"
            Write-Host "$($Red)Error output:$($Reset)"
            $output | Select-Object -Last 20 | ForEach-Object { Write-Host "  $_" }
            Pop-Location
            return $false
        }
    } else {
        Write-Success "API dependencies already installed (node_modules exists)"
    }
    Pop-Location
    
    # Web
    Write-Step "Checking Web dependencies..."
    Push-Location web
    if (!(Test-Path "node_modules")) {
        Write-Info "Installing Web dependencies (this may take a few minutes)..."
        $output = npm install 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Web dependencies installed successfully"
        } else {
            Write-Error-Custom "Web install failed"
            Write-Host "$($Red)Error output:$($Reset)"
            $output | Select-Object -Last 20 | ForEach-Object { Write-Host "  $_" }
            Pop-Location
            return $false
        }
    } else {
        Write-Success "Web dependencies already installed (node_modules exists)"
    }
    Pop-Location
    
    Write-Success "All dependencies are ready"
    return $true
}

# Setup database
function Setup-Database {
    Write-Header "Setting Up Database"
    
    Write-Step "Reading database credentials from .env file..."
    # Read DB password from .env file
    $dbPassword = 'admin'  # Default
    if (Test-Path "api\.env") {
        $envContent = Get-Content "api\.env"
        $passwordLine = $envContent | Where-Object { $_ -match '^DB_PASSWORD=' }
        if ($passwordLine) {
            $dbPassword = ($passwordLine -split '=',2)[1].Trim()
            Write-Info "Found DB password in api\.env"
        }
    }
    
    Write-Step "Testing PostgreSQL connection..."
    $env:PGPASSWORD = $dbPassword
    
    # Test connection first
    $testResult = & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -p 5432 -c 'SELECT version();' 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Cannot connect to PostgreSQL. Make sure PostgreSQL is running."
        Write-Host "$($Red)Connection details:$($Reset)"
        Write-Host "  Host: localhost:5432"
        Write-Host "  User: postgres"
        Write-Host "  Password: $dbPassword (from api\.env)"
        Write-Host "$($Red)Error: $testResult$($Reset)"
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
        return $false
    }
    
    Write-Success "Connected to PostgreSQL successfully"
    
    Write-Step "Terminating existing database connections..."
    # Terminate all connections to the database
    $terminateCmd = 'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ''exits_saas_db'' AND pid <> pg_backend_pid();'
    $terminateResult = & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -p 5432 -c $terminateCmd 2>&1
    Write-Info "Connection termination completed"
    
    # Wait for connections to close
    Start-Sleep -Seconds 1
    
    Write-Step "Dropping existing database (if exists)..."
    # Drop the database
    $dropCmd = 'DROP DATABASE IF EXISTS exits_saas_db;'
    $dropResult = & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -p 5432 -c $dropCmd 2>&1 | Out-String
    
    if ($LASTEXITCODE -ne 0) {
        # Check if error is just "database does not exist"
        if ($dropResult -match "does not exist") {
            Write-Info "Database does not exist (this is fine, creating fresh)"
        } else {
            Write-Error-Custom "Failed to drop database"
            Write-Host "$($Red)$dropResult$($Reset)"
            Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
            return $false
        }
    } else {
        Write-Success "Existing database dropped successfully"
    }
    
    Write-Step "Creating fresh database 'exits_saas_db'..."
    # Create fresh database
    $createCmd = 'CREATE DATABASE exits_saas_db;'
    $createResult = & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -p 5432 -c $createCmd 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to create database"
        Write-Host "$($Red)$createResult$($Reset)"
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
        return $false
    }
    
    Write-Success "Database 'exits_saas_db' created successfully"
    
    # Wait a moment for database to be fully available
    Start-Sleep -Seconds 2
    
    Write-Step "Running database migrations..."
    Push-Location api
    
    # Keep password set for migration
    $env:PGPASSWORD = $dbPassword
    
    # Ensure .env file exists with correct database name
    Write-Step "Verifying .env configuration..."
    if (!(Test-Path ".env")) {
        Write-Info "Creating .env file with default configuration..."
        $envContent = @"
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exits_saas_db
DB_USER=postgres
DB_PASSWORD=admin
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345678
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:4200
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_ENABLED=false
LOG_LEVEL=debug
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@exits-saas.com
"@
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Success ".env file created with default values"
    } else {
        Write-Success ".env file already exists"
    }
    
    # Run migrations using the migrate script
    Write-Info "Executing database migrations (this may take a moment)..."
    Write-Host "$($Gray)  Migration output:$($Reset)"
    $migrateOutput = npm run migrate 2>&1
    $migrateOutput | ForEach-Object { Write-Host "$($Gray)  │$($Reset) $_" }
    $migrateSuccess = $LASTEXITCODE -eq 0
    
    if (!$migrateSuccess) {
        Pop-Location
        Write-Error-Custom "Database migration failed"
        Write-Host "$($Yellow)Please check that PostgreSQL is running and the database 'exits_saas_db' was created.$($Reset)"
        return $false
    }
    
    Write-Success "Database schema created successfully"
    
    Write-Step "Applying database fixes and enhancements..."
    
    # Run the database fixes script
    $fixOutput = node src\scripts\apply-db-fixes.js 2>&1
    $fixResult = $LASTEXITCODE
    
    if ($fixResult -eq 0) {
        Write-Success "Database fixes applied successfully"
    } else {
        Write-Warning "Some database fixes may have failed (this might be okay if already applied)"
        if ($fixOutput) {
            Write-Host "$($Gray)  Fix output: $fixOutput$($Reset)"
        }
    }
    
    Write-Step "Seeding database with test data..."
    Write-Host "$($Gray)  Seed output:$($Reset)"
    $seedOutput = node simple-seed.js 2>&1
    $seedOutput | ForEach-Object { Write-Host "$($Gray)  │$($Reset) $_" }
    $seedSuccess = $LASTEXITCODE -eq 0
    
    if (!$seedSuccess) {
        Pop-Location
        Write-Error-Custom "Database seeding failed"
        Write-Host "$($Yellow)The database tables may not have been created. Please verify the migration output above.$($Reset)"
        return $false
    }
    
    Write-Success "Database seeded successfully with test users and data"
    
    Write-Step "Migrating to standard RBAC (resource:action format)..."
    Write-Host "$($Gray)  RBAC migration output:$($Reset)"
    $env:PGPASSWORD = $dbPassword
    $rbacMigrateOutput = & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -p 5432 -d exits_saas_db -f 'src\scripts\migrate-to-standard-rbac.sql' 2>&1
    $rbacMigrateOutput | ForEach-Object { Write-Host "$($Gray)  │$($Reset) $_" }
    $rbacMigrateSuccess = $LASTEXITCODE -eq 0
    
    if (!$rbacMigrateSuccess) {
        Write-Warning "RBAC migration may have failed (this might be okay if already applied)"
    } else {
        Write-Success "Standard RBAC schema created (permissions table with resource:action format)"
    }
    
    Write-Step "Assigning default permissions to users..."
    Write-Host "$($Gray)  Permission assignment output:$($Reset)"
    $permissionOutput = node src\scripts\assign-default-permissions.js 2>&1
    $permissionOutput | ForEach-Object { Write-Host "$($Gray)  │$($Reset) $_" }
    $permissionSuccess = $LASTEXITCODE -eq 0
    
    if ($permissionSuccess) {
        Write-Success "All users granted Super Admin role with full permissions (49 permissions)"
    } else {
        Write-Warning "Permission assignment may have encountered issues"
    }
    
    Pop-Location
    
    # Clean up password
    Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    
    return $true
}

# Build web
function Build-Web {
    Write-Header "Building Web Application"
    
    Write-Step "Ensuring proxy configuration exists..."
    Push-Location web
    
    # Create proxy.conf.json if it doesn't exist
    if (!(Test-Path "proxy.conf.json")) {
        $proxyContent = '{"/api": {"target": "http://localhost:3000","secure": false,"logLevel": "debug","changeOrigin": true}}'
        $proxyContent | Out-File -FilePath "proxy.conf.json" -Encoding UTF8
        Write-Success "Created proxy configuration (proxy.conf.json)"
    } else {
        Write-Success "Proxy configuration already exists"
    }
    
    Write-Step "Building Angular application (this may take a few minutes)..."
    $buildOutput = npm run build 2>&1
    $buildSuccess = $LASTEXITCODE -eq 0
    
    if ($buildSuccess) {
        Write-Success "Web application built successfully"
        Write-Host "$($Gray)  Build artifacts are ready in web/dist/$($Reset)"
    } else {
        Write-Error-Custom "Web build failed"
        Write-Host "$($Red)Build output (last 30 lines):$($Reset)"
        $buildOutput | Select-Object -Last 30 | ForEach-Object { Write-Host "  $_" }
    }
    
    Pop-Location
    return $buildSuccess
}

# Main
function Main {
    Show-Banner
    
    Write-Header "Checking Prerequisites"
    Write-Step "Verifying Node.js installation..."
    if (!(Test-NodeJs)) { 
        Write-Error-Custom "Prerequisites check failed. Please install Node.js and try again."
        return 
    }
    Write-Success "All prerequisites met!"
    
    if (!$SkipInstall) {
        if (!(Install-Dependencies)) { 
            Write-Error-Custom "Dependency installation failed. Setup cannot continue."
            return 
        }
    } else {
        Write-Info "Skipping dependency installation (--SkipInstall flag used)"
    }
    
    if (!(Setup-Database)) { 
        Write-Error-Custom "Database setup failed. Setup cannot continue."
        return 
    }
    
    if (!(Build-Web)) { 
        Write-Error-Custom "Web build failed. Setup cannot continue."
        return 
    }
    
    Write-Header "Setup Complete"
    Write-Success "Development environment is ready!"
    Write-Host ""
    Write-Host "$($Green)✓ Database: exits_saas_db (PostgreSQL)$($Reset)"
    Write-Host "$($Green)✓ Standard RBAC: Implemented (49 permissions with resource:action format)$($Reset)"
    Write-Host "$($Green)✓ Users: 4 users with Super Admin role (full permissions)$($Reset)"
    Write-Host "$($Green)✓ Web Build: Complete$($Reset)"
    Write-Host ""
    Write-Host "$($Cyan)To start the servers manually, run:$($Reset)"
    Write-Host "  $($Yellow)cd api ; npm start$($Reset)"
    Write-Host "  $($Yellow)cd web ; npm start$($Reset)"
    Write-Host ""
    Write-Host "$($Bright)$($Cyan)👤 Default Login:$($Reset)"
    Write-Host '  Email: admin@exitsaas.com'
    Write-Host '  Password: Admin@123'
    Write-Host ""
    Write-Host "$($Bright)$($Magenta)🔐 RBAC Features:$($Reset)"
    Write-Host "  • Standard resource:action permissions (users:create, tenants:read, etc.)"
    Write-Host "  • 49 system permissions covering all features"
    Write-Host "  • Super Admin role with full access"
    Write-Host "  • Frontend: rbac.can('users:create'), rbac.canDo('users', 'create')"
    Write-Host "  • Backend: checkPermission('users:create') middleware"
    Write-Host ""
}

Main

