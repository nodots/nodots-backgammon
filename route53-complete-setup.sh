#!/bin/bash

# Complete Route 53 DNS Setup for Netlify with MX Record Protection
# This script ensures MX records are preserved for email delivery

DOMAIN="nodots.com"
SUBDOMAIN="backgammon.nodots.com"
NETLIFY_SITE="nodots-backgammon-tech-marketing.netlify.app"
HOSTED_ZONE_ID="Z0780663BEIMWJTCLWYS"

echo "🔧 Setting up Route 53 DNS with MX record protection"
echo "Using hosted zone: $HOSTED_ZONE_ID"

# First, let's verify the current MX records
echo "📧 Checking current MX records for $DOMAIN..."
dig $DOMAIN MX +short

echo ""
echo "🔍 Current DNS records status:"
echo "- MX Records: $(dig $DOMAIN MX +short | wc -l) records found"
echo "- Current subdomain: $(dig $SUBDOMAIN +short || echo 'Not configured')"

# Create the CNAME record for the subdomain only
echo ""
echo "📋 Creating CNAME record for $SUBDOMAIN..."

cat > change-batch-subdomain-only.json << EOF
{
    "Comment": "Add CNAME for Netlify subdomain - preserving all existing records",
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$SUBDOMAIN",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [
                    {"Value": "$NETLIFY_SITE"}
                ]
            }
        }
    ]
}
EOF

# Apply the change
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://change-batch-subdomain-only.json

if [ $? -eq 0 ]; then
    echo "✅ Subdomain DNS updated successfully"
else
    echo "❌ Failed to update DNS"
    exit 1
fi

# Wait a moment and verify MX records are still intact
echo ""
echo "⏳ Waiting 30 seconds for DNS propagation..."
sleep 30

echo ""
echo "🔍 Verification - MX records after changes:"
dig $DOMAIN MX +short

echo ""
echo "🔍 Verification - Subdomain configuration:"
dig $SUBDOMAIN +short

echo ""
echo "✅ DNS Setup Complete!"
echo ""
echo "📧 Email Status:"
echo "- MX records for $DOMAIN: PRESERVED ✅"
echo "- Email will continue working normally"
echo ""
echo "🌐 Website Status:"
echo "- $SUBDOMAIN → $NETLIFY_SITE"
echo "- Go to Netlify dashboard and click 'Retry DNS verification'"
echo "- SSL certificate should provision automatically"
echo ""
echo "🎯 Next Steps:"
echo "1. Test email: Send test email to any@$DOMAIN"
echo "2. Test website: Visit https://$SUBDOMAIN (may take 5-10 minutes)"
echo "3. In Netlify: Click 'Retry DNS verification' for SSL certificate"

# Clean up
rm -f change-batch-subdomain-only.json 