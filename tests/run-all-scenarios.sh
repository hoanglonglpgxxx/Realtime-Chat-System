#!/bin/bash

# Script Tổng Hợp - Chạy Tất Cả 4 Kịch Bản
# Defense-in-Depth Testing Suite

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${BOLD}${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║    BỘ KIỂM THỬ BẢO MẬT - PHÒNG THỦ CHIỀU SÂU            ║"
echo "║      (Defense-in-Depth Security Test Suite)               ║"
echo "║                                                            ║"
echo "║    Master's Thesis - Network Security                     ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

echo -e "${CYAN}Bộ test này sẽ kiểm tra 4 lớp phòng thủ:${NC}"
echo ""
echo -e "  ${YELLOW}1.${NC} Network Isolation (Tự động)"
echo -e "  ${YELLOW}2.${NC} HttpOnly Cookie (Hướng dẫn thủ công)"
echo -e "  ${YELLOW}3.${NC} HMAC + Replay Attack Prevention (Tự động)"
echo -e "  ${YELLOW}4.${NC} SIEM - Wazuh (Hướng dẫn setup)"
echo ""

read -p "Nhấn Enter để bắt đầu..."

# Make scripts executable
chmod +x tests/scenario1-network-isolation.sh 2>/dev/null || true
chmod +x tests/scenario2-httponly-cookie.sh 2>/dev/null || true

# Kịch bản 1
echo ""
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  KỊCH BẢN 1: NETWORK ISOLATION${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════${NC}"
echo ""

if [ -f "tests/scenario1-network-isolation.sh" ]; then
    bash tests/scenario1-network-isolation.sh
    RESULT_1=$?
else
    echo -e "${RED}❌ Script không tìm thấy${NC}"
    RESULT_1=1
fi

echo ""
read -p "Nhấn Enter để tiếp tục đến Kịch bản 2..."

# Kịch bản 2
echo ""
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  KỊCH BẢN 2: HTTPONLY COOKIE${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════${NC}"
echo ""

if [ -f "tests/scenario2-httponly-cookie.sh" ]; then
    bash tests/scenario2-httponly-cookie.sh
    RESULT_2=$?
else
    echo -e "${RED}❌ Script không tìm thấy${NC}"
    RESULT_2=1
fi

echo ""
read -p "Nhấn Enter để tiếp tục đến Kịch bản 3..."

# Kịch bản 3
echo ""
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  KỊCH BẢN 3: HMAC + REPLAY ATTACK${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════${NC}"
echo ""

echo -e "${CYAN}Kịch bản này bao gồm:${NC}"
echo -e "  • Message Injection (HMAC verification)"
echo -e "  • ${BOLD}Replay Attack Prevention${NC} (Nonce tracking)"
echo -e "  • Timestamp Validation"
echo ""

# Check if replay-attack-demo.js exists
if [ -f "tests/replay-attack-demo.js" ]; then
    echo -e "${YELLOW}Bạn có muốn chạy automated test? [y/N]:${NC} "
    read -r RUN_AUTO
    
    if [[ "$RUN_AUTO" =~ ^[Yy]$ ]]; then
        # Check if Node.js is available
        if command -v node &> /dev/null; then
            echo ""
            echo -e "${CYAN}Đang chạy replay attack demo...${NC}"
            
            # Load environment if exists
            if [ -f "tests/.env" ]; then
                export $(cat tests/.env | grep -v '^#' | xargs)
            fi
            
            # Run the test
            cd tests
            if echo "n" | node replay-attack-demo.js; then
                RESULT_3=0
            else
                RESULT_3=1
            fi
            cd ..
        else
            echo -e "${YELLOW}⚠ Node.js không được cài đặt. Skip automated test.${NC}"
            RESULT_3=2
        fi
    else
        echo ""
        echo -e "${CYAN}Manual test:${NC}"
        echo ""
        echo -e "1. SSH vào VM2:"
        echo -e "   ${GREEN}gcloud compute ssh tracker-n-chat-infrastructure --zone=us-central1-c${NC}"
        echo ""
        echo -e "2. Test Message Injection:"
        echo -e "   ${GREEN}docker exec -it redis redis-cli -a YOUR_PASSWORD${NC}"
        echo -e "   ${GREEN}PUBLISH mits_chat_event '{\"event\":\"fake\",\"message\":\"hacked\"}'${NC}"
        echo ""
        echo -e "3. Xem Socket Bridge logs:"
        echo -e "   ${GREEN}docker logs socket_bridge | tail -20${NC}"
        echo -e "   ${CYAN}→ Kỳ vọng: \"Invalid HMAC signature\"${NC}"
        echo ""
        echo -e "4. Để chạy automated replay attack demo:"
        echo -e "   ${GREEN}cd tests && node replay-attack-demo.js${NC}"
        echo ""
        RESULT_3=2
    fi
else
    echo -e "${RED}❌ replay-attack-demo.js không tìm thấy${NC}"
    RESULT_3=1
fi

echo ""
read -p "Nhấn Enter để tiếp tục đến Kịch bản 4..."

# Kịch bản 4
echo ""
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  KỊCH BẢN 4: SIEM - WAZUH${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════${NC}"
echo ""

echo -e "${CYAN}Kịch bản này cần Wazuh Agent & Manager đã được cài đặt.${NC}"
echo ""
echo -e "${YELLOW}Setup Wazuh (nếu chưa có):${NC}"
echo ""
echo -e "1. Install Wazuh Agent trên VM2:"
echo -e "   ${GREEN}# SSH to VM2${NC}"
echo -e "   ${GREEN}wget https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.7.0-1_amd64.deb${NC}"
echo -e "   ${GREEN}sudo WAZUH_MANAGER='MANAGER_IP' dpkg -i ./wazuh-agent*.deb${NC}"
echo -e "   ${GREEN}sudo systemctl start wazuh-agent${NC}"
echo ""
echo -e "2. Test tấn công Brute Force:"
echo -e "   ${GREEN}for i in {1..10}; do${NC}"
echo -e "   ${GREEN}  curl -X POST http://VM1_IP:8029/api/proxy/login \\${NC}"
echo -e "   ${GREEN}    -d '{\"username\":\"admin\",\"password\":\"wrong\"}'${NC}"
echo -e "   ${GREEN}done${NC}"
echo ""
echo -e "3. Test SQL Injection:"
echo -e "   ${GREEN}curl -X POST http://VM1_IP:8029/api/proxy/login \\${NC}"
echo -e "   ${GREEN}  -d '{\"username\":\"admin'\'' OR 1=1 --\",\"password\":\"x\"}'${NC}"
echo ""
echo -e "4. Kiểm tra Wazuh Dashboard:"
echo -e "   ${GREEN}https://WAZUH_MANAGER_IP${NC}"
echo -e "   ${CYAN}→ Kỳ vọng: Thấy alerts màu đỏ${NC}"
echo ""

echo -e "${YELLOW}Bạn đã setup Wazuh và muốn test? [y/N]:${NC} "
read -r HAS_WAZUH

if [[ "$HAS_WAZUH" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${CYAN}Nhập VM1 Public IP:${NC} "
    read -r VM1_IP
    
    if [ -n "$VM1_IP" ]; then
        echo ""
        echo -e "${YELLOW}Đang thực hiện Brute Force attack...${NC}"
        for i in {1..10}; do
            curl -s -X POST "http://$VM1_IP:8029/api/proxy/login" \
                -H "Content-Type: application/json" \
                -d "{\"username\":\"admin\",\"password\":\"wrong$i\"}" \
                > /dev/null 2>&1 || true
            echo -n "."
        done
        echo ""
        echo -e "${GREEN}✓${NC} Đã gửi 10 failed login attempts"
        
        echo ""
        echo -e "${YELLOW}Đang thực hiện SQL Injection...${NC}"
        curl -s -X POST "http://$VM1_IP:8029/api/proxy/login" \
            -H "Content-Type: application/json" \
            -d "{\"username\":\"admin' OR 1=1 --\",\"password\":\"x\"}" \
            > /dev/null 2>&1 || true
        echo -e "${GREEN}✓${NC} Đã gửi SQL injection payload"
        
        echo ""
        echo -e "${CYAN}Vui lòng kiểm tra Wazuh Dashboard sau ~30 giây để thấy alerts.${NC}"
        RESULT_4=0
    else
        echo -e "${RED}❌ Không nhập VM1 IP${NC}"
        RESULT_4=1
    fi
else
    echo -e "${YELLOW}⚠ Skip kịch bản 4. Tham khảo docs để setup Wazuh.${NC}"
    RESULT_4=2
fi

# Final Summary
echo ""
echo ""
echo -e "${BOLD}${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║                    TỔNG KẾT KẾT QUẢ                       ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

print_result() {
    case $1 in
        0) echo -e "${GREEN}✅ PASS${NC}" ;;
        1) echo -e "${RED}❌ FAIL${NC}" ;;
        2) echo -e "${YELLOW}⚠ SKIP${NC}" ;;
        *) echo -e "${YELLOW}? UNKNOWN${NC}" ;;
    esac
}

echo -e "┌────────────────────────────────────────────────────────┐"
echo -e "│ Kịch Bản                       │ Kết Quả              │"
echo -e "├────────────────────────────────────────────────────────┤"
echo -e "│ 01. Network Isolation          │ $(print_result $RESULT_1)              │"
echo -e "│ 02. HttpOnly Cookie            │ $(print_result $RESULT_2)              │"
echo -e "│ 03. HMAC + Replay Attack       │ $(print_result $RESULT_3)              │"
echo -e "│ 04. SIEM (Wazuh)               │ $(print_result $RESULT_4)              │"
echo -e "└────────────────────────────────────────────────────────┘"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  CHECKLIST CHO BÁO CÁO THESIS:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "[ ] Screenshots từ Kịch bản 1 (Network Isolation)"
echo "[ ] Screenshots từ Kịch bản 2 (HttpOnly Cookie)"
echo "[ ] Screenshots từ Kịch bản 3 (HMAC + Replay Attack)"
echo "[ ] Screenshots từ Kịch bản 4 (Wazuh Dashboard)"
echo "[ ] Bảng tổng hợp kết quả"
echo "[ ] Architecture diagram với 4 lớp phòng thủ"
echo "[ ] Phân tích Defense-in-Depth scenario"
echo "[ ] Code implementation review"
echo ""

echo -e "${GREEN}Tài liệu tham khảo:${NC}"
echo -e "  • ${BLUE}notes/DEFENSE_IN_DEPTH_DEMO.md${NC} - Hướng dẫn chi tiết"
echo -e "  • ${BLUE}tests/README.md${NC} - Quick start guide"
echo ""

echo -e "${BOLD}${GREEN}🎓 Chúc bạn thành công với thesis!${NC}"
echo ""
