#!/bin/bash

# Route 53 + Netlify DNS Setup
# Use standard CNAME pointing to Netlify site (recommended for subdomains)

DOMAIN="nodots.com"
SUBDOMAIN="backgammon.nodots.com"
NETLIFY_SITE="nodots-backgammon-tech-marketing.netlify.app"

echo "🔧 Setting up Route 53 DNS for Netlify subdomain"

# Get the hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='${DOMAIN}.'].Id" --output text | cut -d'/' -f3)

echo "Using hosted zone: $HOSTED_ZONE_ID"

# Remove any existing records and create proper CNAME
cat > change-batch-standard-cname.json << EOF
{
    "Comment": "Standard CNAME setup for Netlify subdomain",
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
    --change-batch file://change-batch-standard-cname.json

echo "✅ DNS updated with standard CNAME setup"
echo ""
echo "📋 Next steps:"
echo "1. Wait 5-10 minutes for DNS propagation"
echo "2. In Netlify dashboard, make sure $SUBDOMAIN is added as a custom domain"
echo "3. Click 'Retry DNS verification' in Netlify"
echo "4. SSL certificate should provision automatically"
echo ""
echo "🌐 Your site will be available at: https://$SUBDOMAIN"

# Clean up
rm -f change-batch-standard-cname.json 