# Assign loans to customer 17 (Maria Santos)
Write-Host "Updating loans to assign to customer 17..." -ForegroundColor Cyan

# Get the database connection details from .env
$envFile = Get-Content "../.env" -ErrorAction SilentlyContinue
if ($envFile) {
    foreach ($line in $envFile) {
        if ($line -match "^DB_NAME=(.+)$") { $dbName = $matches[1] }
        if ($line -match "^DB_USER=(.+)$") { $dbUser = $matches[1] }
        if ($line -match "^DB_HOST=(.+)$") { $dbHost = $matches[1] }
    }
}

# Default values if not found in .env
if (-not $dbName) { $dbName = "exits_saas_db" }
if (-not $dbUser) { $dbUser = "postgres" }
if (-not $dbHost) { $dbHost = "localhost" }

Write-Host "Database: $dbName" -ForegroundColor Yellow
Write-Host "User: $dbUser" -ForegroundColor Yellow

# SQL to update loans
$sql = @"
-- Update the first 3 loans to belong to customer_id 17 (Maria Santos)
UPDATE money_loan_loans 
SET customer_id = 17 
WHERE id IN (
  SELECT id 
  FROM money_loan_loans 
  WHERE tenant_id = 1 
  ORDER BY id 
  LIMIT 3
);

-- Show updated loans
SELECT id, customer_id, loan_number, principal_amount, status 
FROM money_loan_loans 
WHERE customer_id = 17;
"@

# Execute the SQL
Write-Host "Executing SQL update..." -ForegroundColor Cyan
$sql | & psql -U $dbUser -d $dbName -h $dbHost

Write-Host "Done! Refresh your mobile app to see the loans." -ForegroundColor Green
