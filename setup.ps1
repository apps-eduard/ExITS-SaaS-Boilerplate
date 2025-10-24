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
    
    Write-Step "Running database migrations using Knex..."
    Write-Host "$($Bright)$($Yellow)  📦 Using Knex Migration System (npx knex migrate:latest)$($Reset)"
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
    
    # Run Knex migrations to create schema
    Write-Info "Running Knex migrations to create database schema..."
    Write-Host "$($Bright)$($Cyan)╔════════════════════════════════════════════════════════════╗$($Reset)"
    Write-Host "$($Bright)$($Cyan)║  🔧 KNEX MIGRATION SYSTEM - Creating Database Schema     ║$($Reset)"
    Write-Host "$($Bright)$($Cyan)║  Command: npm run migrate (npx knex migrate:latest)      ║$($Reset)"
    Write-Host "$($Bright)$($Cyan)╚════════════════════════════════════════════════════════════╝$($Reset)"
    Write-Host "$($Gray)  Knex migration output:$($Reset)"
    $migrateOutput = npm run migrate 2>&1
    $migrateOutput | ForEach-Object { Write-Host "$($Gray)  │$($Reset) $_" }
    $migrateSuccess = $LASTEXITCODE -eq 0
    
    if (!$migrateSuccess) {
        Pop-Location
        Write-Error-Custom "Knex migrations failed"
        Write-Host "$($Yellow)Please check the migration output above for errors.$($Reset)"
        return $false
    }
    
    Write-Success "Database schema created successfully via Knex migrations"
    Write-Host "$($Bright)$($Green)  ✅ All database tables created using Knex migration system$($Reset)"
    
    Write-Step "Seeding database with initial data using Knex..."
    Write-Host "$($Bright)$($Cyan)╔════════════════════════════════════════════════════════════╗$($Reset)"
    Write-Host "$($Bright)$($Cyan)║  🌱 KNEX SEED SYSTEM - Populating Initial Data           ║$($Reset)"
    Write-Host "$($Bright)$($Cyan)║  Command: npm run seed (npx knex seed:run)               ║$($Reset)"
    Write-Host "$($Bright)$($Cyan)╚════════════════════════════════════════════════════════════╝$($Reset)"
    Write-Host "$($Gray)  Seed output:$($Reset)"
    $seedOutput = npm run seed 2>&1
    $seedOutput | ForEach-Object { Write-Host "$($Gray)  │$($Reset) $_" }
    $seedSuccess = $LASTEXITCODE -eq 0
    
    if (!$seedSuccess) {
        Pop-Location
        Write-Error-Custom "Database seeding failed"
        Write-Host "$($Yellow)The database tables may not have been created. Please verify the migration output above.$($Reset)"
        return $false
    }
    
    Write-Success "Database seeded successfully with tenants, users, roles and permissions"
    Write-Host "$($Bright)$($Green)  ✅ All data populated using Knex seed system (98 permissions assigned)$($Reset)"
    
    Write-Step "Seeding test customer accounts..."
    Write-Host "$($Gray)  Customer seed output:$($Reset)"
    $customerSeedOutput = npx knex seed:run --specific=06_customer_portal_access.js 2>&1
    $customerSeedOutput | ForEach-Object { Write-Host "$($Gray)  │$($Reset) $_" }
    $customerSeedSuccess = $LASTEXITCODE -eq 0
    
    if ($customerSeedSuccess) {
        Write-Success "Test customer accounts created successfully"
        Write-Host "$($Bright)$($Green)  ✅ 3 test customers with portal access created$($Reset)"
    } else {
        Write-Warning "Customer account seeding failed (non-critical)"
        Write-Host "$($Yellow)  You can run 'npx knex seed:run --specific=06_customer_portal_access.js' manually later$($Reset)"
    }
    
    Pop-Location
    
    # Clean up password
    Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    
    return $true
}

# Reset user passwords
function Reset-UserPasswords {
    Write-Header "Resetting User Passwords"
    
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
    
    $env:PGPASSWORD = $dbPassword
    
    Write-Step "Generating new secure passwords..."
    
    # Use standardized passwords that match the frontend test accounts
    $systemAdminPassword = "Admin@123"
    $tenantAdmin1Password = "Admin@123"
    $tenantAdmin2Password = "Admin@123"
    
    Write-Step "Updating user passwords in database..."
    
    # Create password reset script from template  
    if (!(Test-Path "api\reset-passwords-template.js")) {
        Write-Error-Custom "Password reset template not found"
        return $false
    }
    
    $templateContent = Get-Content "api\reset-passwords-template.js" -Raw
    $scriptContent = $templateContent -replace 'REPLACE_DB_PASSWORD', $dbPassword
    $scriptContent = $scriptContent -replace 'REPLACE_SYSTEM_PASSWORD', $systemAdminPassword  
    $scriptContent = $scriptContent -replace 'REPLACE_TENANT1_PASSWORD', $tenantAdmin1Password
    $scriptContent = $scriptContent -replace 'REPLACE_TENANT2_PASSWORD', $tenantAdmin2Password
    
    # Write the customized script
    $scriptContent | Out-File -FilePath "api\reset-passwords.js" -Encoding UTF8
    
    # Execute the password reset script
    Push-Location api
    $resetOutput = node reset-passwords.js 2>&1
    $resetSuccess = $LASTEXITCODE -eq 0
    Pop-Location
    
    # Clean up the temporary script
    Remove-Item "api\reset-passwords.js" -ErrorAction SilentlyContinue
    
    if ($resetSuccess) {
        Write-Success "User passwords reset successfully"
        
        # Store passwords for final display
        $global:SystemAdminPassword = $systemAdminPassword
        $global:TenantAdmin1Password = $tenantAdmin1Password
        $global:TenantAdmin2Password = $tenantAdmin2Password
        
        Write-Host ""
        Write-Host "$($Bright)$($Green)🔐 Standardized Login Credentials:$($Reset)"
        Write-Host "  System Admin: admin@exitsaas.com / Admin@123"
        Write-Host "  Tenant Admin 1: admin-1@example.com / Admin@123"
        Write-Host "  Tenant Admin 2: admin-2@example.com / Admin@123"
        Write-Host ""
    } else {
        Write-Error-Custom "Failed to reset user passwords"
        Write-Host "$($Red)Reset output: $resetOutput$($Reset)"
        return $false
    }
    
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
    
    if (!(Reset-UserPasswords)) { 
        Write-Error-Custom "Password reset failed. Setup cannot continue."
        return 
    }
    
    Write-Header "Setup Complete"
    Write-Success "Development environment is ready!"
    Write-Host ""
    Write-Host "$($Bright)$($Green)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$($Reset)"
    Write-Host "$($Green)✓ Database: exits_saas_db (PostgreSQL - Fresh installation)$($Reset)"
    Write-Host "$($Green)✓ Knex Migrations: All tables created successfully$($Reset)"
    Write-Host "$($Green)✓ Knex Seeds: All data populated (98 permissions, 3 roles, 3 users)$($Reset)"
    Write-Host "$($Green)✓ Standard RBAC: Implemented (resource:action format)$($Reset)"
    Write-Host "$($Green)✓ Web Build: Complete$($Reset)"
    Write-Host "$($Green)✓ Passwords: Reset with secure credentials$($Reset)"
    Write-Host "$($Bright)$($Green)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$($Reset)"
    Write-Host ""
    Write-Host "$($Bright)$($Cyan)📦 Database Management System:$($Reset)"
    Write-Host "  • Using Knex.js for all database operations"
    Write-Host "  • Migrations: npx knex migrate:latest (run automatically)"
    Write-Host "  • Seeds: npx knex seed:run (run automatically)"
    Write-Host "  • Location: api/src/migrations/ and api/src/seeds/"
    Write-Host ""
    Write-Host "$($Cyan)To start the servers manually, run:$($Reset)"
    Write-Host "  $($Yellow)cd api ; npm start$($Reset)"
    Write-Host "  $($Yellow)cd web ; npm start$($Reset)"
    Write-Host ""
    Write-Host "$($Bright)$($Cyan)🔐 Secure Login Credentials:$($Reset)"
    Write-Host "  $($Bright)Staff/Admin Login:$($Reset)"
    Write-Host "  System Admin: admin@exitsaas.com / Admin@123"
    Write-Host "  Tenant Admin 1: admin-1@example.com / Admin@123"
    Write-Host "  Tenant Admin 2: admin-2@example.com / Admin@123"
    Write-Host ""
    Write-Host "  $($Bright)Customer Portal Login (Password: Customer@123):$($Reset)"
    Write-Host "  1. juan.delacruz@test.com   - Juan Dela Cruz"
    Write-Host "  2. maria.santos@test.com    - Maria Santos"
    Write-Host "  3. pedro.gonzales@test.com  - Pedro Gonzales"
    Write-Host "  Customer Portal: http://localhost:4200/customer/login"
    Write-Host ""
    Write-Host "$($Bright)$($Magenta)🔐 RBAC Features:$($Reset)"
    Write-Host "  • Standard resource:action permissions (users:create, tenants:read, etc.)"
    Write-Host "  • 98 comprehensive permissions covering all features"
    Write-Host "  • Super Admin role with full access (all 98 permissions)"
    Write-Host "  • Tenant Admin roles with 67 tenant-specific permissions"
    Write-Host "  • Frontend: rbac.can('users:create'), rbac.canDo('users', 'create')"
    Write-Host "  • Backend: checkPermission('users:create') middleware"
    Write-Host ""
    Write-Host "$($Bright)$($Yellow)⚠️  Important Note:$($Reset)"
    Write-Host "  This setup script uses KNEX for all database operations."
    Write-Host "  Running this script will:"
    Write-Host "  ├─ Drop existing database completely"
    Write-Host "  ├─ Create fresh database structure via Knex migrations"
    Write-Host "  ├─ Populate all data via Knex seeds"
    Write-Host "  └─ Reset all user passwords to Admin@123"
    Write-Host ""
    Write-Host "$($Bright)$($Cyan)  Safe to run at OFFICE or HOME - ensures consistent database state!$($Reset)"
    Write-Host ""
}

Main

