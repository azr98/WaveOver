#!/bin/bash

REPOSITORY="waveover-development-backend"
AWS_REGION="eu-west-1"
REGISTRY="058264329805.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "Stopping and removing the old container (if exists)..."
docker stop waveover-backend-container || true
docker rm waveover-backend-container || true

echo "Fetching latest image ID from ECR..."
LATEST_IMAGE_ID=$(docker images --format "{{.ID}}" $REGISTRY/$REPOSITORY:latest)

echo "Finding all old images except the latest..."
docker images $REGISTRY/$REPOSITORY --format "{{.ID}} {{.Repository}}:{{.Tag}}" | grep -v $LATEST_IMAGE_ID | awk '{print $1}' | xargs -r docker rmi -f

echo "Pruning unused resources..."
docker system prune -f
