#!/bin/bash

# =============================================================================
# Template Initialization Script
# =============================================================================
# This script customizes the template for a new project
#
# Usage: ./scripts/init.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print with color
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Header
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}           React Native Template Initialization            ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get project info from user
read -p "$(echo -e ${BLUE}Enter app name ${NC}[e.g., MyAwesomeApp]: )" APP_NAME
if [ -z "$APP_NAME" ]; then
    print_error "App name is required"
    exit 1
fi

read -p "$(echo -e ${BLUE}Enter bundle identifier ${NC}[e.g., com.yourcompany.myapp]: )" BUNDLE_ID
if [ -z "$BUNDLE_ID" ]; then
    print_error "Bundle identifier is required"
    exit 1
fi

read -p "$(echo -e ${BLUE}Enter app scheme ${NC}[e.g., myapp]: )" APP_SCHEME
if [ -z "$APP_SCHEME" ]; then
    # Default to lowercase app name
    APP_SCHEME=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
fi

read -p "$(echo -e ${BLUE}Enter company/author name ${NC}[e.g., Your Company]: )" COMPANY_NAME
if [ -z "$COMPANY_NAME" ]; then
    COMPANY_NAME="Your Company"
fi

echo ""
print_step "Configuring project with:"
echo "  App Name:    $APP_NAME"
echo "  Bundle ID:   $BUNDLE_ID"
echo "  Scheme:      $APP_SCHEME"
echo "  Company:     $COMPANY_NAME"
echo ""

# Confirm
read -p "$(echo -e ${YELLOW}Proceed with these settings? ${NC}[y/N]: )" CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    print_warning "Cancelled"
    exit 0
fi

echo ""
print_step "Updating configuration files..."

# Update package.json
if [ -f "package.json" ]; then
    # Create lowercase slug from app name
    APP_SLUG=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

    if command -v jq &> /dev/null; then
        # Use jq if available
        jq --arg name "$APP_SLUG" '.name = $name' package.json > tmp.json && mv tmp.json package.json
    else
        # Fallback to sed
        sed -i.bak "s/\"name\": \"react-native-template\"/\"name\": \"$APP_SLUG\"/g" package.json
        rm -f package.json.bak
    fi
    print_success "Updated package.json"
fi

# Update app.config.ts
if [ -f "app.config.ts" ]; then
    sed -i.bak "s/YourApp/$APP_NAME/g" app.config.ts
    sed -i.bak "s/yourapp/$APP_SCHEME/g" app.config.ts
    sed -i.bak "s/com\.yourcompany\.yourapp/$BUNDLE_ID/g" app.config.ts
    rm -f app.config.ts.bak
    print_success "Updated app.config.ts"
fi

# Update constants/config.ts
if [ -f "constants/config.ts" ]; then
    sed -i.bak "s/YourApp/$APP_NAME/g" constants/config.ts
    sed -i.bak "s/yourapp/$APP_SCHEME/g" constants/config.ts
    rm -f constants/config.ts.bak
    print_success "Updated constants/config.ts"
fi

# Update eas.json
if [ -f "eas.json" ]; then
    sed -i.bak "s/com\.yourcompany\.yourapp/$BUNDLE_ID/g" eas.json
    rm -f eas.json.bak
    print_success "Updated eas.json"
fi

# Create .env from .env.example
if [ -f ".env.example" ] && [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Created .env from .env.example"
fi

# Initialize git if not already
if [ ! -d ".git" ]; then
    print_step "Initializing git repository..."
    git init
    print_success "Initialized git repository"
fi

# Install dependencies
print_step "Installing dependencies..."
if command -v bun &> /dev/null; then
    bun install
elif command -v pnpm &> /dev/null; then
    pnpm install
elif command -v yarn &> /dev/null; then
    yarn install
else
    npm install --legacy-peer-deps
fi
print_success "Dependencies installed"

# Run type check
print_step "Running type check..."
if npm run typecheck 2>/dev/null; then
    print_success "Type check passed"
else
    print_warning "Type check had issues - you may need to fix some types"
fi

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}                    Setup Complete! 🎉                      ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Review and update your .env file"
echo "  2. Run 'npx expo start' to start development"
echo "  3. Configure Sentry DSN in .env for crash reporting"
echo "  4. Set up EAS Build: 'eas build:configure'"
echo ""
echo "Happy coding! 🚀"
echo ""
