import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAccount } from '../api';

const AdminRoute = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (!token || !userStr) {
                setIsAuthorized(false);
                setIsLoading(false);
                return;
            }

            try {
                // Double check role with server to prevent local storage tampering
                const user = JSON.parse(userStr);
                const { data } = await getAccount(user.accountNumber);

                if (data.role === 'ADMIN' || data.role === 'MANAGER') {
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error("Auth Check Failed", error);
                setIsAuthorized(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-blue-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mb-4"></div>
                <p className="text-sm font-mono uppercase tracking-widest text-slate-400">Verifying Credentials...</p>
            </div>
        );
    }

    return isAuthorized ? <Outlet /> : <Navigate to="/login" replace />;
};

export default AdminRoute;
