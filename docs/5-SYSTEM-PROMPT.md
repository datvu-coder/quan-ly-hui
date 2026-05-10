# HỆ THỐNG QUẢN LÝ HỤI - PROMPT CHI TIẾT

## 📋 TỔNG QUAN DỰ ÁN

Xây dựng một **Hệ thống quản lý hụi toàn diện** dành cho các chủ hụi và hụi viên tại Việt Nam, tuân thủ Nghị định 19/2019/NĐ-CP và Bộ luật Dân sự 2015.

---

## 🎯 CÔNG NĂNG CHÍNH

### 1. **QUẢN LÝ DÂY HỤI**
- Tạo mới dây hụi với các thông tin:
  - Tên dây hụi
  - Số lượng hụi viên dự kiến
  - Số tiền góp mỗi kỳ
  - Chu kỳ hụi (tính theo ngày/tuần/tháng)
  - Ngày bắt đầu
  - Loại hụi: hụi chết (không lãi) hoặc hụi sống (có lãi)
  - Mức lãi suất (nếu có, ≤ 20%/năm)
  - Hoa hồng chủ hụi (%)
  - Ghi chú/quy tắc riêng

- Sửa đổi/xóa dây hụi
- Xem danh sách tất cả dây hụi
- Thống kê chi tiết từng dây hụi

### 2. **QUẢN LÝ HỤI VIÊN**
- Thêm hụi viên vào dây hụi:
  - Tên hụi viên
  - Số điện thoại
  - Địa chỉ
  - Email
  - Ngày tham gia
  - Chữ ký/xác nhận tham gia
  
- Sửa/xóa hụi viên
- Xem danh sách hụi viên theo từng dây hụi
- Theo dõi trạng thái hụi viên (đang tham gia/đã rút/hết hạn)

### 3. **QUẢN LÝ KỲ HỤI & VIỆC GÓPCPNG**
- Tự động tạo lịch các kỳ hụi dựa trên chu kỳ
- Ghi nhận tiền góp hụi:
  - Ngày góp
  - Người góp (hụi viên)
  - Số tiền góp
  - Chứng chỉ góp (biên nhận số)
  - Ghi chú
  
- Cảnh báo hụi viên chưa góp đúng hạn
- Lịch sử góp hụi của từng hụi viên
- Tính tổng tiền góp mỗi kỳ

### 4. **QUẢN LÝ VIỆC HỐT HỤI (LĨNH HỤI)**
- Ghi nhận người hốt hụi:
  - Kỳ hốt (ngày/tuần/tháng)
  - Người hốt (tên hụi viên)
  - Tổng tiền nhận
  - Lãi suất áp dụng (nếu hụi có lãi)
  - Hoa hồng chủ hụi
  - Tiền nhận thực tế
  - Chứng nhận hốt hụi
  
- Tính lãi tự động:
  - **Hụi chết**: Mỗi hụi viên nhận = (Số tiền góp/kỳ × Số hụi viên × Số kỳ)
  - **Hụi sống**: Người hốt trước lỗ, người hốt sau lời
    - Tính toán lãi dựa trên số kỳ đã qua
    - Áp dụng mức lãi suất tháng/tuần theo thỏa thuận
  
- Lịch sử hốt hụi
- Xác nhận/ký số hốt hụi

### 5. **QUẢN LÝ TÀI CHÍNH**
- Báo cáo thu chi:
  - Tổng tiền góp nhận được
  - Tổng tiền chi trả
  - Tiền lãi tích lũy (nếu hụi có lãi)
  - Hoa hồng chủ hụi
  - Số dư tài khoản
  
- Sổ hụi điện tử:
  - Ghi chép tự động tất cả giao dịch
  - Ngày góp, số tiền, người góp
  - Ngày hốt, số tiền, người hốt, số lãi
  
- In báo cáo tài chính (PDF)
- Cảnh báo số dư không cân bằng

### 6. **TÍNH TOÁN LÃI SUẤT**
- Công thức tính lãi:
  - Nếu hụi có lãi: **Lãi = (Tổng tiền góp × Mức lãi suất × Số kỳ) / 12**
  - Cộng vào tiền nhận của hốt con cuối
  - Trừ vào tiền nhận của hốt con đầu

- Hỗ trợ tính lãi suất:
  - Lãi hàng tháng
  - Lãi hàng kỳ
  - Lãi tính từ lúc hốt sớm

### 7. **QUẢN LÝ RỦI RO & BẢO MẬT**
- Thông báo về rủi ro:
  - Cảnh báo hụi viên nợ quá 2 kỳ
  - Báo cáo hụi viên không còn liên lạc
  - Số dư quỹ không đủ để trả
  
- Kiểm soát quyền:
  - Tài khoản chủ hụi (quản lý đầy đủ)
  - Tài khoản hụi viên (xem được thông tin cá nhân)
  - Tài khoản trợ lý chủ hụi (quản lý góp/hốt)
  
- Ghi nhật ký hành động (activity log)
- Sao lưu dữ liệu định kỳ

---

## 📊 CÁC CHỨC NĂNG PHỤTRỢ

### 8. **THÔNG BÁO & NHẮc NHỠ**
- Thông báo kỳ góp sắp tới
- Nhắc nhở hụi viên chưa góp
- Cảnh báo kỳ hốt sắp diễn ra
- Gửi SMS/Email thông báo
- Lịch sử thông báo

### 9. **THỐNG KÊ & BÁO CÁO**
- Dashboard tổng quan:
  - Số dây hụi đang chạy
  - Tổng hụi viên
  - Tổng quỹ
  - Tình trạng góp hụi (%)
  
- Báo cáo theo dây hụi
- Báo cáo theo hụi viên
- Biểu đồ tiến độ
- Xuất dữ liệu (CSV, Excel, PDF)

### 10. **QUẢN LÝ THỎA THUẬN**
- Lưu trữ thỏa thuận dây hụi (PDF)
- Ghi chép ngày ký thỏa thuận
- Quản lý sửa đổi/bổ sung thỏa thuận
- Yêu cầu xác nhận thỏa thuận từ hụi viên

### 11. **LỊCH SỬ & AUDIT**
- Ghi nhận tất cả thay đổi
- Ai, khi nào, thay đổi gì
- Khôi phục dữ liệu trước đó
- Kiểm tra độ chính xác báo cáo

### 12. **HỖ TRỢ PHÁP LÝ**
- Cảnh báo các hành vi vi phạm pháp luật:
  - Lãi suất > 20%/năm
  - Tổng quỹ ≥ 100 triệu cần thông báo UB nhân dân xã
  - Vay lãi nặng
  
- Mẫu thỏa thuận theo Nghị định 19/2019/NĐ-CP
- Hướng dẫn pháp luật
- Cảnh báo rủi ro lừa đảo

---

## 🛠️ YÊU CẦU KỸ THUẬT

### Frontend:
- React/Vue.js hoặc HTML/CSS/JS
- Giao diện responsive (desktop, tablet, mobile)
- Dark mode/Light mode
- Tiếng Việt tối ưu hóa
- Biểu đồ dữ liệu (Chart.js, Recharts)

### Backend:
- Node.js (Express) hoặc Python (Django/Flask)
- Database: PostgreSQL hoặc MongoDB
- REST API
- Authentication & Authorization
- Mã hóa dữ liệu nhạy cảm

### Features:
- Export/Import dữ liệu (CSV, Excel, PDF)
- Tính toán tự động
- Thông báo real-time
- Sao lưu dữ liệu tự động
- Offline mode (tùy chọn)

---

## 📈 QUY TRÌNH HOẠT ĐỘNG

### Bước 1: **Lập dây hụi**
1. Chủ hụi tạo dây hụi mới
2. Xác định số hụi viên, số tiền, lãi suất
3. Tạo thỏa thuận
4. Gửi thỏa thuận đến hụi viên

### Bước 2: **Tuyển hụi viên**
1. Hụi viên tham gia dây hụi
2. Xác nhận thỏa thuận
3. Ghi nhận hụi viên trong hệ thống

### Bước 3: **Quản lý góp hụi**
1. Hệ thống tạo lịch kỳ góp
2. Chủ hụi nhận tiền góp
3. Ghi nhận góp hụi
4. Cảnh báo chưa góp

### Bước 4: **Lãnh hụi**
1. Tính toán tiền lãnh (có/không lãi)
2. Ghi nhận người hốt hụi
3. Chi trả tiền
4. Cập nhật sổ hụi

### Bước 5: **Kết thúc dây hụi**
1. Kiểm tra tất cả hụi viên đã hốt
2. Tính tổng kết
3. Lưu trữ dữ liệu
4. Báo cáo hoàn kết

---

## 🔒 QUYỀN RIÊNG TƯ & BẢOMAT

- Mỗi dây hụi được cô lập dữ liệu
- Hụi viên chỉ xem thông tin cá nhân
- Chủ hụi xem toàn bộ thông tin
- Không lưu trữ dữ liệu nhạy cảm (CMND, số tài khoản)
- Mã hóa kết nối (HTTPS)
- Token xác thực (JWT)

---

## 💡 ƯUTIÊU

### Phase 1 (MVP):
- Tạo dây hụi
- Quản lý hụi viên
- Ghi nhận góp/hốt
- Báo cáo đơn giản

### Phase 2:
- Tính lãi tự động
- Thông báo SMS/Email
- Dashboard chi tiết
- Thống kê chuyên sâu

### Phase 3:
- Mobile app
- Ký số thỏa thuận
- Chứng chỉ điện tử
- Tích hợp ngân hàng

---

## 📋 TUÂN THỦ PHÁP LUẬT

✅ **Nghị định 19/2019/NĐ-CP:**
- Lãi suất ≤ 20%/năm
- Thỏa thuận bằng văn bản
- Thông báo UBND xã nếu tổng quỹ ≥ 100 triệu
- Sổ hụi đầy đủ (ngày, người, số tiền)
- Biên nhận giao dịch

✅ **Bộ luật Dân sự 2015:**
- Mục đích tương trợ lẫn nhau
- Tự do ý chí, không ép buộc
- Không lừa đảo/chiếm đoạt
- Hợp đồng hợp pháp

---

## 🎓 CÔNG THỨC TÍNH TOÁN

### Hụi chết (không lãi):
```
Tiền nhận = Số tiền góp/kỳ × Số hụi viên × Số kỳ quá
(Trừ hoa hồng chủ hụi)
```

### Hụi sống (có lãi):
```
Lãi suất tháng = Lãi suất năm / 12

Người hốt kỳ N:
- Tiền góp của N kỳ trước đó
- Cộng lãi: (Tổng góp × Lãi suất × Số kỳ quá)
- Trừ hoa hồng chủ hụi

Ví dụ: 10 người, 1 triệu/tháng, 20%/năm (≈1.67%/tháng):
- Kỳ 1: 10tr - hoa hồng = ~9.7tr (lỗ)
- Kỳ 5: 10tr + lãi - hoa hồng = ~10.8tr (lời)
- Kỳ 10: 10tr + lãi cao - hoa hồng = ~11.5tr (lời cao)
```

---

## 📌 GHI CHÚ QUAN TRỌNG

1. **Rủi ro**: Hộc vỡ hụi, chủ hụi lừa đảo
2. **Giải pháp**: Thỏa thuận rõ ràng, sổ hụi cụ thể, công chứng
3. **Tiếp cận pháp luật**: Tìm hiểu Nghị định 19/2019/NĐ-CP
4. **Chứng cứ**: Lưu giữ tất cả biên nhận, thỏa thuận
5. **Lựa chọn chủ hụi**: Chọn người uy tín, có khả năng tài chính

---

## 🚀 BƯỚC TIẾP THEO

1. **Chọn stack công nghệ** (React + Node.js + PostgreSQL)
2. **Thiết kế database schema**
3. **Phát triển API**
4. **Xây dựng UI**
5. **Kiểm thử**
6. **Deploy**
7. **Hướng dẫn sử dụng**

---

**Tài liệu này dựa trên:**
- Nghị định 19/2019/NĐ-CP (Chính phủ Việt Nam)
- Bộ luật Dân sự 2015
- Thực tế chơi hụi tại Việt Nam
