#!/bin/bash

# Script Kiểm Thử Kịch Bản 1: Network Isolation
# Chứng minh VM2 không thể truy cập từ Internet

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  KỊCH BẢN 1: NETWORK ISOLATION${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get VM IPs
echo -e "${YELLOW}[1/5] Đang lấy thông tin VMs...${NC}"

VM1_NAME="chat-system-app"
VM2_NAME="tracker-n-chat-infrastructure"
ZONE="us-central1-c"

# Try to get IPs from gcloud (if available), otherwise use environment variables
if command -v gcloud &> /dev/null; then
    echo -e "${BLUE}   Using gcloud CLI to query VM info...${NC}"
    VM1_PUBLIC=$(gcloud compute instances describe $VM1_NAME \
      --zone=$ZONE \
      --format="get(networkInterfaces[0].accessConfigs[0].natIP)" 2>/dev/null || echo "")

    VM1_INTERNAL=$(gcloud compute instances describe $VM1_NAME \
      --zone=$ZONE \
      --format="get(networkInterfaces[0].networkIP)" 2>/dev/null || echo "")

    VM2_INTERNAL=$(gcloud compute instances describe $VM2_NAME \
      --zone=$ZONE \
      --format="get(networkInterfaces[0].networkIP)" 2>/dev/null || echo "")

    VM2_PUBLIC=$(gcloud compute instances describe $VM2_NAME \
      --zone=$ZONE \
      --format="get(networkInterfaces[0].accessConfigs[0].natIP)" 2>/dev/null || echo "")
else
    echo -e "${YELLOW}   gcloud CLI not found. Using environment variables...${NC}"
    echo -e "${YELLOW}   Set: VM1_PUBLIC_IP, VM1_INTERNAL_IP, VM2_INTERNAL_IP${NC}"
    VM1_PUBLIC="${VM1_PUBLIC_IP:-}"
    VM1_INTERNAL="${VM1_INTERNAL_IP:-}"
    VM2_INTERNAL="${VM2_INTERNAL_IP:-}"
    VM2_PUBLIC="${VM2_PUBLIC_IP:-}"
fi

echo -e "${GREEN}✓${NC} VM1 Public IP:  ${VM1_PUBLIC:-None}"
echo -e "${GREEN}✓${NC} VM1 Internal IP: ${VM1_INTERNAL}"
echo -e "${GREEN}✓${NC} VM2 Internal IP: ${VM2_INTERNAL}"
echo -e "${GREEN}✓${NC} VM2 Public IP:   ${VM2_PUBLIC:-None (Expected!)}"

# Test VM2 External IP
echo ""
echo -e "${YELLOW}[2/5] Kiểm tra VM2 External IP...${NC}"
if [ -z "$VM2_PUBLIC" ] || [ "$VM2_PUBLIC" = "None" ]; then
    echo -e "${GREEN}✅ PASS: VM2 không có External IP (Private Subnet)${NC}"
    TEST1_PASS=true
else
    echo -e "${RED}❌ FAIL: VM2 có External IP: $VM2_PUBLIC${NC}"
    echo -e "${RED}   Khuyến nghị: Remove external IP để tăng bảo mật${NC}"
    TEST1_PASS=false
fi

# Test connection to VM1 (should succeed)
echo ""
echo -e "${YELLOW}[3/5] Test kết nối đến VM1:8029 (should SUCCEED)...${NC}"

if [ -n "$VM1_PUBLIC" ]; then
    if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$VM1_PUBLIC:8029/health" | grep -q "200\|404"; then
        echo -e "${GREEN}✅ PASS: VM1:8029 accessible từ Internet${NC}"
        TEST2_PASS=true
    else
        echo -e "${YELLOW}⚠ WARNING: Không kết nối được VM1 (có thể do firewall)${NC}"
        TEST2_PASS=false
    fi
else
    echo -e "${RED}❌ VM1 không có public IP${NC}"
    TEST2_PASS=false
fi

# Test connection to VM2:43816 (should fail)
echo ""
echo -e "${YELLOW}[4/5] Test kết nối đến VM2:43816 Redis (should FAIL)...${NC}"

if [ -n "$VM2_INTERNAL" ]; then
    # Try telnet with timeout
    if timeout 3 bash -c "echo > /dev/tcp/$VM2_INTERNAL/43816" 2>/dev/null; then
        echo -e "${RED}❌ FAIL: Có thể kết nối tới VM2:43816${NC}"
        echo -e "${RED}   SECURITY RISK: Redis accessible từ network này!${NC}"
        TEST3_PASS=false
    else
        echo -e "${GREEN}✅ PASS: Không thể kết nối tới VM2:43816 (Connection refused/timeout)${NC}"
        TEST3_PASS=true
    fi
else
    echo -e "${YELLOW}⚠ Không lấy được VM2 internal IP${NC}"
    TEST3_PASS=false
fi

# Test connection to VM2:27017 MongoDB (should fail)
echo ""
echo -e "${YELLOW}[5/5] Test kết nối đến VM2:27017 MongoDB (should FAIL)...${NC}"

if [ -n "$VM2_INTERNAL" ]; then
    if timeout 3 bash -c "echo > /dev/tcp/$VM2_INTERNAL/27017" 2>/dev/null; then
        echo -e "${RED}❌ FAIL: Có thể kết nối tới VM2:27017${NC}"
        echo -e "${RED}   SECURITY RISK: MongoDB accessible từ network này!${NC}"
        TEST4_PASS=false
    else
        echo -e "${GREEN}✅ PASS: Không thể kết nối tới VM2:27017 (Connection refused/timeout)${NC}"
        TEST4_PASS=true
    fi
else
    TEST4_PASS=false
fi

# Test connection to VM2:5000 Socket Bridge (should fail from external)
echo ""
echo -e "${YELLOW}[BONUS] Test kết nối đến VM2:5000 Socket Bridge...${NC}"

if [ -n "$VM2_INTERNAL" ]; then
    if timeout 3 bash -c "echo > /dev/tcp/$VM2_INTERNAL/5000" 2>/dev/null; then
        echo -e "${YELLOW}⚠ INFO: Có thể kết nối tới VM2:5000${NC}"
        echo -e "${YELLOW}   (Điều này OK nếu bạn đang test từ VM1 hoặc internal network)${NC}"
    else
        echo -e "${GREEN}✅ Socket Bridge cũng được bảo vệ${NC}"
    fi
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  KẾT QUẢ KIỂM THỬ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

TOTAL_PASS=0
TOTAL_TESTS=4

[ "$TEST1_PASS" = true ] && ((TOTAL_PASS++))
[ "$TEST2_PASS" = true ] && ((TOTAL_PASS++))
[ "$TEST3_PASS" = true ] && ((TOTAL_PASS++))
[ "$TEST4_PASS" = true ] && ((TOTAL_PASS++))

echo -e "Test 1 - VM2 No External IP:       $([ "$TEST1_PASS" = true ] && echo -e "${GREEN}✅ PASS${NC}" || echo -e "${RED}❌ FAIL${NC}")"
echo -e "Test 2 - VM1 Accessible:            $([ "$TEST2_PASS" = true ] && echo -e "${GREEN}✅ PASS${NC}" || echo -e "${RED}❌ FAIL${NC}")"
echo -e "Test 3 - VM2:43816 Blocked:         $([ "$TEST3_PASS" = true ] && echo -e "${GREEN}✅ PASS${NC}" || echo -e "${RED}❌ FAIL${NC}")"
echo -e "Test 4 - VM2:27017 Blocked:         $([ "$TEST4_PASS" = true ] && echo -e "${GREEN}✅ PASS${NC}" || echo -e "${RED}❌ FAIL${NC}")"

echo ""
echo -e "Tổng kết: ${GREEN}$TOTAL_PASS/$TOTAL_TESTS${NC} tests passed"

if [ $TOTAL_PASS -eq $TOTAL_TESTS ]; then
    echo ""
    echo -e "${GREEN}🎉 KỊCH BẢN 1 - THÀNH CÔNG!${NC}"
    echo -e "${GREEN}Lớp Network Isolation đã chặn đứng mọi truy cập trái phép vào VM2.${NC}"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠ Một số tests failed. Xem lại cấu hình security.${NC}"
    exit 1
fi
