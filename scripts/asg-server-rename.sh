#!/bin/bash
# Fetch Instance Metadata Token for IMDSv2
TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

# Get Instance ID
INSTANCE_ID=$(curl -sH "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)

# Define New Name
NEW_NAME="WaveOver-ASG-${INSTANCE_ID}"

# Tag the Instance with New Name
aws ec2 create-tags --resources "$INSTANCE_ID" --tags Key=Name,Value="$NEW_NAME"

# Print Confirmation
echo "Instance Name set to: $NEW_NAME"