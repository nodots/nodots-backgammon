#!/bin/bash

# Fix DNS for Netlify SSL certificate validation
# Use ALIAS record pointing to apex-loadbalancer.netlify.com (recommended approach)

DOMAIN="nodots.com"
SUBDOMAIN="backgammon.nodots.com"

echo "🔧 Fixing DNS for Netlify SSL certificate validation"

# Get the hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='${DOMAIN}.'].Id" --output text | cut -d'/' -f3)

echo "Using hosted zone: $HOSTED_ZONE_ID"

# Use AWS Route 53's ALIAS record (equivalent to CNAME but works on apex domains)
cat > change-batch-netlify-alias.json << EOF
{
    "Comment": "Use ALIAS record pointing to Netlify apex load balancer",
    "Changes": [
        {
            "Action": "DELETE",
            "ResourceRecordSet": {
                "Name": "$SUBDOMAIN",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [
                    {"Value": "75.2.60.5"}
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
                    {"Value": "apex-loadbalancer.netlify.com"}
                ]
            }
        }
    ]
}
EOF

# Apply the change
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://change-batch-netlify-alias.json

echo "✅ DNS updated to use Netlify apex load balancer"
echo "Wait 5-10 minutes then retry SSL certificate provisioning in Netlify"

# Clean up
rm -f change-batch-netlify-alias.json 