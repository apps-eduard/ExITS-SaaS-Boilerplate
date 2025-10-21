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

function Write-Success { Write-Host "$($Green)✓ $args$($Reset)" }
function Write-Info { Write-Host "$($Cyan)ℹ $args$($Reset)" }
function Write-Warning { Write-Host "$($Yellow)⚠ $args$($Reset)" }
function Write-Error-Custom { Write-Host "$($Magenta)✗ $args$($Reset)" }

function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "$($Bright)$($Magenta)"
    Write-Host "╔══════════════════════════════════════════════════════════════╗"
    Write-Host "║         🚀  ExITS SaaS - Development Setup Script  🚀       ║"
    Write-Host "║          Enterprise IT Service Management Platform           ║"
    Write-Host "╚══════════════════════════════════════════════════════════════╝"
    Write-Host "$($Reset)"
}

function Write-Header([string]$Message) {
    Write-Host ""
    Write-Host "$($Bright)$($Cyan)═══════════════════════════════════════════════════════════════$($Reset)"
    Write-Host "$($Bright)$($Cyan)  $Message$($Reset)"
    Write-Host "$($Bright)$($Cyan)═══════════════════════════════════════════════════════════════$($Reset)"
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
    Write-Info "Installing API dependencies..."
    Push-Location api
    if (!(Test-Path "node_modules")) {
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Success "API dependencies installed"
        } else {
            Write-Error-Custom "API install failed"
            Pop-Location
            return $false
        }
    } else {
        Write-Success "API dependencies already installed"
    }
    Pop-Location
    
    # Web
    Write-Info "Installing Web dependencies..."
    Push-Location web
    if (!(Test-Path "node_modules")) {
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Web dependencies installed"
        } else {
            Write-Error-Custom "Web install failed"
            Pop-Location
            return $false
        }
    } else {
        Write-Success "Web dependencies already installed"
    }
    Pop-Location
    
    return $true
}

# Setup database
function Setup-Database {
    Write-Header "Setting Up Database"
    
    Write-Info "Reading database credentials from .env file..."
    # Read DB password from .env file
    $dbPassword = 'admin'  # Default
    if (Test-Path "api\.env") {
        $envContent = Get-Content "api\.env"
        $passwordLine = $envContent | Where-Object { $_ -match '^DB_PASSWORD=' }
        if ($passwordLine) {
            $dbPassword = ($passwordLine -split '=',2)[1].Trim()
        }
    }
    
    Write-Info "Checking PostgreSQL connection..."
    $env:PGPASSWORD = $dbPassword
    
    # Test connection first
    $testResult = psql -U postgres -h localhost -p 5432 -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Cannot connect to PostgreSQL. Make sure PostgreSQL is running."
        Write-Host "  Error: $testResult"
        Write-Host "  Using password from api\.env (DB_PASSWORD=$dbPassword)"
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
        return $false
    }
    
    Write-Success "Connected to PostgreSQL"
    
    Write-Info "Terminating existing database connections..."
    # Terminate all connections to the database
    $terminateCmd = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'exits_saas_db' AND pid <> pg_backend_pid();"
    psql -U postgres -h localhost -p 5432 -c $terminateCmd 2>&1 | Out-Null
    
    # Wait for connections to close
    Start-Sleep -Seconds 1
    
    Write-Info "Dropping existing database..."
    # Drop the database
    $dropCmd = 'DROP DATABASE IF EXISTS exits_saas_db;'
    $dropResult = psql -U postgres -h localhost -p 5432 -c $dropCmd 2>&1 | Out-String
    
    if ($LASTEXITCODE -ne 0) {
        # Check if error is just "database does not exist"
        if ($dropResult -match "does not exist") {
            Write-Info "Database does not exist (this is fine)"
        } else {
            Write-Error-Custom "Failed to drop database: $dropResult"
            Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
            return $false
        }
    } else {
        Write-Success "Database dropped"
    }
    
    Write-Info "Creating fresh database..."
    # Create fresh database
    $createCmd = 'CREATE DATABASE exits_saas_db;'
    $createResult = psql -U postgres -h localhost -p 5432 -c $createCmd 2>&1
    
    Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to create database"
        return $false
    }
    
    Write-Success "Database created"
    
    Write-Info "Running database migrations..."
    Push-Location api
    
    # Run migrations using the migrate script
    npm run migrate 2>&1 | Out-Null
    $migrateSuccess = $LASTEXITCODE -eq 0
    
    if (!$migrateSuccess) {
        Pop-Location
        Write-Error-Custom "Database migration failed"
        return $false
    }
    
    Write-Success "Database schema created"
    
    Write-Info "Applying database fixes and enhancements..."
    
    # Add menu_key column and fix constraints
    node -e "const db = require('./src/config/database'); (async () => { try { await db.query('ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS menu_key VARCHAR(100)'); console.log('✓ Added menu_key column'); await db.query('ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS unique_permission'); console.log('✓ Dropped old constraint'); await db.query('DELETE FROM role_permissions a USING role_permissions b WHERE a.id < b.id AND a.role_id = b.role_id AND COALESCE(a.menu_key, \\'\\') = COALESCE(b.menu_key, \\'\\') AND a.action_key = b.action_key'); console.log('✓ Removed duplicates'); await db.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_unique ON role_permissions(role_id, COALESCE(menu_key, \\'\\'), action_key)'); console.log('✓ Created new unique index'); process.exit(0); } catch(err) { console.error('✗ Error:', err.message); process.exit(1); } })();" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database fixes applied"
    } else {
        Write-Warning "Some database fixes may have failed (this might be okay if already applied)"
    }
    
    Write-Info "Seeding database with test data..."
    npm run seed 2>&1 | Out-Null
    $seedSuccess = $LASTEXITCODE -eq 0
    Pop-Location
    
    if ($seedSuccess) {
        Write-Success "Database seeded successfully"
        return $true
    } else {
        Write-Error-Custom "Database seeding failed"
        return $false
    }
}

# Reset passwords
function Reset-TestUserPasswords {
    Write-Header "Resetting Test User Passwords"
    
    Write-Info "Generating new password hashes..."
    
    # Use Node.js to generate bcrypt hashes (more reliable than PowerShell)
    $adminHash = node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('Admin@123456', 10));"
    $tenantHash = node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('TenantAdmin@123456', 10));"
    
    if ([string]::IsNullOrWhiteSpace($adminHash) -or [string]::IsNullOrWhiteSpace($tenantHash)) {
        Write-Error-Custom "Failed to generate password hashes"
        return $false
    }
    
    Write-Info "Updating test user passwords in database..."
    
    $env:PGPASSWORD = 'postgres'
    
    # Update system admin
    $query1 = "UPDATE users SET password_hash = '$adminHash' WHERE email = 'admin@exitsaas.com';"
    $result1 = psql -U postgres -h localhost -p 5432 -d exits_saas_db -c $query1 2>&1
    
    # Update all tenant admins
    $query2 = "UPDATE users SET password_hash = '$tenantHash' WHERE email LIKE 'admin-%@example.com';"
    $result2 = psql -U postgres -h localhost -p 5432 -d exits_saas_db -c $query2 2>&1
    
    # Verify the updates
    $query3 = "SELECT email, CASE WHEN tenant_id IS NULL THEN 'System Admin' ELSE 'Tenant Admin' END as role FROM users WHERE email IN ('admin@exitsaas.com', 'admin-1@example.com', 'admin-2@example.com', 'admin-3@example.com') ORDER BY tenant_id NULLS FIRST, email;"
    $verifyResult = psql -U postgres -h localhost -p 5432 -d exits_saas_db -t -c $query3 2>&1
    
    Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Test user passwords reset successfully!"
        Write-Host ""
        Write-Host "$($Cyan)═══════════════════════════════════════════════════$($Reset)"
        Write-Host "$($Bright)$($Yellow)           Default Test Credentials$($Reset)"
        Write-Host "$($Cyan)═══════════════════════════════════════════════════$($Reset)"
        Write-Host ""
        Write-Host "$($Green)✓ System Administrator:$($Reset)"
        Write-Host "  📧 Email:    $($Yellow)admin@exitsaas.com$($Reset)"
        Write-Host "  🔑 Password: $($Yellow)Admin@123456$($Reset)"
        Write-Host ""
        Write-Host "$($Green)✓ Tenant Administrators:$($Reset)"
        Write-Host "  📧 Email:    $($Yellow)admin-1@example.com$($Reset) (Tenant: ACME Corporation)"
        Write-Host "  🔑 Password: $($Yellow)TenantAdmin@123456$($Reset)"
        Write-Host ""
        Write-Host "  📧 Email:    $($Yellow)admin-2@example.com$($Reset) (Tenant: TechStartup Inc)"
        Write-Host "  🔑 Password: $($Yellow)TenantAdmin@123456$($Reset)"
        Write-Host ""
        Write-Host "  📧 Email:    $($Yellow)admin-3@example.com$($Reset) (Tenant: Enterprise Corp)"
        Write-Host "  🔑 Password: $($Yellow)TenantAdmin@123456$($Reset)"
        Write-Host ""
        Write-Host "$($Cyan)═══════════════════════════════════════════════════$($Reset)"
        Write-Host ""
        return $true
    } else {
        Write-Error-Custom "Failed to reset passwords"
        return $false
    }
}

# Build web
function Build-Web {
    Write-Header "Building Web Application"
    
    Write-Info "Ensuring proxy configuration exists..."
    Push-Location web
    
    # Create proxy.conf.json if it doesn't exist
    if (!(Test-Path "proxy.conf.json")) {
        $proxyConfig = @"
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "logLevel": "debug",
    "changeOrigin": true
  }
}
"@
        $proxyConfig | Out-File -FilePath "proxy.conf.json" -Encoding UTF8
        Write-Success "Created proxy configuration"
    } else {
        Write-Success "Proxy configuration exists"
    }
    
    Write-Info "Building Angular application..."
    npm run build 2>&1 | Out-Null
    $buildSuccess = $LASTEXITCODE -eq 0
    Pop-Location
    
    if ($buildSuccess) {
        Write-Success "Web application built successfully"
        return $true
    } else {
        Write-Error-Custom "Web build failed"
        return $false
    }
}

# Start servers
function Start-Servers {
    Write-Header "Starting Development Servers"
    
    Write-Info "Starting API server (npm run dev)..."
    Push-Location api
    Start-Process -NoNewWindow -ArgumentList "npm", "run", "dev"
    Pop-Location
    
    Start-Sleep -Seconds 3
    
    Write-Info "Starting Web server (npm start)..."
    Push-Location web
    Start-Process -NoNewWindow -ArgumentList "npm", "start"
    Pop-Location
    
    Start-Sleep -Seconds 5
    
    Write-Header "Development Environment Ready"
    Write-Host "$($Green)✓ All servers are running!$($Reset)"
    Write-Host ""
    Write-Host "$($Cyan)Access Points:$($Reset)"
    Write-Host "  🌐 Web Application: $($Yellow)http://localhost:4200$($Reset)"
    Write-Host "  🔗 API Backend:     $($Yellow)http://localhost:3000/api$($Reset)"
    Write-Host ""
    Write-Host "$($Cyan)Test Accounts:$($Reset)"
    Write-Host "  👤 System Admin:   admin@exitsaas.com / Admin@123456"
    Write-Host "  🏢 Tenant 1 Admin: admin-1@example.com / TenantAdmin@123456"
    Write-Host "  🏢 Tenant 2 Admin: admin-2@example.com / TenantAdmin@123456"
    Write-Host "  🏢 Tenant 3 Admin: admin-3@example.com / TenantAdmin@123456"
    Write-Host ""
    Write-Host "$($Yellow)Press Ctrl+C in each terminal to stop the servers$($Reset)"
    Write-Host ""
}

# Main
function Main {
    Show-Banner
    
    Write-Header "Checking Prerequisites"
    if (!(Test-NodeJs)) { return }
    Write-Success "All prerequisites met!"
    
    if (!$SkipInstall) {
        if (!(Install-Dependencies)) { return }
    } else {
        Write-Info "Skipping dependency installation"
    }
    
    if (!(Setup-Database)) { return }
    # Password reset is now handled by the seed script
    if (!(Build-Web)) { return }
    
    if (!$NoStart) {
        Start-Servers
    } else {
        Write-Header "Setup Complete"
        Write-Success "Development environment is ready!"
        Write-Host "Run to start servers:"
        Write-Host "  $($Cyan)cd api && npm run dev$($Reset)"
        Write-Host "  $($Cyan)cd web && npm start$($Reset)"
        Write-Host ""
    }
}

Main
