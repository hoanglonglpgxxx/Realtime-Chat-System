#!/bin/bash

# Setup script để chạy tests trực tiếp từ VM1
# Script này TỰ ĐỘNG detect IPs từ local commands - KHÔNG dùng GCP API

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  SETUP TEST ENVIRONMENT FOR VM${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# [1] Detect VM1 Internal IP from network interface
echo -e "${YELLOW}[1/4] Detecting VM1 internal IP...${NC}"
VM1_INTERNAL=$(hostname -I | awk '{print $1}' || echo "")

if [ -z "$VM1_INTERNAL" ]; then
    VM1_INTERNAL=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1)
fi

echo -e "${GREEN}✓${NC} VM1 Internal IP: ${VM1_INTERNAL}"
echo ""

# [2] Get VM1 Public IP (auto-detect from apps/.env)
echo -e "${YELLOW}[2/4] Detecting VM1 public IP...${NC}"

# Try to get from apps/.env (CI/CD generated)
if [ -f "/home/mitsne/realtime-chat/apps/.env" ]; then
    echo -e "${BLUE}   Checking apps/.env...${NC}"
    VM1_PUBLIC=$(grep "^BE_URL=" /home/mitsne/realtime-chat/apps/.env 2>/dev/null | sed -E 's|BE_URL=http://([0-9.]+):.*|\1|')
fi

# Fallback: Try to extract from docker ps output
if [ -z "$VM1_PUBLIC" ]; then
    echo -e "${BLUE}   Trying to detect from running containers...${NC}"
    VM1_PUBLIC=$(docker inspect backend_chat 2>/dev/null | grep -oP '"BE_URL":"http://\K[0-9.]+' | head -1 || echo "")
fi

# Last resort: Manual input
if [ -z "$VM1_PUBLIC" ]; then
    echo -e "${YELLOW}   Could not auto-detect VM1 public IP.${NC}"
    echo -e "${YELLOW}   Check GCP Console for External IP or enter manually:${NC}"
    read -p "   VM1 Public IP: " VM1_PUBLIC
fi

if [ -z "$VM1_PUBLIC" ]; then
    echo -e "${RED}   ❌ VM1 Public IP is required!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} VM1 Public IP: ${VM1_PUBLIC}"
echo ""

# [3] Auto-detect VM2 internal IP
echo -e "${YELLOW}[3/4] Auto-detecting VM2 internal IP...${NC}"

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

# Method 3: Manual input
if [ -z "$VM2_INTERNAL" ]; then
    echo -e "${YELLOW}   Could not auto-detect VM2 IP.${NC}"
    echo -e "${YELLOW}   Please enter VM2 internal IP manually:${NC}"
    read -p "   VM2 Internal IP: " VM2_INTERNAL
fi

echo -e "${GREEN}✓${NC} VM2 Internal: ${VM2_INTERNAL}"
echo ""

# [4] Get HMAC_SECRET_KEY from backend container
echo -e "${YELLOW}[4/4] Detecting HMAC_SECRET_KEY...${NC}"
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
cat > $TEST_DIR/.env << 'EOF'
# VM Test Environment
# Auto generated from setup script
# Pure SSH workflow, no GCP API calls

# VM1 chat system app
export VM1_PUBLIC_IP="__VM1_PUBLIC__"
export VM1_INTERNAL_IP="__VM1_INTERNAL__"

# VM2 tracker and chat infrastructure
export VM2_INTERNAL_IP="__VM2_INTERNAL__"
export VM2_PUBLIC_IP=""

# Test Configuration
export VM1_URL="http://__VM1_PUBLIC__:8029"
export HMAC_SECRET_KEY="__HMAC_KEY__"

# Ports
export REDIS_PORT="43816"
export MONGODB_PORT="27017"
export SOCKET_PORT="5000"
EOF

# Replace placeholders
sed -i "s|__VM1_PUBLIC__|$VM1_PUBLIC|g" $TEST_DIR/.env
sed -i "s|__VM1_INTERNAL__|$VM1_INTERNAL|g" $TEST_DIR/.env
sed -i "s|__VM2_INTERNAL__|$VM2_INTERNAL|g" $TEST_DIR/.env
sed -i "s|__HMAC_KEY__|$HMAC_KEY|g" $TEST_DIR/.env

echo -e "${GREEN}✓${NC} Created: $TEST_DIR/.env"
echo ""

# Verify .env file is valid
echo -e "${YELLOW}Verifying .env file...${NC}"
if bash -n $TEST_DIR/.env 2>/dev/null; then
    echo -e "${GREEN}✓${NC} .env file syntax is valid"
else
    echo -e "${RED}❌${NC} .env file has syntax errors!"
    cat $TEST_DIR/.env
    exit 1
fi
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
echo -e "${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${YELLOW}  NEXT: Load environment variables${NC}"
echo -e "${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Copy and run this command:${NC}"
echo ""
echo -e "  ${BOLD}${GREEN}source /home/mitsne/realtime-chat/tests/.env${NC}"
echo ""
echo -e "${CYAN}Then verify:${NC}"
echo ""
echo -e "  ${BLUE}echo \$VM1_PUBLIC_IP${NC}"
echo ""
echo -e "${CYAN}Then run tests:${NC}"
echo ""
echo -e "  ${BLUE}./tests/scenario1-network-isolation.sh${NC}"
echo -e "  ${BLUE}./tests/run-all-scenarios.sh${NC}"
echo ""
