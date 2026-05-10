# 🚀 ROADMAP PHÁT TRIỂN HỆ THỐNG HỤI - TỪ A ĐẾN Z

## 📋 MỤC LỤC

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Frontend Setup](#phase-1-frontend-setup)
3. [Phase 2: Backend Setup](#phase-2-backend-setup)
4. [Phase 3: Database Design](#phase-3-database-design)
5. [Phase 4: API Development](#phase-4-api-development)
6. [Phase 5: Frontend Integration](#phase-5-frontend-integration)
7. [Phase 6: Testing & Optimization](#phase-6-testing--optimization)
8. [Phase 7: Deployment](#phase-7-deployment)
9. [Tools & Technologies](#tools--technologies)
10. [Timeline & Milestones](#timeline--milestones)

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React Frontend (hui_management_ui.jsx)              │  │
│  │  - Dashboard, Groups, Members, Transactions, Reports │  │
│  │  - State Management (Zustand)                         │  │
│  │  - Axios for API calls                                │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/REST API
┌──────────────────────▼──────────────────────────────────────┐
│                    NODE.JS SERVER                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Express.js API                                       │  │
│  │  ├─ Routes (/api/groups, /api/members, etc.)         │  │
│  │  ├─ Controllers (business logic)                      │  │
│  │  ├─ Middleware (auth, validation, error handling)    │  │
│  │  └─ Services (calculations, generators)              │  │
│  │                                                       │  │
│  │  Authentication & Security                           │  │
│  │  ├─ JWT tokens                                       │  │
│  │  ├─ Bcrypt password hashing                          │  │
│  │  └─ CORS, HTTPS                                      │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL Queries
┌──────────────────────▼──────────────────────────────────────┐
│                   POSTGRESQL DB                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Tables:                                              │  │
│  │  - users (id, email, passwordHash, role)             │  │
│  │  - hui_groups (id, name, type, contribution, etc.)   │  │
│  │  - members (id, name, phone, group_id, etc.)         │  │
│  │  - contributions (id, member_id, amount, date)       │  │
│  │  - distributions (id, member_id, amount, etc.)       │  │
│  │  - transactions (audit log)                          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏱️ TIMELINE TỔNG QUÁT

```
Week 1  │ ██████ Frontend Setup + Database Design
Week 2  │ ██████ Backend Setup + Auth
Week 3  │ ██████ API Development
Week 4  │ ██████ Frontend Integration
Week 5  │ ██████ Testing + Bug Fix
Week 6  │ ██████ Optimization + Deploy
       └─────────────────────────────────────────
        Total: 6 weeks (4-6 hours/day)
```

---

## PHASE 1: FRONTEND SETUP (Week 1, Days 1-3)

### ✅ Objectives
- [x] Setup React project với Tailwind
- [x] Giao diện đã có (copy-paste)
- [x] Navigation hoạt động
- [x] Mock data setup

### 📋 Checklist

#### Step 1.1: Project Initialization (1 hour)

```bash
# 1.1.1 Tạo project
npx create-react-app hui-management-system
cd hui-management-system

# 1.1.2 Cài Tailwind & dependencies
npm install -D tailwindcss postcss autoprefixer
npm install lucide-react recharts axios zustand react-hook-form zod date-fns
npx tailwindcss init -p

# 1.1.3 Copy config files
# Xem file outputs: tailwind.config.js, index.css
```

#### Step 1.2: Project Structure (30 minutes)

```bash
mkdir -p src/{components,hooks,context,utils,pages,assets}
mkdir -p public/assets/{images,icons}
```

**File structure:**
```
src/
├── App.jsx                      # Main component
├── index.jsx
├── index.css                    # Global styles
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   └── TopBar.jsx
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   └── Badge.jsx
│   └── pages/
│       ├── Dashboard.jsx
│       ├── Groups.jsx
│       ├── Members.jsx
│       ├── Transactions.jsx
│       └── Reports.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useHuiGroups.js
│   ├── useMembers.js
│   ├── useTransactions.js
│   └── useCalculations.js
├── context/
│   ├── AuthContext.js
│   └── HuiContext.js
├── utils/
│   ├── api.js                   # Axios instance
│   ├── calculations.js
│   ├── validators.js
│   └── constants.js
└── assets/
    └── logo.svg
```

#### Step 1.3: Copy Giao Diện (30 minutes)

```bash
# Copy từ outputs/:
# - tailwind.config.js → gốc
# - index.css → src/
# - hui_management_ui.jsx → src/App.jsx
```

#### Step 1.4: Setup Context & Hooks (1 hour)

**File: `src/context/HuiContext.js`**
```javascript
import React, { createContext, useState, useCallback } from 'react';

export const HuiContext = createContext();

export function HuiProvider({ children }) {
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addGroup = useCallback((group) => {
    setGroups(prev => [...prev, { ...group, id: Date.now() }]);
  }, []);

  const addMember = useCallback((member) => {
    setMembers(prev => [...prev, { ...member, id: Date.now() }]);
  }, []);

  const addTransaction = useCallback((transaction) => {
    setTransactions(prev => [...prev, { ...transaction, id: Date.now() }]);
  }, []);

  return (
    <HuiContext.Provider
      value={{
        groups,
        members,
        transactions,
        loading,
        error,
        addGroup,
        addMember,
        addTransaction,
      }}
    >
      {children}
    </HuiContext.Provider>
  );
}
```

**File: `src/hooks/useCalculations.js`**
```javascript
export function useCalculations() {
  // Hụi chết
  const calculateNoInterest = (contribution, members, cycles, commission = 0.02) => {
    const total = contribution * members * cycles;
    const fee = contribution * members * commission;
    return { total, fee, net: total - fee };
  };

  // Hụi sống
  const calculateWithInterest = (
    contribution,
    members,
    cycle,
    annualRate,
    commission = 0.03
  ) => {
    const monthlyRate = annualRate / 12;
    const total = contribution * members * cycle;
    const fee = contribution * members * commission;

    if (cycle <= members / 2) {
      const interest = total * monthlyRate * (members - cycle);
      return { total, interest: -interest, fee, net: total - interest - fee };
    } else {
      const interest = total * monthlyRate * (cycle - members / 2);
      return { total, interest, fee, net: total + interest - fee };
    }
  };

  return { calculateNoInterest, calculateWithInterest };
}
```

#### Step 1.5: Setup API Client (30 minutes)

**File: `src/utils/api.js`**
```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### Step 1.6: Test Frontend (30 minutes)

```bash
npm start
# Kiểm tra:
# - Giao diện hiển thị đúng
# - Sidebar collapse/expand
# - Navigation work
# - Responsive design
```

---

## PHASE 2: BACKEND SETUP (Week 1-2, Days 4-7)

### ✅ Objectives
- [x] Node.js + Express server
- [x] Authentication (JWT)
- [x] Database connection
- [x] Basic API structure

### 📋 Checklist

#### Step 2.1: Initialize Node.js Project (30 minutes)

```bash
# Tạo backend folder
mkdir hui-backend
cd hui-backend

# Initialize
npm init -y

# Cài dependencies
npm install express cors dotenv bcryptjs jsonwebtoken pg sequelize
npm install --save-dev nodemon

# Tạo thư mục
mkdir -p src/{routes,controllers,middleware,models,services,utils}
```

**File: `package.json`**
```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  }
}
```

#### Step 2.2: Setup Express Server (1 hour)

**File: `src/index.js`**
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/members', require('./routes/members'));
app.use('/api/transactions', require('./routes/transactions'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

**File: `.env`**
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hui_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

#### Step 2.3: Setup PostgreSQL Connection (1 hour)

**File: `src/models/database.js`**
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

#### Step 2.4: Define Models (2 hours)

**File: `src/models/User.js`**
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'organizer', 'member', 'assistant'),
    defaultValue: 'member',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = User;
```

**File: `src/models/HuiGroup.js`**
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const HuiGroup = sequelize.define('HuiGroup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('no_interest', 'interest_bearing'),
    allowNull: false,
  },
  contributionAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  cycleFrequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    defaultValue: 'monthly',
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  commission: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 2,
  },
  organizerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'completed'),
    defaultValue: 'active',
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
  },
  totalMembers: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currentCycle: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  notes: DataTypes.TEXT,
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = HuiGroup;
```

**File: `src/models/Member.js`**
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Member = sequelize.define('Member', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  joinDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('active', 'withdrawn', 'inactive'),
    defaultValue: 'active',
  },
  totalContributed: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  totalReceived: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  signature: DataTypes.STRING,
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Member;
```

**File: `src/models/Contribution.js`**
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Contribution = sequelize.define('Contribution', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  memberId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  cycle: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  receiptNumber: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'failed'),
    defaultValue: 'confirmed',
  },
  notes: DataTypes.TEXT,
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Contribution;
```

**File: `src/models/Distribution.js`**
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Distribution = sequelize.define('Distribution', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  memberId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cycle: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  baseAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  interest: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  commission: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  netAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2),
  },
  notes: DataTypes.TEXT,
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Distribution;
```

#### Step 2.5: Setup Authentication (1.5 hours)

**File: `src/routes/auth.js`**
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      name,
      role: 'organizer', // Default role
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

**File: `src/middleware/auth.js`**
```javascript
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;
```

#### Step 2.6: Test Backend (30 minutes)

```bash
npm run dev
# Kiểm tra:
# - Server running on port 5000
# - CORS enabled
# - Can connect to DB
# - Auth endpoints work (POST /api/auth/register, login)
```

---

## PHASE 3: DATABASE DESIGN (Week 2)

### ✅ Objectives
- [x] Database schema
- [x] Migrations
- [x] Seed data
- [x] Relationships

### 📋 Checklist

#### Step 3.1: Create Database

```bash
# Tạo database PostgreSQL
createdb hui_db

# Hoặc dùng pgAdmin GUI
```

#### Step 3.2: Setup Sequelize Migrations (1 hour)

```bash
npm install --save-dev sequelize-cli
npx sequelize-cli init
```

**File: `.sequelizerc`**
```javascript
const path = require('path');

module.exports = {
  'config': path.resolve('src/config', 'database.js'),
  'models-path': path.resolve('src/models'),
  'seeders-path': path.resolve('src/seeders'),
  'migrations-path': path.resolve('src/migrations'),
};
```

#### Step 3.3: Run Migrations (1 hour)

```bash
npx sequelize-cli db:migrate

# Database sẽ tạo tất cả tables
```

#### Step 3.4: Seed Initial Data (1 hour)

**File: `src/seeders/init-users.js`**
```javascript
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('Users', [
      {
        email: 'admin@hui.local',
        passwordHash,
        name: 'Admin User',
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'organizer@hui.local',
        passwordHash,
        name: 'Organizer User',
        role: 'organizer',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
```

```bash
npx sequelize-cli db:seed:all
```

---

## PHASE 4: API DEVELOPMENT (Week 2-3)

### ✅ Objectives
- [x] 15+ API endpoints
- [x] Full CRUD operations
- [x] Calculations
- [x] Error handling

### 📋 API Endpoints

#### Groups API

```
GET    /api/groups              → List all groups
POST   /api/groups              → Create new group
GET    /api/groups/:id          → Get group details
PUT    /api/groups/:id          → Update group
DELETE /api/groups/:id          → Delete group
GET    /api/groups/:id/stats    → Get group statistics
```

#### Members API

```
GET    /api/members                 → List all members
POST   /api/members                 → Add member
GET    /api/members/:id             → Get member details
PUT    /api/members/:id             → Update member
DELETE /api/members/:id             → Remove member
GET    /api/groups/:id/members      → Get group members
```

#### Contributions API

```
POST   /api/contributions           → Record contribution
GET    /api/contributions           → List contributions
GET    /api/members/:id/contributions → Member contribution history
GET    /api/groups/:id/contributions  → Group contribution summary
```

#### Distributions API

```
POST   /api/distributions           → Record distribution
GET    /api/distributions           → List distributions
GET    /api/members/:id/distributions → Member distribution history
GET    /api/groups/:id/distributions  → Group distribution summary
```

#### Reports API

```
GET    /api/reports/financial       → Financial report
GET    /api/reports/members/:id     → Member report
GET    /api/reports/groups/:id      → Group report
GET    /api/reports/interest        → Interest calculation report
```

#### Implementation Example

**File: `src/routes/groups.js`**
```javascript
const express = require('express');
const authMiddleware = require('../middleware/auth');
const HuiGroup = require('../models/HuiGroup');
const Member = require('../models/Member');

const router = express.Router();

// List groups (chủ hụi's groups)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const groups = await HuiGroup.findAll({
      where: { organizerId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, type, contributionAmount, interestRate, totalMembers } = req.body;

    // Validation
    if (type === 'interest_bearing' && interestRate > 20) {
      return res.status(400).json({
        error: 'Interest rate must not exceed 20% per year'
      });
    }

    const group = await HuiGroup.create({
      ...req.body,
      organizerId: req.user.id,
      startDate: new Date(),
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get group details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await HuiGroup.findByPk(req.params.id, {
      include: [Member],
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update group
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await HuiGroup.findByPk(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await group.update(req.body);
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete group
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await HuiGroup.findByPk(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await group.destroy();
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

**Implement tương tự cho:**
- Members routes
- Contributions routes
- Distributions routes
- Reports routes

---

## PHASE 5: FRONTEND INTEGRATION (Week 3-4)

### ✅ Objectives
- [x] Replace mock data with API calls
- [x] User authentication
- [x] Data fetching & loading states
- [x] Error handling

### 📋 Implementation Steps

#### Step 5.1: Update API Calls (2 hours)

**File: `src/hooks/useHuiGroups.js`**
```javascript
import { useEffect, useState } from 'react';
import api from '../utils/api';

export function useHuiGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const response = await api.get('/groups');
        setGroups(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const createGroup = async (groupData) => {
    try {
      const response = await api.post('/groups', groupData);
      setGroups(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
      throw err;
    }
  };

  const updateGroup = async (id, groupData) => {
    try {
      const response = await api.put(`/groups/${id}`, groupData);
      setGroups(prev => prev.map(g => g.id === id ? response.data : g));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update group');
      throw err;
    }
  };

  const deleteGroup = async (id) => {
    try {
      await api.delete(`/groups/${id}`);
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete group');
      throw err;
    }
  };

  return {
    groups,
    loading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
```

**Implement tương tự cho:**
- useMembers
- useTransactions
- useDistributions

#### Step 5.2: Add Authentication UI (1 hour)

**File: `src/pages/LoginPage.jsx`**
```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
      <div className="w-full max-w-md p-8 glass rounded-xl">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">HUI PRO</h1>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-amber-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-amber-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold rounded-lg hover:shadow-lg disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-slate-400 mt-4">
          Don't have an account?{' '}
          <a href="/register" className="text-amber-400 hover:text-amber-300">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}
```

#### Step 5.3: Update Main Pages (3 hours)

**Modify Dashboard to fetch real data**
```javascript
import { useHuiGroups } from '../hooks/useHuiGroups';
import { useMembers } from '../hooks/useMembers';
import { useTransactions } from '../hooks/useTransactions';

function DashboardPage() {
  const { groups, loading: groupsLoading } = useHuiGroups();
  const { members, loading: membersLoading } = useMembers();
  const { transactions, loading: txLoading } = useTransactions();

  if (groupsLoading || membersLoading || txLoading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  // Calculate stats
  const stats = [
    {
      label: 'Tổng Quỹ',
      value: `${(groups.reduce((sum, g) => {
        // Calculate total from contributions
        return sum;
      }, 0) / 1e6).toFixed(1)}M`,
    },
    // ... other stats
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Render with real data */}
    </div>
  );
}
```

---

## PHASE 6: TESTING & OPTIMIZATION (Week 5)

### ✅ Objectives
- [x] Unit tests
- [x] Integration tests
- [x] Performance optimization
- [x] Bug fixes

### 📋 Testing Strategy

#### Unit Tests
```bash
npm install --save-dev vitest @testing-library/react
```

**File: `src/utils/__tests__/calculations.test.js`**
```javascript
import { describe, it, expect } from 'vitest';
import { useCalculations } from '../../hooks/useCalculations';

describe('Calculations', () => {
  const { calculateNoInterest, calculateWithInterest } = useCalculations();

  it('calculates no-interest hui correctly', () => {
    const result = calculateNoInterest(1000000, 10, 3, 0.02);
    expect(result.net).toBe(29400000);
  });

  it('prevents interest rate > 20%', () => {
    expect(() => {
      calculateWithInterest(1000000, 12, 1, 25);
    }).toThrow('Interest rate exceeds maximum');
  });
});
```

#### Integration Tests
```bash
npm install --save-dev @testing-library/jest-dom
```

**Test API responses**

#### Performance
- Optimize API calls (pagination, lazy loading)
- Code splitting
- Image optimization
- Caching strategies

---

## PHASE 7: DEPLOYMENT (Week 6)

### ✅ Objectives
- [x] Frontend deployment
- [x] Backend deployment
- [x] Database setup
- [x] Domain & SSL

### 📋 Deployment Options

#### Option 1: Vercel (Frontend) + Railway (Backend)

**Frontend - Vercel:**
```bash
npm install -g vercel
vercel login
vercel
```

**Backend - Railway:**
```bash
# Link to Railway
railway link
railway up
```

#### Option 2: Docker + Cloud Hosting

**Dockerfile (Frontend)**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

**Dockerfile (Backend)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src ./src
EXPOSE 5000
CMD ["npm", "start"]
```

**Docker Compose**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hui_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  backend:
    build: ./hui-backend
    ports:
      - "5000:5000"
    environment:
      DB_HOST: postgres
      DB_NAME: hui_db
      DB_USER: postgres
      DB_PASSWORD: password
      JWT_SECRET: your-secret
    depends_on:
      - postgres

  frontend:
    build: ./hui-management-system
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:5000/api
```

#### Option 3: Traditional VPS (AWS EC2, DigitalOcean)

```bash
# SSH into VPS
ssh root@your_server_ip

# Setup Node & dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Setup PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Clone & setup project
git clone your-repo
cd hui-management-system
npm install
npm run build

# Setup Nginx as reverse proxy
sudo apt-get install nginx
# Configure nginx.conf

# Start services with PM2
npm install -g pm2
pm2 start "npm start" --name "hui-backend"
pm2 save
```

---

## 🛠️ TOOLS & TECHNOLOGIES

### Frontend Stack
```
React 18.2+              # UI Library
Tailwind CSS 3.3+        # Styling
Lucide React 0.292+      # Icons
Recharts 2.10+           # Charts
Zustand 4.4+             # State management
React Hook Form 7.48+    # Form handling
Axios 1.6+               # HTTP client
Zod 3.22+                # Validation
```

### Backend Stack
```
Node.js 18+              # Runtime
Express.js 4.18+         # Framework
PostgreSQL 15+           # Database
Sequelize 6.35+          # ORM
JWT                      # Authentication
Bcryptjs 2.4+            # Password hashing
CORS                     # Cross-origin
Dotenv                   # Environment vars
```

### DevTools
```
Vite 5.0+                # Build tool
Nodemon                  # Auto-reload
ESLint                   # Code quality
Prettier                 # Code formatting
Vitest 1.0+              # Testing
```

### Deployment
```
Vercel                   # Frontend hosting
Railway/Render           # Backend hosting
Docker                   # Containerization
PostgreSQL              # Cloud database
GitHub                   # Version control
```

---

## ⏱️ TIMELINE & MILESTONES

### Week 1: Foundation
```
Day 1: Project setup + Frontend
Day 2: Backend setup + Database design
Day 3: Authentication
Days 4-5: Model definitions
Days 6-7: API structure
```

### Week 2: Core APIs
```
Days 1-3: Groups API
Days 3-5: Members API
Days 5-7: Contributions API
```

### Week 3: More APIs
```
Days 1-3: Distributions API
Days 3-5: Reports API
Days 5-7: Calculations & validation
```

### Week 4: Integration
```
Days 1-3: Replace mock data
Days 3-5: Auth flows
Days 5-7: Error handling
```

### Week 5: Testing
```
Days 1-3: Unit tests
Days 3-5: Integration tests
Days 5-7: Bug fixes & optimization
```

### Week 6: Deployment
```
Days 1-3: Setup hosting
Days 3-5: Deploy frontend & backend
Days 5-7: Testing in production
```

---

## 📊 ESTIMATED EFFORT

```
Frontend Setup:         8 hours
Backend Setup:          6 hours
Database Design:        4 hours
API Development:        20 hours
Frontend Integration:   12 hours
Testing:                8 hours
Deployment:             4 hours
Documentation:          4 hours
─────────────────────────────
Total:                  66 hours (~8-10 days @ 8 hours/day)
```

---

## ✅ GO-LIVE CHECKLIST

- [ ] All tests passing
- [ ] No console errors
- [ ] Performance optimized (< 3s load)
- [ ] Security audit completed
- [ ] Database backups configured
- [ ] Error logging setup (Sentry)
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] User guide prepared
- [ ] Deployment verified

---

## 🎯 NEXT STEPS

1. **Start with Phase 1** - Setup frontend in 3 days
2. **Move to Phase 2** - Backend in parallel
3. **Phase 3-4** - APIs & integration
4. **Phase 5-7** - Testing & deployment

**Estimated total time: 6 weeks with consistent development**

Good luck! 🚀
