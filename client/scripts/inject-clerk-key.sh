#!/bin/sh

# Get the Clerk key from Parameter Store
CLERK_KEY=$(aws ssm get-parameter --name "clerk-gmail-api-key" --with-decryption --query "Parameter.Value" --output text)

# Inject the key into the HTML file
sed -i "s|</head>|<script>window.CLERK_PUBLISHABLE_KEY='${CLERK_KEY}';</script></head>|" /usr/share/nginx/html/index.html 