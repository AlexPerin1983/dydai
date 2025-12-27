import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Login';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, loading, isApproved, signOut } = useAuth();

    if (loading) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!session) {
        return <Login />;
    }

    if (!isApproved) {
        return (
            <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700 text-center">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3">
                        Acesso Pendente
                    </h2>

                    <p className="text-slate-400 mb-6">
                        Seu acesso ainda não foi liberado. Entre em contato com o administrador para mais informações.
                    </p>

                    <button
                        onClick={signOut}
                        className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                    >
                        Usar outra conta
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
