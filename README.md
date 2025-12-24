# 🏦 OpenBank Pro - Advanced Banking Simulation Platform

![Status](https://img.shields.io/badge/Status-Active-success)
![Stack](https://img.shields.io/badge/Stack-MERN-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**OpenBank Pro** is a cutting-edge, full-stack banking simulation built with the MERN stack (MongoDB, Express, React, Node.js). It strictly mimics a real-world digital banking environment, offering role-based access for Customers and Administrators, secure transaction processing, and a hyper-modern "Cosmic Glassmorphism" UI.

---

## ✨ Key Features

### 👤 Customer Portal
- **Dashboard**: Real-time overview of balance, recent transactions, and active assets.
- **Fund Transfers**: 
  - **Internal/External**: Secure forms with beneficiary validation.
  - **UPI Module**: Complete Unified Payments Interface simulation with **VPA management**, **PIN verification**, and **QR Code scanning/generation**.
- **Investments**:
  - **Fixed Deposits (FD)** & **Recurring Deposits (RD)** with maturity calculators.
  - Interactive portfolio visualization using Recharts.
- **Loans**: Loan application simulation and active loan tracking.
- **Bank Statements**: Auto-generated PDF statements with transaction history.
- **Profile & Settings**: Manage KYC details, passwords, and visualize issued Debit/Credit cards.

### 🛡️ Admin Portal
- **KYC Console**: Verify or reject customer identity documents.
- **Transaction Monitor**: Real-time AML (Anti-Money Laundering) monitoring of high-value transactions.
- **User Management**: Freeze accounts, update roles, and view customer 360-degree profiles.
- **Support Tickets**: Resolve customer issues with an integrated ticketing system.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) (via [Vite](https://vitejs.dev/))
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth transitions.
- **Data Visualization**: [Recharts](https://recharts.org/) for financial graphs.
- **Utilities**: `axios`, `lucide-react`, `jspdf`, `react-hot-toast`.

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/) (Mongoose ODM)
- **Security**: 
  - `bcryptjs` for password hashing.
  - `jsonwebtoken` (JWT) for secure authentication.
- **Features**: `node-cron` for scheduled tasks (Auto-Pay), `jspdf` for trusted documents.

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Connection String (Atlas or Local)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/openbank-sandbox.git
cd openbank-sandbox
```

### 2. Backend Setup
Install root dependencies and configure environment:
```bash
npm install
```
Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
# Optional: Email Service Credentials (if enabled)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 3. Frontend Setup
Navigate to the client folder and install dependencies:
```bash
cd client
npm install
```

### 4. Running the Application
**Development Mode (Concurrent)**:
Ensure you successfully built the client or run them in separate terminals.

**Terminal 1 (Backend)**:
```bash
npm run server  # Uses nodemon
```

**Terminal 2 (Frontend)**:
```bash
cd client
npm run dev
```

The Application will be live at `http://localhost:5173` (Frontend) and `http://localhost:5000` (Backend).

---

## 📸 Project Structure

```
e:\OpenBank-Sandbox\
├── client\                 # React Frontend
│   ├── src\
│   │   ├── api.js          # Centralized API definitions
│   │   ├── components\     # Reusable UI components (PinInput, Layout, etc.)
│   │   ├── pages\          # Route Pages (Dashboard, UPI, Transfer, etc.)
│   │   └── Main.jsx        # Entry Point
│   └── vite.config.js
├── models\                 # Mongoose Schemas (Account, Transaction, Ticket, etc.)
├── .env                    # Environment Variables (Ignored in Git)
├── server.js               # Main Backend Entry Point
└── package.json            # Root Dependencies
```

---

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

---

**© 2025 OpenBank Pro Corp.** | *Simulated Banking Environment*
