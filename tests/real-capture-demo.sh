#!/bin/bash

# Real Packet Capture & Replay Demo
# This script demonstrates replay attack using REAL HTTP traffic

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║         REAL PACKET CAPTURE & REPLAY DEMO                 ║"
echo "║         (For Thesis Demonstration)                        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check if running as root (needed for tcpdump)
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ This script needs root privileges for packet capture${NC}"
    echo -e "${YELLOW}Run with: sudo ./tests/real-capture-demo.sh${NC}"
    exit 1
fi

# Load environment
if [ -f "/home/mitsne/realtime-chat/tests/.env" ]; then
    source /home/mitsne/realtime-chat/tests/.env
else
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Run: ./tests/setup-vm-test-env.sh first${NC}"
    exit 1
fi

echo -e "${CYAN}This demo will:${NC}"
echo -e "  1. Start packet capture on backend port"
echo -e "  2. ${YELLOW}Wait for you to send a message from browser${NC}"
echo -e "  3. Stop capture and extract request data"
echo -e "  4. Replay the exact same request"
echo -e "  5. Show that replay attack is BLOCKED"
echo ""
echo -e "${BOLD}${YELLOW}⚠ IMPORTANT: Have your browser ready at:${NC}"
echo -e "${BLUE}   http://${VM1_PUBLIC_IP}:8029/chat${NC}"
echo ""

read -p "Press Enter when you're ready to start..."

# Temporary files
CAPTURE_FILE="/tmp/chat-capture.pcap"
EXTRACTED_JSON="/tmp/captured-request.json"
REPLAY_RESPONSE="/tmp/replay-response.txt"

# Cleanup old files
rm -f $CAPTURE_FILE $EXTRACTED_JSON $REPLAY_RESPONSE

echo ""
echo -e "${BOLD}${GREEN}[STEP 1/5] Starting packet capture...${NC}"
echo -e "${BLUE}   Capturing traffic on port 8029...${NC}"

# Start tcpdump in background
timeout 60 tcpdump -i any -s 0 port 8029 -w $CAPTURE_FILE &
TCPDUMP_PID=$!

echo -e "${GREEN}✓${NC} Packet capture started (PID: $TCPDUMP_PID)"
echo ""

echo -e "${BOLD}${YELLOW}[STEP 2/5] WAITING FOR YOUR ACTION${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}NOW:${NC}"
echo -e "  1. Go to browser: ${BLUE}http://${VM1_PUBLIC_IP}:8029/chat${NC}"
echo -e "  2. Send a message: ${BLUE}\"Test Replay Attack Demo\"${NC}"
echo -e "  3. Wait for message to appear in chat"
echo ""
echo -e "${YELLOW}Then come back here and press Enter...${NC}"
echo ""

read -p "Press Enter after you sent the message..."

echo ""
echo -e "${BOLD}${GREEN}[STEP 3/5] Stopping capture...${NC}"

# Stop tcpdump
kill $TCPDUMP_PID 2>/dev/null || true
sleep 2

if [ ! -f $CAPTURE_FILE ]; then
    echo -e "${RED}❌ Capture file not found!${NC}"
    exit 1
fi

PACKET_COUNT=$(tcpdump -r $CAPTURE_FILE 2>/dev/null | wc -l)
echo -e "${GREEN}✓${NC} Captured ${PACKET_COUNT} packets"
echo ""

echo -e "${BOLD}${BLUE}[STEP 4/5] Analyzing captured traffic...${NC}"

# Note: Full packet parsing requires tshark/wireshark
# For demo, we'll use a simpler approach

echo -e "${YELLOW}   Packet capture saved to: ${CAPTURE_FILE}${NC}"
echo -e "${YELLOW}   Use Wireshark to view: wireshark ${CAPTURE_FILE}${NC}"
echo ""
echo -e "${CYAN}   To extract full request:${NC}"
echo -e "${BLUE}   tshark -r ${CAPTURE_FILE} -T json > ${EXTRACTED_JSON}${NC}"
echo ""

echo -e "${BOLD}${YELLOW}[STEP 5/5] MANUAL REPLAY ATTACK${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}To perform replay attack:${NC}"
echo ""
echo -e "1. Open browser DevTools (F12) → Network tab"
echo -e "2. Find the POST request to ${BLUE}/api/proxy/message/send${NC}"
echo -e "3. Right-click → Copy → Copy as cURL"
echo -e "4. Paste to terminal and run"
echo ""
echo -e "${RED}Expected Result:${NC}"
echo -e "  • ${GREEN}First request: 200 OK${NC}"
echo -e "  • ${RED}Replay: 401 Unauthorized (Nonce already used)${NC}"
echo ""

echo -e "${BOLD}${CYAN}Example curl command format:${NC}"
cat << 'CURLEXAMPLE'

curl -X POST http://35.193.42.199:8029/api/proxy/message/send \
  -H "Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "65f1234567890abcdef",
    "content": "Test Replay Attack Demo",
    "nonce": "1a2b3c4d5e6f...",
    "timestamp": 1708444800000,
    "hmac": "9f8e7d6c5b4a..."
  }'

CURLEXAMPLE

echo ""
echo -e "${BOLD}${GREEN}✅ DEMO SETUP COMPLETE!${NC}"
echo ""
echo -e "${CYAN}Files created:${NC}"
echo -e "  • Packet capture: ${CAPTURE_FILE}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Extract request from DevTools"
echo -e "  2. Run curl command to replay"
echo -e "  3. Verify 401 error"
echo -e "  4. Check Redis: ${BLUE}docker exec -it redis redis-cli -a \$REDIS_PASS KEYS 'chat:nonce:*'${NC}"
echo ""
echo -e "${BOLD}${BLUE}For full guide, see: tests/MANUAL_DEMO_GUIDE.md${NC}"
echo ""
