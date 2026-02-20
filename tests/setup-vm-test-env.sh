#!/bin/bash

# Setup script để chạy tests trực tiếp từ VM1
# Script này TỰ ĐỘNG detect tất cả IPs cần thiết

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  SETUP TEST ENVIRONMENT FOR VM${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Detect current VM
CURRENT_VM=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/name 2>/dev/null || echo "unknown")
echo -e "${YELLOW}Current VM: ${CURRENT_VM}${NC}"
echo ""

# Get current VM's IPs from metadata
echo -e "${YELLOW}[1/3] Detecting current VM network info...${NC}"
VM1_PUBLIC=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || echo "")
VM1_INTERNAL=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/ip 2>/dev/null || echo "")

echo -e "${GREEN}✓${NC} Public IP:  ${VM1_PUBLIC:-None}"
echo -e "${GREEN}✓${NC} Internal IP: ${VM1_INTERNAL}"
echo ""

# Auto-detect VM2 internal IP by trying docker-compose.yml or env file
echo -e "${YELLOW}[2/3] Auto-detecting VM2 internal IP...${NC}"

# Method 1: From docker-compose if on VM1
if [ -f "/home/mitsne/realtime-chat/apps/docker-compose.yml" ]; then
    echo -e "${BLUE}   Checking docker-compose.yml...${NC}"
    # Extract REDIS_HOST value
    VM2_INTERNAL=$(grep -E "REDIS_HOST|MONGO_HOST" /home/mitsne/realtime-chat/apps/docker-compose.yml 2>/dev/null | head -1 | sed -E 's/.*REDIS_HOST=([0-9.]+).*/\1/')
fi

# Method 2: From .env file
if [ -z "$VM2_INTERNAL" ] && [ -f "/home/mitsne/realtime-chat/apps/.env" ]; then
    echo -e "${BLUE}   Checking .env file...${NC}"
    source /home/mitsne/realtime-chat/apps/.env 2>/dev/null
    VM2_INTERNAL="${VM2_INTERNAL_IP:-}"
fi

# Method 3: From infrastructure on VM2
if [ -z "$VM2_INTERNAL" ] && [ "$CURRENT_VM" = "tracker-n-chat-infrastructure" ]; then
    echo -e "${BLUE}   Running on VM2, using own IP...${NC}"
    VM2_INTERNAL=$VM1_INTERNAL
fi

# Method 4: Manual input
if [ -z "$VM2_INTERNAL" ]; then
    echo -e "${YELLOW}   Could not auto-detect VM2 IP.${NC}"
    echo -e "${YELLOW}   Please enter VM2 internal IP manually:${NC}"
    read -p "   VM2 Internal IP: " VM2_INTERNAL
fi

echo -e "${GREEN}✓${NC} VM2 Internal: ${VM2_INTERNAL}"
echo ""

# Get HMAC_SECRET_KEY from backend container
echo -e "${YELLOW}[3/3] Detecting HMAC_SECRET_KEY...${NC}"
HMAC_KEY=$(docker exec backend_chat env 2>/dev/null | grep HMAC_SECRET_KEY | cut -d'=' -f2 || echo "")

if [ -z "$HMAC_KEY" ]; then
    echo -e "${YELLOW}   Could not detect HMAC key from container.${NC}"
    HMAC_KEY="your-secret-key-here"
fi

echo -e "${GREEN}✓${NC} HMAC Key: ${HMAC_KEY:0:20}..."
echo ""

# Create test directory if not exists
TEST_DIR="/home/mitsne/realtime-chat/tests"
mkdir -p $TEST_DIR

# Create .env file for tests
echo -e "${YELLOW}Creating .env file...${NC}"
cat > $TEST_DIR/.env << EOF
# VM Test Environment
# Auto-generated: $(date)
# Generated on: $CURRENT_VM

# VM1 (chat-system-app)
export VM1_PUBLIC_IP=$VM1_PUBLIC
export VM1_INTERNAL_IP=$VM1_INTERNAL

# VM2 (tracker-n-chat-infrastructure)
export VM2_INTERNAL_IP=$VM2_INTERNAL
export VM2_PUBLIC_IP=

# Test Configuration
export VM1_URL=http://$VM1_PUBLIC:8029
export HMAC_SECRET_KEY=$HMAC_KEY

# Ports
export REDIS_PORT=43816
export MONGODB_PORT=27017
export SOCKET_PORT=5000
EOF

echo -e "${GREEN}✓${NC} Created: $TEST_DIR/.env"
echo ""

# Show summary
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  CONFIGURATION SUMMARY${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "VM1 Public:      ${VM1_PUBLIC}"
echo -e "VM1 Internal:    ${VM1_INTERNAL}"
echo -e "VM2 Internal:    ${VM2_INTERNAL}"
echo -e "HMAC Key:        ${HMAC_KEY:0:30}..."
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Load environment: ${BLUE}source $TEST_DIR/.env${NC}"
echo -e "2. Run test: ${BLUE}cd /home/mitsne/realtime-chat && ./tests/scenario1-network-isolation.sh${NC}"
echo -e "3. Or run all: ${BLUE}cd /home/mitsne/realtime-chat && ./tests/run-all-scenarios.sh${NC}"
echo ""
