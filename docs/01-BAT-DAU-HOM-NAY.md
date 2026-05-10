# 🎯 HƯỚNG DẪN CỤ THỂ - BƯỚC ĐẦU TIÊN (HÔM NAY)

## ⏱️ Thời Gian: 3-4 Giờ

Tại cuối 3-4 giờ hôm nay, bạn sẽ có:
- ✅ Frontend hoàn chỉnh chạy trên máy
- ✅ Backend cơ bản chạy
- ✅ Database kết nối
- ✅ Authentication hoạt động

---

## 📝 PHẦN 1: FRONTEND SETUP (1 giờ)

### Step 1.1: Tạo React Project (5 phút)

```bash
# Mở Terminal/CMD
# Di chuyển tới thư mục muốn lưu project

cd ~/Documents
# hoặc bất kỳ thư mục nào

# Tạo project
npx create-react-app hui-management-system
cd hui-management-system
```

⏱️ **Chờ ~5-10 phút** (npm cài dependencies)

### Step 1.2: Cài Tailwind CSS (5 phút)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 1.3: Cài Thêm Libraries (5 phút)

```bash
npm install lucide-react recharts axios zustand react-hook-form zod date-fns
```

### Step 1.4: Copy 4 Files Config (10 phút)

**Làm 4 bước này:**

**1. Copy `tailwind.config.js`**
- Mở file `tailwind.config.js` từ outputs/
- Copy toàn bộ nội dung
- Dán vào `tailwind.config.js` ở gốc project (thay thế)

**2. Copy `index.css`**
- Mở file `index.css` từ outputs/
- Copy toàn bộ nội dung
- Dán vào `src/index.css` (thay thế)

**3. Copy `hui_management_ui.jsx`**
- Mở file `hui_management_ui.jsx` từ outputs/
- Copy toàn bộ nội dung
- Dán vào `src/App.jsx` (thay thế toàn bộ)

**4. Update `src/index.jsx`**

Mở `src/index.jsx`, xóa hết, thay bằng:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Step 1.5: Chạy Frontend (5 phút)

```bash
npm start
```

⏱️ **Chờ ~30 giây** server khởi động

Mở: **http://localhost:3000**

🎉 Bạn sẽ thấy **giao diện HUI PRO hoàn chỉnh!**

---

## 📝 PHẦN 2: BACKEND SETUP (1 giờ)

### Step 2.1: Tạo Backend Folder (5 phút)

**Trong folder khác** (không phải trong hui-management-system)

```bash
mkdir hui-backend
cd hui-backend
```

### Step 2.2: Initialize Node Project (5 phút)

```bash
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken pg sequelize
npm install --save-dev nodemon
```

### Step 2.3: Tạo File `.env` (5 phút)

Tạo file `.env` trong `hui-backend`:

```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hui_db
DB_USER=postgres
DB_PASSWORD=123456
JWT_SECRET=your-secret-key-123
NODE_ENV=development
```

### Step 2.4: Tạo `package.json` Scripts (5 phút)

Mở `package.json`, thay section `scripts`:

```json
"scripts": {
  "dev": "nodemon src/index.js",
  "start": "node src/index.js"
}
```

### Step 2.5: Tạo File Server (15 phút)

**Tạo thư mục**

```bash
mkdir -p src/{routes,models,middleware,utils}
```

**File: `src/index.js`**

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Test auth route
app.post('/api/auth/login', (req, res) => {
  // Mock authentication
  res.json({
    user: {
      id: 1,
      email: 'user@hui.local',
      name: 'Test User',
      role: 'organizer'
    },
    token: 'test-token-123'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
```

### Step 2.6: Chạy Backend (5 phút)

```bash
npm run dev
```

Sẽ thấy:
```
✅ Server running on http://localhost:5000
📊 Health check: http://localhost:5000/api/health
```

Test bằng browser:
- Mở: **http://localhost:5000/api/health**
- Sẽ thấy: `{"status":"OK","timestamp":"..."}`

---

## 📝 PHẦN 3: DATABASE SETUP (1 giờ)

### Step 3.1: Cài PostgreSQL (30 phút)

#### Windows:
1. Download từ: https://www.postgresql.org/download/
2. Chạy installer
3. Nhớ password để đăng nhập (VD: 123456)
4. Default port: 5432

#### Mac:
```bash
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu):
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 3.2: Tạo Database (15 phút)

#### Cách 1: Command Line (Nhanh nhất)

```bash
# Mac/Linux
sudo -u postgres psql

# Windows (PowerShell as Admin)
psql -U postgres

# Paste command này:
CREATE DATABASE hui_db;
```

#### Cách 2: pgAdmin GUI (Nếu cài pgAdmin)

1. Mở pgAdmin
2. Đăng nhập
3. Right-click "Databases"
4. "Create" → "Database"
5. Tên: `hui_db`
6. OK

### Step 3.3: Test Connection (15 phút)

**Tạo file `src/utils/db.js`:**

```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  }
);

module.exports = sequelize;
```

**Thêm vào `src/index.js` (sau middleware):**

```javascript
const sequelize = require('./utils/db');

// Test DB connection
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database error:', err));
```

Chạy lại backend:
```bash
npm run dev
```

Nếu thấy `✅ Database connected` → Thành công!

---

## 📝 PHẦN 4: CONNECT FRONTEND & BACKEND (30 phút)

### Step 4.1: Update Frontend API URL (5 phút)

Tạo file `.env` trong `hui-management-system`:

```
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 4.2: Update API Client (10 phút)

Tạo file `src/utils/api.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Step 4.3: Test API Call (15 phút)

Tạo file `src/hooks/useTest.js`:

```javascript
import { useEffect, useState } from 'react';
import api from '../utils/api';

export function useTest() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/health')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
```

Thêm vào `src/App.jsx` (sau imports):

```javascript
import { useTest } from './hooks/useTest';

// Thêm vào component:
const { data, loading } = useTest();

// Thêm console.log:
console.log('API Response:', data);
```

Mở DevTools (F12) → Console
Nếu thấy API data → **Thành công!** 🎉

---

## ✅ CHECKLIST HOÀN TẤT

- [ ] Frontend tạo xong (npm start chạy)
- [ ] Giao diện HUI PRO hiển thị trên http://localhost:3000
- [ ] Backend tạo xong (npm run dev chạy)
- [ ] Health check hoạt động (http://localhost:5000/api/health)
- [ ] Database `hui_db` tạo xong
- [ ] Database kết nối được (✅ Database connected)
- [ ] Frontend kết nối backend được (API Response in console)

---

## 🎉 TẬT CẢ XONG!

Lúc này bạn đã có:
✅ Frontend chạy (http://localhost:3000)
✅ Backend chạy (http://localhost:5000)
✅ Database kết nối
✅ Frontend-Backend communication hoạt động

---

## 📞 GẶP SỰ CỐ?

### Frontend không hiển thị
```
→ Kiểm tra npm start có chạy
→ Xóa node_modules, npm install lại
→ Check console (F12) cho lỗi
```

### Backend không chạy
```
→ Port 5000 bị dùng? Thay port khác trong .env
→ npm modules chưa cài? npm install
→ Node version < 16? Cập nhật Node.js
```

### Database không kết nối
```
→ PostgreSQL đã start? (systemctl/brew services)
→ DB password sai? Update .env
→ DB chưa tạo? Tạo via psql hoặc pgAdmin
```

### CORS error
```
→ Backend có `app.use(cors())`?
→ Frontend URL đúng?
→ Network tab có lỗi?
```

---

## 🚀 TIẾP THEO (NGÀY MAI)

1. **Tạo Models** - User, Group, Member (1 giờ)
2. **Tạo API Endpoints** - Groups CRUD (2 giờ)
3. **Tạo Auth** - Login/Register (2 giờ)
4. **Integrate** - Replace mock data (2 giờ)

**Sau 4 ngày, bạn sẽ có hệ thống hoàn chỉnh!**

---

## 📚 TÀI LIỆU THAM KHẢO

```
Frontend:
- React: https://react.dev
- Tailwind: https://tailwindcss.com
- Axios: https://axios-http.com

Backend:
- Express: https://expressjs.com
- Sequelize: https://sequelize.org
- PostgreSQL: https://www.postgresql.org

Your docs:
- ROADMAP_PHAT_TRIEN_CHI_TIET.md (chi tiết toàn bộ)
- huong_dan_thiet_lap_giao_dien.md (frontend)
- START_HERE.md (tóm tắt nhanh)
```

---

**Bắt đầu bây giờ! ⏱️ Thời gian: 3-4 giờ**

**Good luck! 🚀✨**
