# npm Publish via GitHub Actions

**Date:** 2026-02-23
**Scope:** Version bump + CHANGELOG + CI workflow

## Overview

Publish `@croacroa/react-native-template` to npm automatically when a GitHub Release is created. Bump version from 2.1.0 to 3.2.0.

## Changes

### 1. `package.json` — version `3.2.0`

### 2. `CHANGELOG.md` — Phase 7 + Phase 8 entries

Add entries for:
- Phase 7 (3.1.0): Screen i18n, Phase 6 hook tests, integration guides
- Phase 8 (3.2.0): Rate limiting UI, force update, in-app review, crash recovery, feature flags, a11y tests, ETag caching

### 3. `.github/workflows/npm-publish.yml`

- Trigger: `on: release: types: [published]`
- Validates tag matches package.json version
- Runs lint + tests as quality gate
- Publishes with `npm publish --access public`
- Requires `NPM_TOKEN` secret in GitHub repo settings

## Prerequisites

- npm org `@croacroa` must exist on npmjs.com
- `NPM_TOKEN` secret must be added to GitHub repo settings (Settings > Secrets > Actions)
