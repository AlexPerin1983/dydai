import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const AdminUsers: React.FC = () => {
    const { isAdmin } = useAuth();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAdmin) {
            fetchProfiles();
        }
    }, [isAdmin]);

    const fetchProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error('Error fetching profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleApproval = async (profile: Profile) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ approved: !profile.approved })
                .eq('id', profile.id);

            if (error) throw error;

            // Update local state
            setProfiles(profiles.map(p =>
                p.id === profile.id ? { ...p, approved: !p.approved } : p
            ));
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Erro ao atualizar usuário');
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mt-8">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Gerenciar Usuários
                </h3>
                <button
                    onClick={fetchProfiles}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                    Atualizar Lista
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Data Cadastro</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                    Carregando usuários...
                                </td>
                            </tr>
                        ) : profiles.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                    Nenhum usuário encontrado.
                                </td>
                            </tr>
                        ) : (
                            profiles.map(profile => (
                                <tr key={profile.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        {profile.email}
                                        {profile.role === 'admin' && (
                                            <span className="ml-2 px-2 py-0.5 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full font-bold uppercase">
                                                Admin
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                        {new Date(profile.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {profile.approved ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                Aprovado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                                Pendente
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {profile.role !== 'admin' && (
                                            <button
                                                onClick={() => toggleApproval(profile)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${profile.approved
                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                                                    }`}
                                            >
                                                {profile.approved ? 'Bloquear' : 'Aprovar'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
