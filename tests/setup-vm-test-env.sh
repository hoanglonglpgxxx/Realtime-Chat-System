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
    # Extract IP from BE_URL=http://IP:PORT format
    VM1_PUBLIC=$(grep "^BE_URL=" /home/mitsne/realtime-chat/apps/.env 2>/dev/null | grep -oP '(?<=http://)\d+\.\d+\.\d+\.\d+' | head -1)
fi

# Fallback: Check for VM1_PUBLIC_IP variable directly
if [ -z "$VM1_PUBLIC" ] && [ -f "/home/mitsne/realtime-chat/apps/.env" ]; then
    VM1_PUBLIC=$(grep "^VM1_PUBLIC_IP=" /home/mitsne/realtime-chat/apps/.env 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'")
fi

# Last resort: Manual input (CHẮC CHẮN CẦN vì .env không lưu public IP)
if [ -z "$VM1_PUBLIC" ]; then
    echo -e "${YELLOW}   Public IP không có trong .env file${NC}"
    echo -e "${YELLOW}   Từ GCP Console, VM1 External IP là:${NC}"
    echo -e "${BLUE}   → 35.193.42.199${NC}"
    read -p "   Nhập VM1 Public IP (hoặc Enter dùng 35.193.42.199): " VM1_PUBLIC_INPUT
    VM1_PUBLIC="${VM1_PUBLIC_INPUT:-35.193.42.199}"
fi

if [ -z "$VM1_PUBLIC" ]; then
    echo -e "${RED}   ❌ VM1 Public IP is required!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} VM1 Public IP: ${VM1_PUBLIC}"
echo ""

# [3] Auto-detect VM2 internal IP
echo -e "${YELLOW}[3/4] Auto-detecting VM2 internal IP...${NC}"

# Method 1: From apps/.env (CI/CD generated)
if [ -f "/home/mitsne/realtime-chat/apps/.env" ]; then
    echo -e "${BLUE}   Checking apps/.env...${NC}"
    # Extract from VM2_INTERNAL_IP=10.128.0.2 format
    VM2_INTERNAL=$(grep "^VM2_INTERNAL_IP=" /home/mitsne/realtime-chat/apps/.env 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'")
fi

# Method 2: From docker-compose environment variables
if [ -z "$VM2_INTERNAL" ] && [ -f "/home/mitsne/realtime-chat/apps/docker-compose.yml" ]; then
    echo -e "${BLUE}   Checking docker-compose.yml for REDIS_HOST...${NC}"
    # Extract IP from REDIS_HOST=10.128.0.2 or similar
    VM2_INTERNAL=$(grep "REDIS_HOST=" /home/mitsne/realtime-chat/apps/docker-compose.yml 2>/dev/null | grep -oP '\d+\.\d+\.\d+\.\d+' | head -1)
fi

# Method 3: From running backend container
if [ -z "$VM2_INTERNAL" ]; then
    echo -e "${BLUE}   Checking backend container env...${NC}"
    VM2_INTERNAL=$(docker exec backend_chat env 2>/dev/null | grep "REDIS_HOST=" | grep -oP '\d+\.\d+\.\d+\.\d+' | head -1 || echo "")
fi

# Method 4: Manual input với default suggestion
if [ -z "$VM2_INTERNAL" ]; then
    echo -e "${YELLOW}   Could not auto-detect VM2 IP.${NC}"
    echo -e "${YELLOW}   Từ GCP Console, VM2 Internal IP là:${NC}"
    echo -e "${BLUE}   → 10.128.0.2${NC}"
    read -p "   Nhập VM2 Internal IP (hoặc Enter dùng 10.128.0.2): " VM2_INTERNAL_INPUT
    VM2_INTERNAL="${VM2_INTERNAL_INPUT:-10.128.0.2}"
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
