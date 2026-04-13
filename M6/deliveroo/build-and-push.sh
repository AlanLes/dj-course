#!/bin/bash
set -e

REGISTRY="localhost:5001"
IMAGE_NAME="wms-api"
TAG="${1:-latest}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo "Building the image: ${FULL_IMAGE}..."
docker build -t "${FULL_IMAGE}" ./wms-api

echo "Pushing to the registry: ${FULL_IMAGE}..."
docker push "${FULL_IMAGE}"

echo "Image ${FULL_IMAGE} built and pushed successfully."
echo "Check the UI at: http://localhost:8080"