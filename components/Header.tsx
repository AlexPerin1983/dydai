import React from 'react';
import { ActiveTab } from '../types';

interface HeaderProps {
    activeTab: ActiveTab;
    onTabChange: (tab: ActiveTab) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
    const tabs: { id: ActiveTab; icon: string; label: string }[] = [
        { id: 'client', icon: 'fas fa-calculator', label: 'Orçamento' },
        { id: 'films', icon: 'fas fa-layer-group', label: 'Películas' },
        { id: 'agenda', icon: 'far fa-calendar-alt', label: 'Agenda' },
        { id: 'history', icon: 'fas fa-history', label: 'Histórico' },
        { id: 'settings', icon: 'fas fa-cog', label: 'Empresa' },
    ];

    return (
        <div className="flex justify-center items-center">
            {/* Alterado para justify-between e w-full para espalhar os botões */}
            <div className="flex justify-between overflow-x-auto space-x-2 sm:space-x-4 w-full sm:w-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        // Removido px-3 para dar mais espaço, e adicionado flex-1 no mobile para forçar a distribuição
                        className={`flex items-center justify-center px-1 py-2 rounded-lg transition-colors duration-200 flex-shrink-0 sm:flex-shrink sm:px-3 ${
                            activeTab === tab.id
                                ? 'bg-slate-800 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <i className={`${tab.icon} text-lg sm:mr-2`}></i>
                        <span className="hidden sm:inline text-sm font-semibold">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Header;