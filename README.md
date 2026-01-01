# 🌿 RecycleShare - Auth Module

A **Hybrid Authentication System** built with Node.js, PostgreSQL, and React featuring Google OAuth and Email OTP verification.

## 🎯 Features

### Authentication Flows
- **Standard Registration**: Email + Password with OTP Email Verification
- **Google OAuth**: Sign in with Google (requires phone number for new users)
- **Secure Login**: JWT-based session management

### Security Features
- 🔐 Password hashing with bcrypt (12 salt rounds)
- 📧 6-digit OTP email verification (10-minute expiry)
- 🎫 JWT tokens with configurable expiration
- ✅ Input validation with express-validator
- 🛡️ Protected routes with middleware

### Design
- 🌿 **Eco-Minimalist** UI/UX
- 📱 Fully responsive (Mobile-first)
- 🎨 Custom DaisyUI theme with emerald/green accents

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Setup

```bash
cd RecycleShare
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recycleshare
DB_USER=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### Create PostgreSQL Database

```sql
CREATE DATABASE recycleshare;
```

The tables will be created automatically on first run.

#### Start Backend

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

#### Start Frontend

```bash
npm run dev
```

---

## 📁 Project Structure

```
RecycleShare/
├── backend/
│   ├── config/
│   │   └── database.js       # PostgreSQL connection & schema
│   ├── controllers/
│   │   └── auth.controller.js # Auth logic
│   ├── middleware/
│   │   ├── auth.middleware.js # JWT verification
│   │   └── validate.middleware.js
│   ├── routes/
│   │   └── auth.routes.js    # API endpoints
│   ├── utils/
│   │   ├── email.utils.js    # OTP email templates
│   │   └── jwt.utils.js      # Token generation
│   ├── validators/
│   │   └── auth.validator.js # Input validation rules
│   ├── server.js             # Express app entry
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── leaf.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthLayout.jsx    # Auth page wrapper
│   │   │   └── FormElements.jsx  # Reusable inputs
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth state management
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── VerifyOTP.jsx
│   │   │   ├── GooglePhoneSetup.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   └── api.js           # Axios instance
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css            # Tailwind + custom styles
│   ├── index.html
│   ├── tailwind.config.js       # Custom eco theme
│   └── package.json
│
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create account (sends OTP) | ❌ |
| POST | `/api/auth/login` | Standard login | ❌ |
| POST | `/api/auth/verify-otp` | Verify email with OTP | ❌ |
| POST | `/api/auth/resend-otp` | Request new OTP | ❌ |
| POST | `/api/auth/google` | Google OAuth (initial) | ❌ |
| POST | `/api/auth/google/complete` | Complete Google registration with phone | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

---

## 📧 Email Setup (Gmail)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Go to **App passwords**
4. Generate a new app password for "Mail"
5. Use this 16-character password in `SMTP_PASSWORD`

---

## 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Create **OAuth 2.0 Client ID**
5. Add authorized origins:
   - `http://localhost:5173`
   - `http://localhost:5000`
6. Copy the **Client ID** to both `.env` files

---

## 🎨 Design System

### Color Palette (Eco-Minimalist)

| Name | Hex | Usage |
|------|-----|-------|
| Emerald 600 | `#059669` | Primary buttons, CTAs |
| Emerald 500 | `#10b981` | Secondary, gradients |
| Emerald 100 | `#d1fae5` | Backgrounds, badges |
| Eco 50 | `#f0fdf4` | Page backgrounds |
| Gray 800 | `#1f2937` | Text |

### Components

- **eco-card**: White cards with subtle green shadow
- **eco-btn**: Gradient green buttons
- **eco-input**: Bordered inputs with emerald focus ring
- **OTP Input**: 6-box digit input with animations

---

## 🔒 Security Notes

1. **Never commit `.env` files** - they contain secrets
2. Change `JWT_SECRET` in production (min 32 characters)
3. Use HTTPS in production
4. Set proper CORS origins
5. Rate limit auth endpoints (recommended: express-rate-limit)

---

## 📝 Database Schema

```sql
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255),          -- NULL for Google users
  google_id VARCHAR(255) UNIQUE,  -- NULL for standard users
  profile_picture VARCHAR(500),
  phone VARCHAR(20) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'resident',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_code VARCHAR(6),
  verification_code_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

---

## 🧪 Testing

### Test Standard Registration
1. Go to `/register`
2. Fill form with valid data
3. Check email for 6-digit OTP
4. Enter OTP on verification page
5. Should redirect to dashboard

### Test Google Auth
1. Go to `/login`
2. Click "Continue with Google"
3. If new user, enter phone number
4. Should redirect to dashboard

---

## 📜 License

MIT License - Build something green! 🌍

---

Made with 💚 for a sustainable future
