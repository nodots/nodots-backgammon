#!/bin/bash

# Final DNS fix for Netlify SSL - use CNAME to actual site
# This is the recommended approach for subdomains

DOMAIN="nodots.com"
SUBDOMAIN="backgammon.nodots.com"
NETLIFY_SITE="nodots-backgammon-tech-marketing.netlify.app"

echo "🔧 Final DNS fix for Netlify SSL certificate validation"

# Get the hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='${DOMAIN}.'].Id" --output text | cut -d'/' -f3)

echo "Using hosted zone: $HOSTED_ZONE_ID"

# Use CNAME to actual Netlify site (recommended for subdomains)
cat > change-batch-final.json << EOF
{
    "Comment": "Final fix: CNAME to actual Netlify site",
    "Changes": [
        {
            "Action": "DELETE",
            "ResourceRecordSet": {
                "Name": "$SUBDOMAIN",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [
                    {"Value": "apex-loadbalancer.netlify.com"}
                ]
            }
        },
        {
            "Action": "CREATE",
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
    --change-batch file://change-batch-final.json

echo "✅ DNS updated to use CNAME to actual Netlify site"
echo "This should now work for SSL certificate provisioning"

# Clean up
rm -f change-batch-final.json 