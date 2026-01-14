import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Package, Crown, Check, Clock, Zap } from 'lucide-react';

export const UserAccount: React.FC = () => {
    const { user, signOut } = useAuth();
    const { info, modules, isLoading: subscriptionLoading, hasModule, refresh } = useSubscription();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);


    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro ao atualizar senha' });
        } finally {
            setLoading(false);
        }
    };

    // Calcular valor total se comprar individual vs pacote
    const activeModulesCount = info?.active_modules?.length || 0;
    const hasFullPackage = hasModule('ilimitado');

    // Obter detalhes dos módulos ativos
    const getModuleExpiry = (moduleId: string) => {
        const detail = info?.modules_detail?.find((m: any) => m.module_id === moduleId);
        if (detail?.expires_at) {
            const expiry = new Date(detail.expires_at);
            const now = new Date();
            const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return { expiry, daysLeft };
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Seção Meu Plano */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                Meu Plano
                            </h3>
                            <p className="text-sm text-blue-100">
                                Gerencie seus módulos e assinatura
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {subscriptionLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                        </div>
                    ) : (
                        <>
                            {/* Status do Plano */}
                            <div className="mb-6">
                                {hasFullPackage ? (
                                    <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center">
                                                <Crown className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-amber-400 text-lg">Pacote Completo</h4>
                                                <p className="text-amber-200/70 text-sm">
                                                    Todos os módulos liberados!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeModulesCount > 0 ? (
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-green-400">
                                            <Check className="w-5 h-5" />
                                            <span className="font-medium">
                                                {activeModulesCount} módulo(s) ativo(s)
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                                        <p className="text-slate-500 dark:text-slate-400 text-center">
                                            Você está no plano gratuito com recursos limitados.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Oferta Especial - Pacote Completo */}
                            {!hasFullPackage && (
                                <div className="mb-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-5 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full" />

                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                                                ⚡ OFERTA ESPECIAL
                                            </span>
                                            <span className="text-indigo-200 text-sm line-through">R$ 199,50</span>
                                        </div>

                                        <h4 className="text-xl font-bold mb-1">Pacote Completo</h4>
                                        <p className="text-indigo-200 text-sm mb-4">
                                            Libera TODOS os módulos por 6 meses
                                        </p>

                                        <div className="flex items-baseline gap-2 mb-4">
                                            <span className="text-4xl font-bold">R$ 99</span>
                                            <span className="text-indigo-200">/6 meses</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-6 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-400" /> Estoque
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-400" /> QR Serviços
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-400" /> Corte Inteligente
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-400" /> Colaboradores
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-400" /> Locais PRO
                                            </div>
                                        </div>

                                        <a
                                            href={`https://wa.me/5583996476052?text=${encodeURIComponent('Olá, quero ativar o Pacote Completo')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Zap className="w-5 h-5" />
                                            Quero o Pacote Completo
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Lista de Módulos */}
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                                    Módulos Individuais
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(modules.length > 0 ? modules.filter(m => m.id !== 'ilimitado') : [
                                        { id: 'estoque', name: 'Estoque', description: 'Controle de bobinas e retalhos' },
                                        { id: 'qr_servicos', name: 'QR Serviços', description: 'Selo de garantia via QR Code' },
                                        { id: 'colaboradores', name: 'Colaboradores', description: 'Gestão de equipe e acessos' },
                                        { id: 'locais_global', name: 'Locais PRO', description: 'Base de medidas inteligente' },
                                        { id: 'corte_inteligente', name: 'Corte Inteligente', description: 'Otimizador de corte de película' }
                                    ]).map(module => {
                                        const isActive = hasModule(module.id) || hasFullPackage;
                                        const expiryInfo = getModuleExpiry(module.id);

                                        return (
                                            <div
                                                key={module.id}
                                                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${isActive
                                                    ? 'bg-green-500/5 border-green-500/30'
                                                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3 mb-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                                        }`}>
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-slate-900 dark:text-white">
                                                            {module.name}
                                                        </h5>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                            {module.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                                    {isActive ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                                                                <Check className="w-3 h-3" /> ATIVO
                                                            </span>
                                                            {expiryInfo && (
                                                                <span className="text-[10px] text-slate-500">
                                                                    {expiryInfo.daysLeft} dias
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-slate-900 dark:text-white">R$ 39,90</span>
                                                                <span className="text-[10px] text-slate-500">6 meses</span>
                                                            </div>
                                                            <a
                                                                href={`https://wa.me/5583996476052?text=${encodeURIComponent(`Olá, quero ativar o módulo ${module.name}`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                                                            >
                                                                Ativar
                                                            </a>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Seção Minha Conta (existente) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        Minha Conta
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Gerencie suas credenciais e acesso
                    </p>
                </div>

                <div className="p-6 space-y-8">
                    <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Informações Pessoais</h4>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                            <p className="font-medium text-slate-900 dark:text-white">{user?.email}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Alterar Senha</h4>
                        {message && (
                            <div className={`p-4 rounded-lg mb-4 text-sm font-medium ${message.type === 'error' ? 'bg-red-900/50 text-red-200 border border-red-800' : 'bg-green-900/50 text-green-200 border border-green-800'
                                }`}>
                                {message.text}
                            </div>
                        )}
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nova Senha</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar Nova Senha</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !newPassword}
                                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Atualizando...' : 'Atualizar Senha'}
                            </button>
                        </form>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={signOut}
                            className="w-full sm:w-auto px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-sign-out-alt"></i>
                            Sair da Conta
                        </button>
                    </div>
                </div>
            </div>


        </div>
    );
};
