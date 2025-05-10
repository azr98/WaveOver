#!/bin/sh
# Fetch Clerk key from AWS SSM
CLERK_KEY=$(aws ssm get-parameter --name "clerk-gmail-api-key" --with-decryption --query "Parameter.Value" --output text)
export NEXT_APP_CLERK_PUBLISHABLE_KEY="$CLERK_KEY"
exec "$@"
