# 🎯 HUI PRO - Hệ Thống Quản Lý Hụi Chuyên Nghiệp

> **Giải pháp quản lý hụi (huyên, hội, biêu, phường) hiện đại cho Việt Nam** 🇻🇳

Ứng dụng web chuyên nghiệp giúp chủ hụi và các thành viên quản lý toàn bộ quy trình góp hụi, tính lãi suất, và phân phối quỹ một cách an toàn, minh bạch theo quy định pháp luật Việt Nam.

## ✨ Đặc Điểm Chính

- 🎨 **Giao diện hiện đại, chuyên nghiệp** - Dark theme sang trọng với design luxury/minimal
- 💰 **Quản lý tài chính toàn diện** - Tổng quỹ, thu chi, lãi suất, hoa hồng
- 👥 **Quản lý thành viên** - Danh sách, tình trạng, lịch sử góp/hốt
- 📊 **Báo cáo chi tiết** - Tài chính, thành viên, lãi suất, dây hụi
- 🔒 **Tuân thủ pháp luật** - Theo Nghị định 19/2019/NĐ-CP và Bộ luật Dân sự 2015
- 📱 **Responsive Design** - Hoạt động tốt trên desktop, tablet, mobile
- 🚀 **Tính năng đa dạng** - Từ MVP cơ bản đến giải pháp enterprise

## 🎮 Các Trang Chính

### 1️⃣ Dashboard
- Thống kê tổng quỹ, dây hụi, thành viên, hoa hồng
- Biểu đồ tài chính 6 tháng
- Danh sách dây hụi hoạt động
- Giao dịch gần đây

### 2️⃣ Dây Hụi
- Tạo/sửa/xóa dây hụi
- Chọn loại (sống/chết), lãi suất, số thành viên
- Xem tiến độ từng dây hụi
- Chi tiết tài chính từng dây

### 3️⃣ Thành Viên
- Danh sách tất cả thành viên
- Thêm/sửa/xóa thành viên
- Xem tình trạng (hoạt động, cảnh báo, nợ)
- Lịch sử góp hụi cá nhân

### 4️⃣ Giao Dịch
- Ghi nhận góp hụi
- Ghi nhận hốt hụi
- Xem lịch sử tất cả giao dịch
- Xác nhận/hủy giao dịch

### 5️⃣ Báo Cáo
- Báo cáo tài chính
- Báo cáo thành viên
- Báo cáo lãi suất
- Báo cáo dây hụi
- Xuất PDF/Excel

## 🛠️ Công Nghệ Sử Dụng

### Frontend
```
React 18.2+              # UI Library
Tailwind CSS 3.3+        # Styling
Lucide React             # Icons
Recharts 2.10+           # Charts
```

### Backend (Optional)
```
Node.js + Express        # API Server
PostgreSQL               # Database
JWT                      # Authentication
Bcrypt                   # Password Hashing
```

### DevTools
```
Vite                     # Build Tool
ESLint                   # Linting
Prettier                 # Code Formatting
Vitest                   # Testing
```

## 📦 Cài Đặt

### 1. Clone/Download Project

```bash
# Nếu có Git
git clone https://github.com/yourusername/hui-management-system.git
cd hui-management-system

# Hoặc tải file ZIP
# Extract và vào thư mục
```

### 2. Cài Đặt Dependencies

```bash
# Cài npm packages
npm install
```

Sẽ cài đặt tất cả packages trong `package.json`:
- React, React DOM
- Tailwind CSS + Postcss + Autoprefixer
- Lucide React icons
- Recharts cho biểu đồ
- Và các package khác

### 3. Thiết Lập Files Config

Các file sau đã được chuẩn bị sẵn:

```
✅ tailwind.config.js     - Cấu hình Tailwind (màu, font, animation)
✅ index.css              - CSS global & component styles
✅ package.json           - Dependencies & scripts
✅ hui_management_ui.jsx  - React component chính
```

Chỉ cần copy vào thư mục `src/`

### 4. Chạy Development Server

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:5173**

### 5. Build cho Production

```bash
npm run build
```

Output: `dist/` folder (upload lên server)

## 📂 Cấu Trúc Thư Mục

```
hui-management-system/
├── src/
│   ├── App.jsx                    # ⭐ Main component
│   ├── index.jsx                  # Entry point
│   ├── index.css                  # Global styles
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── GroupsPage.jsx
│   │   ├── MembersPage.jsx
│   │   ├── TransactionsPage.jsx
│   │   └── ReportsPage.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useHuiGroups.js
│   │   └── useCalculations.js
│   ├── context/
│   │   └── HuiContext.js
│   └── utils/
│       ├── calculations.js
│       ├── validators.js
│       └── api.js
├── public/
├── index.html
├── package.json
├── tailwind.config.js             # ⭐ Cấu hình Tailwind
├── vite.config.js
└── README.md
```

## 🎯 Hướng Dẫn Sử Dụng

### Bước 1: Đăng Nhập
```
Email: chuhui@example.com
Password: •••••••••
```

### Bước 2: Tạo Dây Hụi Mới
```
Nhấn "+ Tạo Dây Hụi"
├─ Tên: Hụi Phố Cổ
├─ Loại: Sống (có lãi)
├─ Lãi suất: 20% /năm
├─ Số thành viên: 12
├─ Góp mỗi tháng: 1,000,000 đ
└─ Nhấn "Tạo"
```

### Bước 3: Thêm Thành Viên
```
Nhấn "+ Thêm Thành Viên"
├─ Tên: Chị Liên
├─ Điện thoại: 0914123456
├─ Địa chỉ: Hà Nội
└─ Nhấn "Thêm"
```

### Bước 4: Ghi Nhận Góp Hụi
```
Vào "Giao Dịch"
├─ Nhấn "Ghi Nhận Góp"
├─ Chọn dây hụi & thành viên
├─ Nhập số tiền góp
└─ Nhấn "Lưu"
```

### Bước 5: Hốt Hụi
```
Vào "Giao Dịch"
├─ Nhấn "Ghi Nhận Hốt"
├─ Chọn dây hụi & người hốt
├─ Hệ thống tính tự động
└─ Nhấn "Xác Nhận"
```

## 💡 Công Thức Tính Lãi

### Hụi Chết (Không Lãi)
```
Tiền nhận = (Góp/tháng × Số thành viên × Tháng) - Hoa hồng

Ví dụ:
- 12 người × 1M/tháng × Tháng 3 = 36M
- Hoa hồng 2% = 720k
- Tiền nhận = 35.28M ✅
```

### Hụi Sống (Có Lãi)
```
Lãi = Tổng góp × Lãi suất tháng × Số tháng

Người hốt sớm (Tháng 1): LỖ lãi ❌ (9.4M)
Người hốt muộn (Tháng 12): LỜI lãi ✅ (158.6M)

Công thức: Xem file vi_du_tinh_toan_hui.md
```

## 🔐 Bảo Mật & Quyền

### 3 Loại Tài Khoản

| Role | Quyền | Hạn Chế |
|------|-------|--------|
| **Chủ Hụi** | Tất cả | Không có |
| **Thành Viên** | Xem cá nhân | Không sửa |
| **Trợ Lý** | Ghi góp/hốt | Không quản lý |

### Bảo Mật
- ✅ JWT Authentication
- ✅ Password Hash (Bcrypt)
- ✅ HTTPS required
- ✅ Activity logging
- ✅ Data validation

## 📊 Báo Cáo

### Báo Cáo Tài Chính
```
Tổng Góp Nhận:    450.5M
Tổng Chi Trả:     380.2M
Lãi Tích Lũy:      25.8M
Hoa Hồng:          10.5M
Số Dư Quỹ:         95.6M ✓
```

### Xuất Dữ Liệu
- 📄 PDF report
- 📊 Excel spreadsheet
- 📋 CSV data
- 🖨️ In trực tiếp

## 🚀 Deploy

### Vercel (Recommended)
```bash
npm install -g vercel
vercel login
vercel
```

### Netlify
```bash
npm run build
# Upload dist/ folder
```

### Docker
```bash
docker build -t hui-app .
docker run -p 3000:3000 hui-app
```

### Self-hosted
```bash
npm run build
# Upload dist/ to server
# Serve with Nginx/Apache
```

## 🛠️ Phát Triển Thêm

### Thêm Chức Năng
1. Xem `huong_dan_thiet_lap_giao_dien.md`
2. Làm theo từng phần
3. Test kỹ lưỡng

### Kết Nối API Backend
```javascript
// useEffect hook example
useEffect(() => {
  fetch('/api/groups', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(r => r.json())
  .then(data => setGroups(data))
}, []);
```

### Thêm Tests
```bash
npm run test
```

## 📚 Tài Liệu Tham Khảo

- 📖 `hui_management_system_prompt.md` - Yêu cầu hệ thống chi tiết
- 💻 `claude_code_hui_prompt.md` - Prompt cho Claude Code
- 📊 `vi_du_tinh_toan_hui.md` - Ví dụ tính toán
- 🎨 `huong_dan_thiet_lap_giao_dien.md` - Setup giao diện

## 📋 Pháp Luật & Compliance

### Nghị Định 19/2019/NĐ-CP
- ✅ Mục đích tương trợ lẫn nhau
- ✅ Lãi suất ≤ 20% /năm
- ✅ Thỏa thuận bằng văn bản
- ✅ Sổ hụi đầy đủ
- ✅ Thông báo UB nhân dân xã nếu ≥ 100M

### Bộ Luật Dân Sự 2015
- ✅ Điều 471 về hụi, họ, biêu, phường
- ✅ Lãi suất theo quy định
- ✅ Không cho vay lãi nặng
- ✅ Không lừa đảo/chiếm đoạt

## ⚠️ Rủi Ro Cảnh Báo

Hệ thống sẽ cảnh báo về:
- 🔴 Lãi suất > 20%/năm
- 🔴 Quỹ ≥ 100M (cần thông báo)
- 🟡 Thành viên nợ >2 kỳ
- 🟡 Không liên lạc được 30 ngày
- 🟡 Số dư không cân bằng

## 🤝 Hỗ Trợ & Đóng Góp

### Báo Cáo Lỗi
```
GitHub Issues → Mô tả chi tiết
```

### Feature Requests
```
Discussion → Đề xuất chức năng mới
```

### Đóng Góp Code
```bash
git checkout -b feature/new-feature
git commit -am 'Add new feature'
git push origin feature/new-feature
# Tạo Pull Request
```

## 📝 License

MIT License - Tự do sử dụng cho mục đích thương mại & cá nhân

## 👨‍💻 Tác Giả

**Bạn** - Tạo bởi đội ngũ phát triển Việt Nam

## 🙏 Cảm Ơn

- React, Tailwind, Vite community
- Nghị định 19/2019/NĐ-CP
- Cộng đồng hụi Việt Nam

---

## 🎉 Bắt Đầu Ngay

```bash
# 1. Clone project
git clone https://github.com/yourusername/hui-management-system.git

# 2. Install dependencies
cd hui-management-system
npm install

# 3. Run development server
npm run dev

# 4. Open browser
# http://localhost:5173
```

**Chúc bạn thành công với HUI PRO!** 🚀

---

**Cần giúp?** Xem tài liệu chi tiết trong thư mục `docs/`

**Có gợi ý?** Mở issue hoặc discussion trên GitHub

**Muốn đóng góp?** Tạo Pull Request!
