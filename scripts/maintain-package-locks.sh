#!/bin/bash

# Script to maintain individual package-lock.json files in workspace packages
# Usage: ./maintain-package-locks.sh [package-name] or ./maintain-package-locks.sh all

set -e

PACKAGES=("ai" "api" "client" "core")

update_package_lock() {
    local package_name=$1
    echo "🔄 Updating package-lock.json for packages/$package_name..."
    
    if [ ! -d "packages/$package_name" ]; then
        echo "❌ Package directory packages/$package_name does not exist"
        return 1
    fi
    
    cd "packages/$package_name"
    npm install --no-workspaces
    echo "✅ Updated package-lock.json for $package_name"
    cd ../..
}

if [ $# -eq 0 ] || [ "$1" = "all" ]; then
    echo "🚀 Updating package-lock.json for all packages..."
    for package in "${PACKAGES[@]}"; do
        update_package_lock "$package"
    done
    echo "🎉 All package locks updated successfully!"
elif [[ " ${PACKAGES[@]} " =~ " $1 " ]]; then
    update_package_lock "$1"
else
    echo "❌ Invalid package name: $1"
    echo "Valid packages: ${PACKAGES[*]}"
    echo "Usage: $0 [package-name|all]"
    exit 1
fi