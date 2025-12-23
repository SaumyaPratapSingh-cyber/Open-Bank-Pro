import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import Loan from './pages/Loan';
import Profile from './pages/Profile';
import AutoPay from './pages/AutoPay';
import Support from './pages/Support';

import UPI from './pages/UPI';
import Investments from './pages/Investments';
import Loans from './pages/Loans';
import Statement from './pages/Statement';
import Layout from './components/Layout'; // New Glass Layout
import AdminLayout from './layouts/AdminLayout';
import AdminRoute from './components/AdminRoute';
import KYCConsole from './pages/Admin/KYCConsole';
import CustomerDirectory from './pages/Admin/CustomerDirectory';
import Customer360 from './pages/Admin/Customer360';
import TransactionMonitor from './pages/Admin/TransactionMonitor';
import Headquarters from './pages/Admin/Headquarters';
import CardRequests from './pages/Admin/CardRequests';
import SupportTickets from './pages/Admin/SupportTickets';
import Cards from './pages/Cards';
import IntroSequence from './components/IntroSequence';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer Portal Wrapped in Glass Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/loan" element={<Loan />} />
          <Route path="/upi" element={<UPI />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/statement" element={<Statement />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/autopay" element={<AutoPay />} />
          <Route path="/support" element={<Support />} />
        </Route>

        {/* Admin Portal Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="headquarters" element={<Headquarters />} />
            <Route path="kyc-queue" element={<KYCConsole />} />
            <Route path="card-requests" element={<CardRequests />} />
            <Route path="tickets" element={<SupportTickets />} />
            <Route path="directory" element={<CustomerDirectory />} />
            <Route path="customer-360" element={<Customer360 />} />
            <Route path="monitor" element={<TransactionMonitor />} />
            <Route path="" element={<Navigate to="headquarters" />} />
          </Route>
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [introPlayed, setIntroPlayed] = useState(false);

  // Play intro only once per session or reload. 
  // User asked for "when someone opens the website", so playing it on every refresh is fine for this demo effect.
  useEffect(() => {
    // Check if we want to persist state, but for "wow" effect on reload, let's keep it fresh.
    setIntroPlayed(false);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0f1d] font-sans text-gray-100">
        {!introPlayed ? (
          <IntroSequence onComplete={() => setIntroPlayed(true)} />
        ) : (
          <AnimatedRoutes />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;