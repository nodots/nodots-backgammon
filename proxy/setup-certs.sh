#!/bin/bash

# Script to set up local SSL certificates for nodots.home domains
# This creates a local Certificate Authority and generates signed certificates

CERT_DIR="./certs"
CA_DIR="$CERT_DIR/ca"
DOMAINS_DIR="$CERT_DIR/domains"

echo "🔒 Setting up local SSL certificates for nodots.home domains..."

# Create directory structure
mkdir -p "$CA_DIR" "$DOMAINS_DIR"

# Generate CA private key
echo "📝 Generating Certificate Authority private key..."
openssl genrsa -out "$CA_DIR/ca.key" 4096

# Generate CA certificate
echo "📝 Generating Certificate Authority certificate..."
openssl req -new -x509 -days 365 -key "$CA_DIR/ca.key" -out "$CA_DIR/ca.crt" -subj "/C=US/ST=California/L=San Francisco/O=Nodots Development/CN=Nodots Development CA"

# Create certificate configuration for domain certificates
cat > "$CERT_DIR/domain.conf" << 'EOF'
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = California
L = San Francisco
O = Nodots LLC
CN = nodots.home

[v3_req]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = nodots.home
DNS.2 = *.nodots.home
DNS.3 = api.nodots.home
DNS.4 = localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate domain private key
echo "📝 Generating domain private key..."
openssl genrsa -out "$DOMAINS_DIR/nodots.home.key" 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key "$DOMAINS_DIR/nodots.home.key" -out "$DOMAINS_DIR/nodots.home.csr" -config "$CERT_DIR/domain.conf"

# Generate signed certificate
echo "📝 Generating signed certificate..."
openssl x509 -req -in "$DOMAINS_DIR/nodots.home.csr" -CA "$CA_DIR/ca.crt" -CAkey "$CA_DIR/ca.key" -CAcreateserial -out "$DOMAINS_DIR/nodots.home.crt" -days 365 -extensions v3_req -extfile "$CERT_DIR/domain.conf"

# Set appropriate permissions
chmod 600 "$CA_DIR/ca.key" "$DOMAINS_DIR/nodots.home.key"
chmod 644 "$CA_DIR/ca.crt" "$DOMAINS_DIR/nodots.home.crt"

echo "✅ Certificates generated successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Install the CA certificate: $CA_DIR/ca.crt"
echo "   2. Add entries to /etc/hosts:"
echo "      127.0.0.1 nodots.home"
echo "      127.0.0.1 api.nodots.home"
echo "   3. Run the proxy servers with: npm run proxy:start"
echo ""
echo "🍎 To install CA certificate on macOS:"
echo "   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CA_DIR/ca.crt"
echo ""
echo "🐧 To install CA certificate on Linux:"
echo "   sudo cp $CA_DIR/ca.crt /usr/local/share/ca-certificates/nodots-dev-ca.crt"
echo "   sudo update-ca-certificates"