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
            <div className="flex justify-between overflow-x-auto space-x-1 sm:space-x-4 w-full sm:w-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        // Reduzindo o padding vertical (py-1.5 em mobile, py-2 em desktop) e o espaçamento interno
                        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-colors duration-200 flex-shrink-0 flex-1 sm:flex-shrink-0 sm:px-4 sm:py-2 ${
                            activeTab === tab.id
                                ? 'bg-slate-800 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                        aria-label={tab.label}
                    >
                        {/* Reduzindo o tamanho do ícone em mobile e removendo o mt-1 */}
                        <i className={`${tab.icon} text-lg sm:text-xl`}></i>
                        <span className="text-[10px] sm:hidden mt-0.5 font-medium">{tab.label}</span>
                        <span className="hidden sm:inline text-sm font-semibold mt-0.5">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Header;