# Setup script for LoanFlow mobile app
# Run this after cloning the repository

Write-Host "🚀 LoanFlow Mobile App Setup" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "✓ Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Node.js version: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ✗ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "✓ Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "  npm version: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "  ✗ npm not found" -ForegroundColor Red
    exit 1
}

# Install Ionic CLI globally if not present
Write-Host "✓ Checking Ionic CLI..." -ForegroundColor Yellow
$ionicVersion = ionic --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Ionic CLI version: $ionicVersion" -ForegroundColor Green
} else {
    Write-Host "  Ionic CLI not found. Installing globally..." -ForegroundColor Yellow
    npm install -g @ionic/cli
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Check if NestJS API is running
Write-Host ""
Write-Host "🔌 Checking NestJS API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ NestJS API is running" -ForegroundColor Green
        
        # Generate API client
        Write-Host ""
        Write-Host "🔧 Generating API client from OpenAPI spec..." -ForegroundColor Yellow
        npm run generate:api
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ API client generated successfully" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ API client generation failed (you can run 'npm run generate:api' manually later)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  ⚠ NestJS API not running at http://localhost:3000" -ForegroundColor Yellow
    Write-Host "  Please start the API before running 'npm run generate:api'" -ForegroundColor Yellow
}

# Setup complete
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Make sure NestJS API is running at http://localhost:3000" -ForegroundColor White
Write-Host "  2. Run: npm start" -ForegroundColor White
Write-Host "  3. Open http://localhost:8100 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "For mobile development:" -ForegroundColor Cyan
Write-Host "  Android: npm run android" -ForegroundColor White
Write-Host "  iOS:     npm run ios" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: See README.md" -ForegroundColor Cyan
Write-Host ""
