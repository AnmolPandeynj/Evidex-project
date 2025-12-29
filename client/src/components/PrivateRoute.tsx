import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    <div className="text-cyan-400 font-mono text-sm animate-pulse">VERIFYING CREDENTIALS...</div>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (!currentUser.emailVerified) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-yellow-500/30 rounded-xl p-6 text-center">
                    <h2 className="text-xl font-bold text-yellow-400 mb-2">Email Verification Required</h2>
                    <p className="text-slate-300 mb-4">
                        Please check your email inbox to verify your account.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition"
                    >
                        I've Verified My Email
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
