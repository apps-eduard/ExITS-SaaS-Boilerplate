# ExITS SaaS - NestJS Setup Script
# This script sets up the development environment using NestJS backend

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
    Write-Host "$($Gray)[$timestamp]$($Reset) $($Green)[OK]$($Reset) $args" 
}
function Write-Info { 
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "$($Gray)[$timestamp]$($Reset) $($Cyan)[INFO]$($Reset) $args" 
}
function Write-Warning { 
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "$($Gray)[$timestamp]$($Reset) $($Yellow)[WARN]$($Reset) $args" 
}
function Write-Error-Custom { 
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "$($Gray)[$timestamp]$($Reset) $($Red)[ERR]$($Reset) $args" 
}
function Write-Step { 
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "$($Gray)[$timestamp]$($Reset) $($Blue)=>$($Reset) $args" 
}

function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "$($Bright)$($Magenta)===================================================="
    Write-Host "||  ExITS SaaS - NestJS Setup Script                      ||"
    Write-Host "||  Enterprise IT Service Management Platform             ||"
    Write-Host "||  Powered by NestJS + PostgreSQL + Angular              ||"
    Write-Host "====================================================$($Reset)"
}

function Write-Header([string]$Message) {
    Write-Host ""
    Write-Host "$($Bright)$($Cyan)===========================================================$($Reset)"
    Write-Host "$($Bright)$($Cyan)  $Message$($Reset)"
    Write-Host "$($Bright)$($Cyan)===========================================================$($Reset)"
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
    
    # NestJS API
    Write-Step "Checking NestJS API dependencies..."
    Push-Location nest-api
    if (!(Test-Path "node_modules")) {
        Write-Info "Installing NestJS API dependencies (this may take a few minutes)..."
        $output = npm install 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "NestJS API dependencies installed successfully"
        } else {
            Write-Error-Custom "NestJS API install failed"
            Write-Host "$($Red)Error output:$($Reset)"
            $output | Select-Object -Last 20 | ForEach-Object { Write-Host "  $_" }
            Pop-Location
            return $false
        }
    } else {
        Write-Success "NestJS API dependencies already installed"
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
        Write-Success "Web dependencies already installed"
    }
    Pop-Location
    
    # LoanFlow
    Write-Step "Checking LoanFlow dependencies..."
    Push-Location loanflow
    if (!(Test-Path "node_modules")) {
        Write-Info "Installing LoanFlow dependencies (this may take a few minutes)..."
        $output = npm install 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "LoanFlow dependencies installed successfully"
        } else {
            Write-Error-Custom "LoanFlow install failed"
            Write-Host "$($Red)Error output:$($Reset)"
            $output | Select-Object -Last 20 | ForEach-Object { Write-Host "  $_" }
            Pop-Location
            return $false
        }
    } else {
        Write-Success "LoanFlow dependencies already installed"
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
    if (Test-Path "nest-api\.env") {
        $envContent = Get-Content "nest-api\.env"
        $passwordLine = $envContent | Where-Object { $_ -match '^DB_PASSWORD=' }
        if ($passwordLine) {
            $dbPassword = ($passwordLine -split '=',2)[1].Trim()
            Write-Info "Found DB password in nest-api\.env"
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
        Write-Host "  Password: $dbPassword (from nest-api\.env)"
        Write-Host "$($Red)Error: $testResult$($Reset)"
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
        return $false
    }
    
    Write-Success "Connected to PostgreSQL successfully"
    
    Write-Step "Terminating existing database connections..."
    $terminateCmd = 'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ''exits_saas_db'' AND pid <> pg_backend_pid();'
    $terminateResult = & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -p 5432 -c $terminateCmd 2>&1
    Write-Info "Connection termination completed"
    
    Start-Sleep -Seconds 1
    
    Write-Step "Dropping existing database (if exists)..."
    $dropCmd = 'DROP DATABASE IF EXISTS exits_saas_db;'
    $dropResult = & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -p 5432 -c $dropCmd 2>&1 | Out-String
    
    if ($LASTEXITCODE -ne 0) {
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
    $createCmd = 'CREATE DATABASE exits_saas_db;'
    $createResult = & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -p 5432 -c $createCmd 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to create database"
        Write-Host "$($Red)$createResult$($Reset)"
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
        return $false
    }
    
    Write-Success "Database 'exits_saas_db' created successfully"
    
    Start-Sleep -Seconds 2
    
    Write-Step "Running NestJS database migrations using Knex..."
    Write-Host "$($Bright)$($Yellow)  📦 Using NestJS Knex Migration System$($Reset)"
    Push-Location nest-api
    
    $env:PGPASSWORD = $dbPassword
    
    # Ensure .env file exists
    Write-Step "Verifying .env configuration..."
    if (!(Test-Path ".env")) {
        Write-Info "Creating .env file with default configuration..."
        $envContent = @"
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exits_saas_db
DB_USER=postgres
DB_PASSWORD=admin
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345678
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:4200
"@
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Success ".env file created"
    } else {
        Write-Success ".env file already exists"
    }
    
    # Run Knex migrations
    Write-Info "Running Knex migrations to create database schema..."
    Write-Host "$($Bright)$($Cyan)+============================================================+$($Reset)"
    Write-Host "$($Bright)$($Cyan)|  NESTJS KNEX MIGRATION - Creating Database Schema       |$($Reset)"
    Write-Host "$($Bright)$($Cyan)|  Command: npx knex migrate:latest                       |$($Reset)"
    Write-Host "$($Bright)$($Cyan)+=========================================================+$($Reset)"
    Write-Host "$($Gray)  Migration output:$($Reset)"
    $migrateOutput = npx knex migrate:latest 2>&1
    $migrateOutput | ForEach-Object { Write-Host "$($Gray)  |$($Reset) $_" }
    $migrateSuccess = $LASTEXITCODE -eq 0
    
    if (!$migrateSuccess) {
        Pop-Location
        Write-Error-Custom "Knex migrations failed"
        return $false
    }
    
    Write-Success "Database schema created successfully (34 migrations)"
    
    Write-Step "Seeding database with initial data using Knex..."
    Write-Host "$($Bright)$($Cyan)+============================================================+$($Reset)"
    Write-Host "$($Bright)$($Cyan)|  NESTJS KNEX SEED - Populating Initial Data             |$($Reset)"
    Write-Host "$($Bright)$($Cyan)|  Command: npx knex seed:run                              |$($Reset)"
    Write-Host "$($Bright)$($Cyan)+============================================================+$($Reset)"
    Write-Host "$($Gray)  Seed output:$($Reset)"
    $seedOutput = npx knex seed:run 2>&1
    $seedOutput | ForEach-Object { Write-Host "$($Gray)  |$($Reset) $_" }
    $seedSuccess = $LASTEXITCODE -eq 0
    
    if (!$seedSuccess) {
        Pop-Location
        Write-Error-Custom "Database seeding failed"
        return $false
    }
    
    Write-Success "Database seeded successfully"
    
    Pop-Location
    Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    
    return $true
}

# Build web
function Build-Web {
    Write-Header "Building Web Application"
    
    Write-Step "Ensuring proxy configuration exists..."
    Push-Location web
    
    if (!(Test-Path "proxy.conf.json")) {
        $proxyContent = @"
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "logLevel": "debug",
    "changeOrigin": true
  }
}
"@
        $proxyContent | Out-File -FilePath "proxy.conf.json" -Encoding UTF8
        Write-Success "Created proxy configuration"
    } else {
        Write-Success "Proxy configuration exists"
    }
    
    Write-Step "Building Angular application..."
    $buildOutput = npm run build 2>&1
    $buildSuccess = $LASTEXITCODE -eq 0
    
    if ($buildSuccess) {
        Write-Success "Web application built successfully"
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
    if (!(Test-NodeJs)) { 
        Write-Error-Custom "Prerequisites check failed"
        return 
    }
    Write-Success "All prerequisites met!"
    
    if (!$SkipInstall) {
        if (!(Install-Dependencies)) { 
            Write-Error-Custom "Dependency installation failed"
            return 
        }
    }
    
    if (!(Setup-Database)) { 
        Write-Error-Custom "Database setup failed"
        return 
    }
    
    if (!(Build-Web)) { 
        Write-Error-Custom "Web build failed"
        return 
    }
    
    Write-Header "Setup Complete"
    Write-Success "Development environment is ready!"
    Write-Host ""
    Write-Host "$($Bright)$($Green)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$($Reset)"
    Write-Host "$($Green)✓ Backend: NestJS (TypeScript)$($Reset)"
    Write-Host "$($Green)✓ Database: exits_saas_db (PostgreSQL - Fresh)$($Reset)"
    Write-Host "$($Green)✓ Migrations: 34 migrations completed$($Reset)"
    Write-Host "$($Green)✓ Seeds: All data populated$($Reset)"
    Write-Host "$($Green)✓ Web Build: Complete$($Reset)"
    Write-Host "$($Bright)$($Green)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$($Reset)"
    Write-Host ""
    Write-Host "$($Bright)$($Cyan)📦 NestJS Backend:$($Reset)"
    Write-Host "  • Location: nest-api/"
    Write-Host "  • Migrations: npx knex migrate:latest"
    Write-Host "  • Seeds: npx knex seed:run"
    Write-Host "  • Start: npm run start:dev"
    Write-Host ""
    Write-Host "$($Cyan)To start the servers:$($Reset)"
    Write-Host "  $($Yellow)cd nest-api ; npm run start:dev$($Reset)"
    Write-Host "  $($Yellow)cd web ; npm start$($Reset)"
    Write-Host ""
    Write-Host "$($Bright)$($Cyan)🔐 Default Login Credentials:$($Reset)"
    Write-Host "  System Admin: admin@exitsaas.com / Admin@123"
    Write-Host "  Tenant Admin (ACME): admin-1@example.com / Admin@123"
    Write-Host "  Customer Portal: juan.delacruz@test.com / Admin@123"
    Write-Host ""
    Write-Host "$($Bright)$($Magenta)🚀 Access Points:$($Reset)"
    Write-Host "  • Staff Portal: http://localhost:4200/platform/login"
    Write-Host "  • Customer Portal: http://localhost:4200/customer/login"
    Write-Host "  • API: http://localhost:3000/api"
    Write-Host ""
}

Main
