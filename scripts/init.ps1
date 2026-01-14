# =============================================================================
# Template Initialization Script (Windows PowerShell)
# =============================================================================
# This script customizes the template for a new project
#
# Usage: .\scripts\init.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "==> " -ForegroundColor Blue -NoNewline
    Write-Host $Message
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

# Header
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║           React Native Template Initialization            ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Get project info from user
$APP_NAME = Read-Host "Enter app name [e.g., MyAwesomeApp]"
if ([string]::IsNullOrEmpty($APP_NAME)) {
    Write-Error "App name is required"
    exit 1
}

$BUNDLE_ID = Read-Host "Enter bundle identifier [e.g., com.yourcompany.myapp]"
if ([string]::IsNullOrEmpty($BUNDLE_ID)) {
    Write-Error "Bundle identifier is required"
    exit 1
}

$APP_SCHEME = Read-Host "Enter app scheme [e.g., myapp] (leave empty for default)"
if ([string]::IsNullOrEmpty($APP_SCHEME)) {
    $APP_SCHEME = $APP_NAME.ToLower() -replace '\s', ''
}

$COMPANY_NAME = Read-Host "Enter company/author name [e.g., Your Company]"
if ([string]::IsNullOrEmpty($COMPANY_NAME)) {
    $COMPANY_NAME = "Your Company"
}

Write-Host ""
Write-Step "Configuring project with:"
Write-Host "  App Name:    $APP_NAME"
Write-Host "  Bundle ID:   $BUNDLE_ID"
Write-Host "  Scheme:      $APP_SCHEME"
Write-Host "  Company:     $COMPANY_NAME"
Write-Host ""

# Confirm
$CONFIRM = Read-Host "Proceed with these settings? [y/N]"
if ($CONFIRM -notmatch "^[Yy]$") {
    Write-Warning "Cancelled"
    exit 0
}

Write-Host ""
Write-Step "Updating configuration files..."

# Create slug from app name
$APP_SLUG = $APP_NAME.ToLower() -replace '\s', '-'

# Update package.json
if (Test-Path "package.json") {
    $content = Get-Content "package.json" -Raw
    $content = $content -replace '"name": "react-native-template"', "`"name`": `"$APP_SLUG`""
    Set-Content "package.json" $content -NoNewline
    Write-Success "Updated package.json"
}

# Update app.config.ts
if (Test-Path "app.config.ts") {
    $content = Get-Content "app.config.ts" -Raw
    $content = $content -replace 'YourApp', $APP_NAME
    $content = $content -replace 'yourapp', $APP_SCHEME
    $content = $content -replace 'com\.yourcompany\.yourapp', $BUNDLE_ID
    Set-Content "app.config.ts" $content -NoNewline
    Write-Success "Updated app.config.ts"
}

# Update constants/config.ts
if (Test-Path "constants/config.ts") {
    $content = Get-Content "constants/config.ts" -Raw
    $content = $content -replace 'YourApp', $APP_NAME
    $content = $content -replace 'yourapp', $APP_SCHEME
    Set-Content "constants/config.ts" $content -NoNewline
    Write-Success "Updated constants/config.ts"
}

# Update eas.json
if (Test-Path "eas.json") {
    $content = Get-Content "eas.json" -Raw
    $content = $content -replace 'com\.yourcompany\.yourapp', $BUNDLE_ID
    Set-Content "eas.json" $content -NoNewline
    Write-Success "Updated eas.json"
}

# Create .env from .env.example
if ((Test-Path ".env.example") -and !(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Success "Created .env from .env.example"
}

# Initialize git if not already
if (!(Test-Path ".git")) {
    Write-Step "Initializing git repository..."
    git init
    Write-Success "Initialized git repository"
}

# Install dependencies
Write-Step "Installing dependencies..."
npm install --legacy-peer-deps
Write-Success "Dependencies installed"

# Run type check
Write-Step "Running type check..."
try {
    npm run typecheck
    Write-Success "Type check passed"
} catch {
    Write-Warning "Type check had issues - you may need to fix some types"
}

# Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    Setup Complete! 🎉                      ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host ""
Write-Host "  1. Review and update your .env file"
Write-Host "  2. Run 'npx expo start' to start development"
Write-Host "  3. Configure Sentry DSN in .env for crash reporting"
Write-Host "  4. Set up EAS Build: 'eas build:configure'"
Write-Host ""
Write-Host "Happy coding! 🚀"
Write-Host ""
