# 🎨 HƯỚNG DẪN THIẾT LẬP GIAO DIỆN HỤI PRO

## 📋 MỤC LỤC

1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt & Thiết Lập](#cài-đặt--thiết-lập)
3. [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
4. [Giải Thích Giao Diện](#giải-thích-giao-diện)
5. [Tùy Chỉnh Màu Sắc](#tùy-chỉnh-màu-sắc)
6. [Thêm Chức Năng](#thêm-chức-năng)

---

## ✅ Yêu Cầu Hệ Thống

```bash
Node.js: v16+ 
npm: v8+
React: v18+
```

---

## 🚀 Cài Đặt & Thiết Lập

### Bước 1: Tạo Dự Án React

```bash
npx create-react-app hui-management-system
cd hui-management-system
```

### Bước 2: Cài Đặt Dependencies

```bash
npm install tailwindcss postcss autoprefixer lucide-react
npx tailwindcss init -p
```

### Bước 3: Cấu Hình Tailwind

**File: `tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0f172a',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        orange: {
          500: '#f97316',
        },
      },
    },
  },
  plugins: [],
}
```

### Bước 4: Cài Đặt CSS Global

**File: `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Sohne:wght@600;700&display=swap');

* {
  @apply transition-colors duration-200;
}

body {
  @apply font-sans;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
```

### Bước 5: Copy Component

1. Mở file `hui_management_ui.jsx` từ output
2. Copy toàn bộ nội dung
3. Paste vào `src/App.jsx`
4. Xóa code cũ (logo, header, etc.)

### Bước 6: Chạy Ứng Dụng

```bash
npm start
```

Mở `http://localhost:3000` 🎉

---

## 📁 Cấu Trúc Dự Án

```
hui-management-system/
├── src/
│   ├── App.jsx                 # Main component (copy code vào đây)
│   ├── index.css               # CSS global
│   ├── index.js
│   ├── components/
│   │   ├── Dashboard.jsx       # Page Dashboard
│   │   ├── GroupsPage.jsx      # Page Quản Lý Dây Hụi
│   │   ├── MembersPage.jsx     # Page Quản Lý Thành Viên
│   │   ├── TransactionsPage.jsx # Page Giao Dịch
│   │   └── ReportsPage.jsx     # Page Báo Cáo
│   ├── hooks/
│   │   ├── useAuth.js          # Authentication
│   │   ├── useHuiGroups.js     # Quản lý dây hụi
│   │   └── useTransactions.js  # Quản lý giao dịch
│   ├── context/
│   │   └── HuiContext.js       # Global state
│   └── utils/
│       ├── calculations.js     # Tính toán lãi, góp, hốt
│       └── validators.js       # Kiểm tra pháp luật
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 🎨 Giải Thích Giao Diện

### 1. **Sidebar Navigation**

```jsx
// Đặc điểm:
// - Có thể thu/mở (toggle)
// - Thay đổi theme theo trang hiện tại
// - Logo HUI PRO (H gradient amber-orange)
// - Navigation items với icon

// Tùy chỉnh:
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'groups', label: 'Dây Hụi', icon: Users },
  // ... thêm items khác
];
```

### 2. **Top Bar**

```jsx
// Hiển thị:
// - Tiêu đề trang hiện tại
// - Bell icon (thông báo)
// - Settings icon
// - User menu (tuỳ chỉnh)

// Chức năng cần thêm:
// - Click bell → mở modal thông báo
// - Click settings → mở cài đặt
// - Click user → mở user menu
```

### 3. **Dashboard Page**

```jsx
// Hiển thị:
// - 4 stats card (Tổng Quỹ, Dây Hụi, Thành Viên, Hoa Hồng)
// - Biểu đồ thanh (6 tháng)
// - Danh sách dây hụi hoạt động
// - Giao dịch gần đây

// Cần kết nối API:
// - GET /api/stats - lấy thống kê
// - GET /api/groups - danh sách dây hụi
// - GET /api/transactions - giao dịch gần đây
```

### 4. **Groups Page**

```jsx
// Hiển thị:
// - Grid 3 cột dây hụi
// - Mỗi card có:
//   * Tên dây hụi
//   * Loại (Sống/Chết)
//   * Số thành viên
//   * Quỹ hiện tại
//   * Progress bar
//   * Nút chi tiết/sửa

// Cần kết nối API:
// - GET /api/groups - danh sách tất cả
// - POST /api/groups - tạo dây hụi mới
// - PUT /api/groups/:id - cập nhật
// - DELETE /api/groups/:id - xóa
```

### 5. **Members Page**

```jsx
// Hiển thị:
// - Bảng danh sách thành viên
// - Cột: Tên, Điện thoại, Dây Hụi, Đã Góp, Trạng Thái, Hành Động

// Cần kết nối API:
// - GET /api/members - danh sách
// - POST /api/members - thêm
// - PUT /api/members/:id - sửa
// - DELETE /api/members/:id - xóa
```

### 6. **Transactions Page**

```jsx
// Hiển thị:
// - Bảng tất cả giao dịch (góp/hốt)
// - Cột: Thành Viên, Dây, Loại, Số Tiền, Ngày, Trạng Thái

// Cần kết nối API:
// - GET /api/transactions - danh sách
// - POST /api/transactions - ghi nhận giao dịch
```

### 7. **Reports Page**

```jsx
// Hiển thị:
// - 4 report cards (Financial, Members, Interest, Groups)
// - Bảng tổng hợp tài chính
// - Nút xem chi tiết từng báo cáo

// Cần kết nối API:
// - GET /api/reports/:type - lấy báo cáo cụ thể
```

---

## 🎭 Tùy Chỉnh Màu Sắc

### Các Màu Chính:

```javascript
// Dark theme - Gradient slate
const colors = {
  background: 'from-slate-950 via-slate-900 to-slate-800',
  sidebar: 'bg-slate-950/80',
  card: 'bg-slate-800/40',
  border: 'border-slate-700/50',
  
  // Accents
  primary: 'from-amber-400 to-orange-500', // Gold
  info: 'from-blue-400 to-cyan-500',       // Blue
  success: 'from-green-400 to-emerald-500', // Green
  warning: 'from-yellow-400 to-yellow-500', // Yellow
  danger: 'from-red-400 to-red-500',       // Red
  purple: 'from-purple-400 to-pink-500',   // Purple
};
```

### Thay Đổi Theme:

**Option 1: Light Theme**

```javascript
// Đổi tất cả `slate-950` → `white`
// Đổi `slate-900` → `slate-50`
// Đổi `slate-800` → `slate-100`
// Đổi text `text-white` → `text-slate-900`
```

**Option 2: Custom Colors**

```javascript
// Trong tailwind.config.js, thêm:
theme: {
  extend: {
    colors: {
      brand: {
        primary: '#fbbf24',
        secondary: '#f97316',
        dark: '#0f172a',
      }
    }
  }
}

// Sử dụng:
className="bg-brand-primary text-brand-dark"
```

---

## ➕ Thêm Chức Năng

### 1. **Modal Tạo Dây Hụi Mới**

```jsx
import { Dialog, DialogContent } from '@/components/ui/dialog';

function CreateGroupModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'sống',
    members: 10,
    contribution: 1000000,
    interestRate: 20,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate
    if (formData.interestRate > 20) {
      alert('Lãi suất không được vượt quá 20%/năm!');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900">
        <h2 className="text-lg font-bold text-white">Tạo Dây Hụi Mới</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Tên dây hụi"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700"
          />
          {/* ... thêm các field khác */}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold rounded-lg"
          >
            Tạo Dây Hụi
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. **Context & State Management**

```jsx
// src/context/HuiContext.js
import React, { createContext, useState } from 'react';

export const HuiContext = createContext();

export function HuiProvider({ children }) {
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const addGroup = (group) => {
    setGroups([...groups, { ...group, id: Date.now() }]);
  };

  const addMember = (member) => {
    setMembers([...members, { ...member, id: Date.now() }]);
  };

  return (
    <HuiContext.Provider value={{ groups, members, transactions, addGroup, addMember }}>
      {children}
    </HuiContext.Provider>
  );
}
```

### 3. **Hook Tính Toán Lãi**

```jsx
// src/hooks/useCalculations.js
export function useCalculations() {
  // Hụi chết
  const calculateNoInterest = (contribution, members, cycles, commission = 0.02) => {
    const total = contribution * members * cycles;
    const fee = contribution * members * commission;
    return total - fee;
  };

  // Hụi sống
  const calculateWithInterest = (contribution, members, cycle, annualRate, commission = 0.03) => {
    const monthlyRate = annualRate / 12;
    const total = contribution * members * cycle;
    const fee = contribution * members * commission;
    
    if (cycle <= members / 2) {
      // Hốt sớm: phải trả lãi
      const interest = total * monthlyRate * (members - cycle);
      return total - interest - fee;
    } else {
      // Hốt muộn: nhận lãi
      const interest = total * monthlyRate * (cycle - members / 2);
      return total + interest - fee;
    }
  };

  return { calculateNoInterest, calculateWithInterest };
}
```

### 4. **Thêm Authentication**

```jsx
// src/hooks/useAuth.js
import { useState, useCallback } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('token', data.token);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  return { user, isLoading, login, logout };
}
```

---

## 📊 Tích Hợp Biểu Đồ

Thay thế biểu đồ thanh đơn giản bằng **Recharts**:

```bash
npm install recharts
```

```jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'T1', revenue: 175 },
  { month: 'T2', revenue: 210 },
  // ...
];

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
    <XAxis dataKey="month" stroke="#94a3b8" />
    <YAxis stroke="#94a3b8" />
    <Tooltip
      contentStyle={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '8px',
      }}
    />
    <Bar dataKey="revenue" fill="#fbbf24" radius={[8, 8, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

---

## 🔗 Kết Nối API

### Ví Dụ Fetch Data từ Backend:

```jsx
import { useEffect, useState } from 'react';

function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setGroups(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (loading) return <div className="text-white">Đang tải...</div>;
  if (error) return <div className="text-red-400">Lỗi: {error}</div>;

  return (
    // Render groups...
  );
}
```

---

## 🧪 Testing

```bash
npm install @testing-library/react @testing-library/jest-dom vitest
```

```jsx
import { render, screen } from '@testing-library/react';
import HuiManagementApp from './App';

describe('HUI Management App', () => {
  it('renders dashboard page', () => {
    render(<HuiManagementApp />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
```

---

## 📱 Responsive Design

Giao diện đã được tối ưu cho:
- ✅ Desktop (1920px+)
- ✅ Laptop (1366px - 1919px)
- ✅ Tablet (768px - 1365px)
- ✅ Mobile (320px - 767px)

Sử dụng Tailwind breakpoints:
```jsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
// Mobile: 1 cột
// Tablet (md): 2 cột
// Desktop (lg): 4 cột
```

---

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
# Upload dist/ folder to Netlify
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. **Màu sắc không hiển thị?**
   - Kiểm tra `tailwind.config.js`
   - Rebuild: `npm run build`

2. **Icon không hiển thị?**
   - Cài lại: `npm install lucide-react@latest`

3. **Responsive layout lỗi?**
   - Kiểm tra breakpoint classes (sm, md, lg, xl)

4. **Component không render?**
   - Check console cho lỗi
   - Verify imports (React, useState, etc.)

---

**Chúc bạn phát triển thành công! 🎉**
