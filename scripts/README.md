# Scripts Directory

This directory contains various scripts for the Nodots Backgammon project.

## Directory Structure

### `/dev/` - Development Scripts

Contains development and debugging scripts for testing game functionality, API endpoints, and board analysis. See [dev/README.md](dev/README.md) for detailed documentation.

### Root Level - Deployment Scripts

Contains deployment and infrastructure-related scripts:

- `add-netlify-verification.sh` - Adds Netlify verification
- `route53-complete-setup.sh` - Complete Route53 DNS setup
- `route53-netlify-setup.sh` - Route53 setup for Netlify
- `route53-setup.sh` - Basic Route53 setup
- `final-netlify-dns-fix.sh` - Final DNS fix for Netlify
- `fix-netlify-dns.sh` - Fix Netlify DNS configuration
- `update-dns-to-a-record.sh` - Update DNS to A record
- `change-batch-standard-cname.json` - Batch CNAME change configuration

## Usage

### Development Scripts

```bash
# Run development scripts from the project root
node scripts/dev/create_game.js
node scripts/dev/analyze_board.js <game_id>
```

### Deployment Scripts

```bash
# Run deployment scripts from the project root
./scripts/route53-setup.sh
./scripts/fix-netlify-dns.sh
```

## Organization

- **Development scripts** (`/dev/`) are for testing and debugging during development
- **Deployment scripts** (root level) are for infrastructure and deployment tasks
- All scripts are designed to be run from the project root directory
