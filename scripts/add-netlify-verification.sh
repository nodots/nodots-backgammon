#!/bin/bash

# Add Netlify Domain Verification TXT Record
# This proves domain ownership to Netlify

DOMAIN="nodots.com"
HOSTED_ZONE_ID="Z0780663BEIMWJTCLWYS"
TXT_HOST="netlify-challenge"
TXT_VALUE="380762b2cea340d9d6cafeb6fa4e9e9b"

echo "🔐 Adding Netlify domain verification TXT record"
echo "Host: $TXT_HOST"
echo "Value: $TXT_VALUE"

# Create the TXT record for domain verification
cat > netlify-verification.json << EOF
{
    "Comment": "Add Netlify domain verification TXT record",
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$TXT_HOST.$DOMAIN",
                "Type": "TXT",
                "TTL": 300,
                "ResourceRecords": [
                    {"Value": "\"$TXT_VALUE\""}
                ]
            }
        }
    ]
}
EOF

# Apply the change
echo "📋 Adding TXT record to Route 53..."
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://netlify-verification.json

if [ $? -eq 0 ]; then
    echo "✅ TXT record added successfully"
    echo ""
    echo "⏳ Waiting 60 seconds for DNS propagation..."
    sleep 60
    
    echo "🔍 Verifying TXT record..."
    dig netlify-challenge.nodots.com TXT +short
    
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Go back to Netlify and click 'Add subdomain'"
    echo "2. Netlify will verify the TXT record"
    echo "3. Domain should be added successfully"
    echo "4. SSL certificate will be provisioned automatically"
else
    echo "❌ Failed to add TXT record"
    exit 1
fi

# Clean up
rm -f netlify-verification.json 