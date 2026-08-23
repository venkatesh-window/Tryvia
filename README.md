# ✨ TryVia — Luxury Beauty Discovery & Sampling Platform

> **« Discover → Try → Experience → Upgrade → Review → Earn »**

**TryVia** is a premium Beauty Discovery, Sampling, and Smart Upgrade Platform that transforms the way customers shop for luxury beauty and haute parfumerie. Instead of purchasing expensive full-sized products without knowing if they work, users can first buy affordable tester products, experience them, and seamlessly upgrade to the full-sized version using their locked **TryVia Wallet**.

---

## 🌟 Key Innovations

* 🧪 **Try Before You Buy**: Order luxury sample formulations (3ml – 10ml) from world-renowned brands like *Chanel*, *Dior*, *Kiehl's*, and *Le Labo*.
* 💎 **Smart Upgrade System (90% Locked Credit)**:
  * When you purchase a tester for **₹300**, the entire value is credited to your TryVia Wallet.
  * When you upgrade to the full-sized formulation (**₹5,200**), **90% of your tester purchase (₹270)** is automatically applied as a discount.
  * The 10% remaining is retained as a transparent platform fee.
* 🔐 **Clerk Authentication with Custom UI**:
  * 100% bespoke luxury interface in warm porcelain (`#FAF8F5`) and dusty rose (`#CB6D73`).
  * Seamless **Google OAuth** and **Email/Password with 6-digit OTP verification**.
* 🛍️ **Guest Exploration & Member Gating**:
  * Guests can freely explore the product catalog, hero carousels, and category galleries.
  * Cart, Wishlist, and Checkout are gated to protect member upgrade credits and order history.

---

## 🛠️ Technology Stack (MERN Architecture)

### 📱 Frontend (Mobile & Web)
* **Framework**: React Native with **Expo SDK 54** & **Expo Router**
* **Language**: TypeScript (Strict Mode)
* **Styling & Aesthetics**: Custom Vanilla Design System (Porcelain, Dusty Rose, Glassmorphism)
* **Animations**: `react-native-reanimated` & `moti` (Fluid 60 FPS spring physics & layout transitions)
* **State Management**: `zustand` (Auth, Cart, Wishlist, Theme)
* **Data Fetching**: `@tanstack/react-query` & `axios`
* **Authentication**: **Clerk** (`@clerk/clerk-expo` + Native-safe direct FAPI integration with Google OAuth)
* **Validation**: `zod`
* **Typography**: Cormorant Garamond & Inter (Google Fonts)
* **Icons**: `lucide-react-native` & `react-native-svg`

### 🚀 Backend
* **Runtime**: Node.js
* **Framework**: Express.js
* **Language**: TypeScript (`ts-node-dev` for hot-reloading)
* **Database**: **MongoDB** with **Mongoose ODM**
* **Authentication**: JWT (JSON Web Tokens) & `bcryptjs`
* **Security & Middleware**: `cors`, `dotenv`, centralized error handling
* **API Style**: Modular RESTful APIs mounted on `/api/v1`

---

## 📂 Project Architecture

```
Tryvia/
├── 📁 backend/                         # Express.js + TypeScript + MongoDB
│   ├── 📁 src/
│   │   ├── 📁 config/                  # MongoDB Mongoose connection manager
│   │   ├── 📁 middleware/              # JWT auth and centralized error handlers
│   │   ├── 📁 models/                  # Mongoose Schemas (User, Product, Brand, Category, Order, Wallet)
│   │   ├── 📁 routes/                  # Express Routers (auth, products, orders, wallet)
│   │   ├── seed.ts                     # TypeScript database seeder
│   │   └── server.ts                   # Express server entry point (:8000)
│   ├── package.json
│   └── tsconfig.json
│
├── 📁 mobile/                          # React Native + Expo App
│   ├── 📁 app/                         # Expo Router screens
│   │   ├── 📁 (tabs)/                  # Bottom Tab Navigator (Home, Products, Categories, Offers, Orders, Profile)
│   │   ├── 📁 product/[id].tsx         # Luxury Product Details bottom-sheet screen
│   │   ├── 📁 tester/[id].tsx          # Tester discovery details screen
│   │   ├── auth.tsx                    # Custom Luxury Sign In / Sign Up & OTP Modal
│   │   ├── cart.tsx                    # Shopping Bag with quantity steppers & checkout
│   │   ├── index.tsx                   # Luxury intro splash sequence
│   │   └── _layout.tsx                 # Root layout & providers
│   ├── 📁 src/
│   │   ├── 📁 api/                     # Axios API clients, Zod schemas & services
│   │   ├── 📁 components/              # UI components (ProductCard, GoogleIcon, Typography)
│   │   ├── 📁 services/                # Clerk auth & OAuth services
│   │   ├── 📁 store/                   # Zustand stores (useAuthStore, useCartStore, useWishlistStore)
│   │   ├── 📁 theme/                   # Luxury porcelain & dusty rose design tokens
│   │   └── 📁 utils/                   # Secure storage & token caching
│   ├── package.json
│   └── tsconfig.json
│
├── package.json                        # Root npm scripts
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: v18+ or v20+
* **MongoDB**: Running locally at `mongodb://localhost:27017` or a MongoDB Atlas URI

### 2. Installation
Install dependencies for root, backend, and mobile:
```bash
# Install backend dependencies
cd backend && npm install

# Install mobile dependencies
cd ../mobile && npm install
```

### 3. Environment Variables
Create `.env` files in `backend/` and `mobile/`:

**`backend/.env`**:
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/tryvia
JWT_SECRET=tryvia_secret_jwt_key_super_secure_2026
JWT_EXPIRES_IN=7d
```

**`mobile/.env`**:
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 4. Seed the Database
Populate MongoDB with luxury brands (*Chanel*, *Dior*, *Kiehl's*, *Le Labo*), categories, products, and default test accounts:
```bash
npm run seed
```

### 5. Start the Application
Open two terminal windows:

* **Start Backend (Express + MongoDB)**:
  ```bash
  npm run backend
  ```
  *Server starts at `http://localhost:8000` (`http://localhost:8000/api/v1`)*

* **Start Frontend (Web / Expo Go)**:
  ```bash
  npm run web       # For Web browser preview
  npm run start     # For Expo Go on Android / iOS
  ```

---

## 🔒 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new user account |
| `POST` | `/api/v1/auth/login` | Login with email/password (returns JWT) |
| `GET` | `/api/v1/auth/me` | Fetch authenticated member profile |
| `GET` | `/api/v1/products` | Retrieve all products (supports search & category filter) |
| `GET` | `/api/v1/products/testers` | Retrieve trending tester formulations |
| `GET` | `/api/v1/products/:id` | Get specific product details by ID |
| `POST` | `/api/v1/orders/` | Place order with 90% smart wallet credit lock |
| `GET` | `/api/v1/orders/` | List user order history |
| `GET` | `/api/v1/wallet/balance` | Get wallet balance and active upgrade credits |
| `GET` | `/api/v1/wallet/eligibility/:id` | Check upgrade discount eligibility for a product |
