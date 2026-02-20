#!/bin/bash

# Message Tampering Attack Demo
# Demonstrates HMAC signature verification

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
echo "║         MESSAGE TAMPERING ATTACK DEMO                     ║"
echo "║         (HMAC Signature Verification)                     ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Load environment
if [ -f "/home/mitsne/realtime-chat/tests/.env" ]; then
    source /home/mitsne/realtime-chat/tests/.env
else
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

echo -e "${CYAN}Attack Scenarios:${NC}"
echo -e "  ${YELLOW}1.${NC} Modify message content (keep HMAC)"
echo -e "  ${YELLOW}2.${NC} Inject malicious payload"
echo -e "  ${YELLOW}3.${NC} Use forged HMAC signature"
echo ""

echo -e "${BOLD}${YELLOW}⚠ SETUP: Send a legitimate message first${NC}"
echo -e "${BLUE}   1. Go to: http://${VM1_PUBLIC_IP}:8029/chat${NC}"
echo -e "${BLUE}   2. Send message: \"Hello World\"${NC}"
echo -e "${BLUE}   3. Copy request data from DevTools${NC}"
echo ""

read -p "Press Enter when you have the request data ready..."

echo ""
echo -e "${BOLD}${CYAN}Enter the captured request data:${NC}"
echo ""

# Get user input
read -p "Room ID: " ROOM_ID
read -p "Original Content: " ORIGINAL_CONTENT
read -p "Nonce: " NONCE
read -p "Timestamp: " TIMESTAMP
read -p "HMAC: " HMAC
read -p "Cookie Token: " TOKEN

echo ""
echo -e "${BOLD}${GREEN}[SCENARIO 1] CONTENT TAMPERING${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${CYAN}Original message:${NC} \"${ORIGINAL_CONTENT}\""
echo -e "${CYAN}Tampered message:${NC} \"${RED}<script>alert('XSS')</script>${NC}\""
echo ""

echo -e "${BLUE}Sending tampered request...${NC}"

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${VM1_URL}/api/proxy/message/send" \
  -H "Cookie: token=${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"roomId\": \"${ROOM_ID}\",
    \"content\": \"<script>alert('XSS')</script>\",
    \"nonce\": \"${NONCE}\",
    \"timestamp\": ${TIMESTAMP},
    \"hmac\": \"${HMAC}\"
  }" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

echo ""
if [ "$HTTP_CODE" = "401" ] || echo "$BODY" | grep -qi "invalid.*hmac\|tamper"; then
    echo -e "${GREEN}✅ ATTACK BLOCKED!${NC}"
    echo -e "${BLUE}Response:${NC} $BODY"
    echo -e "${BLUE}HTTP Code:${NC} $HTTP_CODE"
    echo ""
    echo -e "${CYAN}Reason:${NC} HMAC signature doesn't match tampered content"
    RESULT_1="PASS"
else
    echo -e "${RED}❌ ATTACK SUCCEEDED (Security Issue!)${NC}"
    echo -e "${BLUE}Response:${NC} $BODY"
    RESULT_1="FAIL"
fi

echo ""
read -p "Press Enter to continue to next scenario..."

echo ""
echo -e "${BOLD}${GREEN}[SCENARIO 2] SQL INJECTION ATTEMPT${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

MALICIOUS_CONTENT="' OR '1'='1'; DROP TABLE messages; --"
echo -e "${CYAN}Injected content:${NC} \"${RED}${MALICIOUS_CONTENT}${NC}\""
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${VM1_URL}/api/proxy/message/send" \
  -H "Cookie: token=${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"roomId\": \"${ROOM_ID}\",
    \"content\": \"${MALICIOUS_CONTENT}\",
    \"nonce\": \"${NONCE}\",
    \"timestamp\": ${TIMESTAMP},
    \"hmac\": \"${HMAC}\"
  }" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" = "401" ] || echo "$BODY" | grep -qi "invalid.*hmac\|tamper"; then
    echo -e "${GREEN}✅ ATTACK BLOCKED!${NC}"
    echo -e "${BLUE}Response:${NC} $BODY"
    echo -e "${CYAN}Reason:${NC} HMAC verification failed"
    RESULT_2="PASS"
else
    echo -e "${RED}❌ ATTACK SUCCEEDED${NC}"
    RESULT_2="FAIL"
fi

echo ""
read -p "Press Enter to continue to next scenario..."

echo ""
echo -e "${BOLD}${GREEN}[SCENARIO 3] FORGED SIGNATURE${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

FAKE_HMAC="0000000000000000000000000000000000000000000000000000000000000000"
echo -e "${CYAN}Using fake HMAC:${NC} ${RED}${FAKE_HMAC}${NC}"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${VM1_URL}/api/proxy/message/send" \
  -H "Cookie: token=${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"roomId\": \"${ROOM_ID}\",
    \"content\": \"Hacked message\",
    \"nonce\": \"fake-nonce-123456\",
    \"timestamp\": $(date +%s)000,
    \"hmac\": \"${FAKE_HMAC}\"
  }" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" = "401" ] || echo "$BODY" | grep -qi "invalid.*hmac"; then
    echo -e "${GREEN}✅ ATTACK BLOCKED!${NC}"
    echo -e "${BLUE}Response:${NC} $BODY"
    echo -e "${CYAN}Reason:${NC} Attacker doesn't have secret key"
    RESULT_3="PASS"
else
    echo -e "${RED}❌ ATTACK SUCCEEDED${NC}"
    RESULT_3="FAIL"
fi

echo ""
echo ""
echo -e "${BOLD}${BLUE}════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  ATTACK SUMMARY${NC}"
echo -e "${BOLD}${BLUE}════════════════════════════════════════${NC}"
echo ""

echo -e "Scenario 1 - Content Tampering:     $([ "$RESULT_1" = "PASS" ] && echo -e "${GREEN}✅ BLOCKED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
echo -e "Scenario 2 - SQL Injection:         $([ "$RESULT_2" = "PASS" ] && echo -e "${GREEN}✅ BLOCKED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
echo -e "Scenario 3 - Forged Signature:      $([ "$RESULT_3" = "PASS" ] && echo -e "${GREEN}✅ BLOCKED${NC}" || echo -e "${RED}❌ FAILED${NC}")"

echo ""
if [ "$RESULT_1" = "PASS" ] && [ "$RESULT_2" = "PASS" ] && [ "$RESULT_3" = "PASS" ]; then
    echo -e "${BOLD}${GREEN}🎉 ALL ATTACKS BLOCKED - HMAC PROTECTION WORKING!${NC}"
    echo ""
    echo -e "${CYAN}Key Findings:${NC}"
    echo -e "  • HMAC signature prevents message tampering"
    echo -e "  • Attackers cannot modify content without detection"
    echo -e "  • Forged signatures are rejected immediately"
    echo -e "  • Secret key protection is effective"
else
    echo -e "${BOLD}${RED}⚠ SECURITY ISSUES DETECTED!${NC}"
fi

echo ""
echo -e "${YELLOW}For thesis documentation:${NC}"
echo -e "  • Screenshot the summary above"
echo -e "  • Include attack payloads in appendix"
echo -e "  • Document HMAC calculation method"
echo ""
