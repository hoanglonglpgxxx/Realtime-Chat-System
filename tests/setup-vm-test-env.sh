#!/bin/bash

# Setup script để chạy tests trực tiếp từ VM1
# Chạy script này trên VM1 để set environment variables

echo "========================================="
echo "  SETUP TEST ENVIRONMENT FOR VM1"
echo "========================================="
echo ""

# Get current VM's public IP (VM1)
echo "Detecting VM1 public IP..."
VM1_PUBLIC=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || echo "")
VM1_INTERNAL=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/ip 2>/dev/null || echo "")

echo "VM1 Public IP: $VM1_PUBLIC"
echo "VM1 Internal IP: $VM1_INTERNAL"
echo ""

# You need to manually set VM2 internal IP (from GCP console or env)
echo "Please set VM2_INTERNAL_IP manually:"
echo "Example: export VM2_INTERNAL_IP=10.128.0.X"
echo ""

# Create .env file for tests
cat > /home/mitsne/realtime-chat/tests/.env << EOF
# VM Test Environment
# Generated: $(date)

# VM1 (chat-system-app)
VM1_PUBLIC_IP=$VM1_PUBLIC
VM1_INTERNAL_IP=$VM1_INTERNAL

# VM2 (tracker-n-chat-infrastructure)
# TODO: Update this with actual VM2 internal IP
VM2_INTERNAL_IP=${VM2_INTERNAL_IP:-10.128.0.X}
VM2_PUBLIC_IP=

# Test URLs
VM1_URL=http://$VM1_PUBLIC:8029
HMAC_SECRET_KEY=${HMAC_SECRET_KEY}
EOF

echo "✓ Created .env file at: /home/mitsne/realtime-chat/tests/.env"
echo ""
echo "Next steps:"
echo "1. Edit .env and set correct VM2_INTERNAL_IP"
echo "2. Run: source /home/mitsne/realtime-chat/tests/.env"
echo "3. Run tests: ./tests/scenario1-network-isolation.sh"
echo ""
