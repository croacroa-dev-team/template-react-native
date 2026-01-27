# Maestro E2E Tests

This directory contains end-to-end tests using [Maestro](https://maestro.mobile.dev/).

## Setup

### Install Maestro

```bash
# macOS
brew install maestro

# Or using curl
curl -Ls "https://get.maestro.mobile.dev" | bash
```

### Prerequisites

- iOS Simulator or Android Emulator running
- App built and installed on the device/emulator

## Running Tests

### Run all tests

```bash
maestro test maestro/flows/
```

### Run a specific test

```bash
maestro test maestro/flows/login.yaml
```

### Run with a specific app ID

```bash
APP_ID=com.yourcompany.app maestro test maestro/flows/
```

### Run in CI mode

```bash
maestro test --format junit --output results.xml maestro/flows/
```

## Test Structure

```
maestro/
├── config.yaml          # Global configuration
├── README.md            # This file
└── flows/
    ├── login.yaml       # Login flow tests
    ├── register.yaml    # Registration flow tests
    ├── navigation.yaml  # Navigation tests
    └── offline.yaml     # Offline mode tests
```

## Writing Tests

### Basic test structure

```yaml
appId: ${APP_ID}
name: My Test
tags:
  - smoke
---
- launchApp
- tapOn: "Button Text"
- assertVisible: "Expected Text"
```

### Common commands

- `launchApp` - Launch the app
- `tapOn` - Tap on an element
- `inputText` - Enter text
- `assertVisible` - Assert element is visible
- `scrollUntilVisible` - Scroll until element is found
- `waitForAnimationToEnd` - Wait for animations
- `back` - Press back button

### Tips

1. Use `waitForAnimationToEnd` after navigation
2. Use `clearState: true` in `launchApp` for clean tests
3. Use `optional: true` for elements that may not always appear
4. Use tags to organize and filter tests

## CI Integration

### GitHub Actions example

```yaml
- name: Run E2E Tests
  run: |
    maestro test --format junit --output results.xml maestro/flows/

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: e2e-results
    path: results.xml
```

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/)
- [CLI Reference](https://maestro.mobile.dev/reference/cli)
- [Command Reference](https://maestro.mobile.dev/reference/commands)
