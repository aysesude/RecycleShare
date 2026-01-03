# 🌿 RecycleShare - Auth Module

A **Hybrid Authentication System** built with Node.js, PostgreSQL, and React featuring Google OAuth and Email OTP verification.

## 🌐 Live Demo

- **🌍 Frontend**: https://recycle-share.vercel.app
- **🔗 API**: https://recycleshare.onrender.com
- **📚 API Docs**: https://recycleshare.onrender.com/api/docs/
- **🗄️ Database**: Neon PostgreSQL (Frankfurt)

---

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

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### 1. Clone the Repository

```bash
git clone git@github.com:aysesude/RecycleShare.git
cd RecycleShare
git checkout railway-deploy
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=5001
NODE_ENV=development

# Cloud Database (Neon) - Get credentials from team lead
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require

# JWT
JWT_SECRET=recycleshare-super-secret-jwt-key-2024
JWT_EXPIRES_IN=7d

# Google OAuth - Get from team lead
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Email (Gmail SMTP) - Get from team lead
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=recycleshareco@gmail.com
SMTP_PASSWORD=get-from-team-lead

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **Note**: Ask team lead for `DATABASE_URL`, `GOOGLE_CLIENT_ID`, and `SMTP_PASSWORD`

Start backend:

```bash
npm run dev
```

Backend will run at: http://localhost:5001

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env` file:

```env
VITE_API_URL=http://localhost:5001/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Start frontend:

```bash
npm run dev
```

Frontend will run at: http://localhost:5173

---

## 🔌 API Endpoints

Base URL: `https://recycleshare.onrender.com/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/register` | Register with email/password |
| POST | `/auth/verify-otp` | Verify OTP code |
| POST | `/auth/resend-otp` | Resend OTP email |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/google` | Google OAuth login |
| POST | `/auth/google/complete` | Complete Google registration (add phone) |
| GET | `/auth/me` | Get current user (requires JWT) |

📚 Full API documentation: https://recycleshare.onrender.com/api/docs/

---

## 🗄️ Database Schema

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    auth_provider VARCHAR(20) DEFAULT 'local',
    google_id VARCHAR(255),
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📁 Project Structure

```
RecycleShare/
├── backend/
│   ├── config/
│   │   └── database.js         # PostgreSQL connection & schema
│   ├── controllers/
│   │   └── auth.controller.js  # Auth logic
│   ├── middleware/
│   │   └── auth.middleware.js  # JWT verification
│   ├── routes/
│   │   └── auth.routes.js      # API endpoints
│   ├── utils/
│   │   ├── email.utils.js      # OTP email templates
│   │   └── jwt.utils.js        # Token generation
│   ├── validators/
│   │   └── auth.validator.js   # Input validation
│   ├── swagger.json            # API documentation
│   ├── server.js               # Express app entry
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthLayout.jsx
│   │   │   └── FormElements.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── VerifyOTP.jsx
│   │   │   ├── GooglePhoneSetup.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon Cloud)
- **Auth**: JWT, bcrypt, Google OAuth
- **Email**: Nodemailer (Gmail SMTP)
- **Docs**: Swagger UI

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + DaisyUI
- **HTTP**: Axios
- **Routing**: React Router v6
- **Auth**: @react-oauth/google

### Cloud Services (Free Tier)
- **Database**: [Neon](https://neon.tech) - Serverless PostgreSQL
- **Backend**: [Render](https://render.com) - Node.js hosting
- **Frontend**: [Vercel](https://vercel.com) - React hosting (optional)

---

## 👥 Team Access

### Getting Access
1. Request GitHub collaborator access from team lead
2. Get environment variables (DATABASE_URL, API keys)
3. Clone and follow Quick Start guide above

### Services
- **GitHub**: github.com/aysesude/RecycleShare
- **Neon Dashboard**: console.neon.tech (request invite)
- **Render Dashboard**: dashboard.render.com (request team invite)

---

## 🔧 Common Issues

### Port 5000 conflict (macOS)
macOS uses port 5000 for Control Center. Use port 5001 instead:
```env
PORT=5001
```

### Google OAuth "Wrong number of segments"
Make sure frontend sends `id_token` (not `access_token`) from Google login.

### Database connection error
Check `DATABASE_URL` is correct and Neon project is awake (serverless may sleep).

### CORS errors
Backend allows localhost:5173, localhost:3000, and all *.onrender.com, *.vercel.app domains.

---

## 📝 License

MIT

---

## 🤝 Contributing

1. Create a feature branch from `railway-deploy`
2. Make your changes
3. Test locally
4. Push and create PR

```bash
git checkout railway-deploy
git pull origin railway-deploy
git checkout -b feature/your-feature
# ... make changes ...
git push origin feature/your-feature
```

---

Made with 💚 by RecycleShare Team
