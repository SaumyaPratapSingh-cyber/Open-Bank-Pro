import axios from 'axios';

// const API = axios.create({ baseURL: 'http://localhost:5000/api' });
const API = axios.create({
    baseURL: 'https://open-bank-pro.onrender.com/api',
    timeout: 20000 // 20 seconds timeout
});

// Add a request interceptor to attach the Token to every request (if we have one)
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = token;
    }
    return req;
});

// --- AUTHENTICATION ---
export const registerUser = (data) => API.post('/register', data);
export const loginUser = (data) => API.post('/login', data);

// --- BANKING ---
export const getAccount = (id) => API.get(`/accounts/${id}`);
export const updateProfile = (id, data) => API.put(`/accounts/${id}`, data);
export const transferMoney = (data) => API.post('/transfers', data);
export const lookupAccount = (accountNumber) => API.get(`/accounts/lookup/${accountNumber}`);
export const depositMoney = (data) => API.post('/deposit', data);
export const withdrawMoney = (data) => API.post('/withdraw', data);
export const getTransactions = (id) => API.get(`/accounts/${id}/transactions`);
export const getNotifications = (id) => API.get(`/accounts/${id}/notifications`);
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);

// Upgrade: UPI, Invest, Loans
export const verifyVpa = (vpa) => API.post('/upi/verify', { vpa });
export const payUpi = (data) => API.post('/upi/pay', data);

export const createInvestment = (data) => API.post('/investments', data);
export const getInvestments = (id) => API.get(`/accounts/${id}/investments`);
export const deleteInvestment = (id, data) => API.delete(`/investments/${id}`, { data });

export const applyLoan = (data) => API.post('/loans/apply', data);
export const repayLoan = (data) => API.post('/loans/repay', data);
export const getLoans = (id) => API.get(`/accounts/${id}/loans`);

// --- ADMIN PORTAL ---
export const getKycQueue = () => API.get('/admin/kyc-queue');
export const updateKycStatus = (data) => API.post('/admin/kyc-action', data);
export const getAuditTransactions = () => API.get('/admin/audit-transactions');
export const freezeAccount = (data) => API.post('/admin/freeze-account', data);
export const changeUserRole = (data) => API.post('/admin/change-role', data);
export const getAllCustomers = () => API.get('/admin/customers');
export const sendAdminNotification = (data) => API.post('/admin/notify', data);
export const resendWelcomeEmail = (accountNumber) => API.post('/admin/resend-welcome', { accountNumber });
export const getAdminStats = () => API.get('/admin/stats');

export const convertCurrency = (data) => API.post('/forex/convert', data);

// Module 2: Beneficiaries
export const addBeneficiary = (data) => API.post('/beneficiaries/add', data);
export const getBeneficiaries = () => API.get('/beneficiaries');
export const deleteBeneficiary = (id) => API.delete(`/beneficiaries/${id}`);

// Module 3: Auto-Pay
export const createAutoPay = (data) => API.post('/autopay/create', data);
export const getAutoPayList = () => API.get('/autopay/list');
export const deleteAutoPay = (id) => API.delete(`/autopay/${id}`);

// Module 4: Cards
export const getCards = (accountNumber) => API.get(`/accounts/${accountNumber}/cards`);
export const requestCard = (data) => API.post('/cards/request', data);
// Admin Card Functions
export const getCardRequests = () => API.get('/admin/cards/pending');
export const approveCard = (data) => API.post('/admin/cards/approve', data);
export const transferViaCard = (data) => API.post('/transfers/card', data);
// Legacy/Unused (or keep if specific logic needs it, but I'll comment out to avoid confusion)
// export const toggleCardFreeze = () => API.post('/cards/toggle-freeze');
// export const regenerateCVV = () => API.post('/cards/regenerate-cvv');

// Module 5: Tickets
export const raiseTicket = (data) => API.post('/tickets/raise', data);
export const getTickets = () => API.get('/tickets/list');
export const getAllTicketsAdmin = () => API.get('/admin/tickets');
export const resolveTicket = (id, data) => API.post(`/tickets/resolve/${id}`, data);

export default API;