#!/bin/bash

# Route 53 Setup for backgammon.nodots.com
# This script sets up DNS to point to your Netlify site

DOMAIN="nodots.com"
SUBDOMAIN="backgammon.nodots.com"
NETLIFY_URL="nodots-backgammon-tech-marketing.netlify.app"

echo "🌐 Setting up Route 53 DNS for $SUBDOMAIN"

# First, configure AWS CLI if not already done
echo "📝 Step 1: AWS Configuration"
echo "Make sure you have AWS credentials configured:"
echo "Run: aws configure"
echo "You'll need your AWS Access Key ID and Secret Access Key"
echo ""

# Get the hosted zone ID for nodots.com
echo "🔍 Step 2: Finding hosted zone for $DOMAIN"
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='${DOMAIN}.'].Id" --output text | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "❌ Hosted zone for $DOMAIN not found!"
    echo "You may need to create a hosted zone first:"
    echo ""
    echo "aws route53 create-hosted-zone --name $DOMAIN --caller-reference $(date +%s)"
    echo ""
    echo "Then update your domain's nameservers to use Route 53."
    exit 1
else
    echo "✅ Found hosted zone: $HOSTED_ZONE_ID"
fi

# Create the CNAME record
echo "📋 Step 3: Creating CNAME record for $SUBDOMAIN"

# Create change batch JSON
cat > change-batch.json << EOF
{
    "Comment": "Add CNAME record for backgammon subdomain",
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$SUBDOMAIN",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$NETLIFY_URL"
                    }
                ]
            }
        }
    ]
}
EOF

# Apply the change
CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://change-batch.json \
    --query 'ChangeInfo.Id' \
    --output text)

if [ $? -eq 0 ]; then
    echo "✅ CNAME record created successfully"
    echo "Change ID: $CHANGE_ID"
    
    echo "⏳ Waiting for DNS propagation..."
    aws route53 wait resource-record-sets-changed --id $CHANGE_ID
    echo "✅ DNS changes have propagated"
else
    echo "❌ Failed to create CNAME record"
    exit 1
fi

# Clean up
rm -f change-batch.json

echo ""
echo "🎉 DNS Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Add custom domain to Netlify:"
echo "   netlify sites:create-domain --domain $SUBDOMAIN"
echo ""
echo "2. Or via Netlify dashboard:"
echo "   https://app.netlify.com/projects/nodots-backgammon-tech-marketing"
echo "   → Domain settings → Add custom domain → $SUBDOMAIN"
echo ""
echo "🌐 Your site will be available at: https://$SUBDOMAIN"
echo "🔒 SSL certificate will be automatically provisioned by Netlify"
echo ""
echo "⏰ DNS propagation may take 5-60 minutes globally" 