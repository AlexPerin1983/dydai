import React from 'react';
import { Client } from '../types';
import Tooltip from './ui/Tooltip';

interface ClientBarProps {
    selectedClient: Client | null;
    onSelectClientClick: () => void;
    onAddClient: () => void;
    onEditClient: () => void;
    onDeleteClient: () => void;
}

const formatAddress = (client: Client): string => {
    const parts = [
        client.logradouro,
        client.numero,
        client.bairro,
        client.cidade,
        client.uf,
    ];
    return parts.filter(Boolean).join(', ');
}

const ClientBar: React.FC<ClientBarProps> = ({
    selectedClient,
    onSelectClientClick,
    onAddClient,
    onEditClient,
    onDeleteClient,
}) => {
    
    const ActionButton: React.FC<{
        onClick: () => void;
        icon: string;
        tooltip: string;
        className?: string;
        disabled?: boolean;
    }> = ({ onClick, icon, tooltip, className = '', disabled = false }) => (
        <Tooltip text={tooltip}>
            <button
                onClick={onClick}
                disabled={disabled}
                className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition duration-200 ${
                    disabled
                        ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                        : `text-slate-600 bg-white hover:bg-slate-200 hover:text-slate-800 border border-slate-200 ${className}`
                }`}
                aria-label={tooltip}
            >
                <i className={icon}></i>
            </button>
        </Tooltip>
    );

    const fullAddress = selectedClient ? formatAddress(selectedClient) : '';

    return (
        <div className="mb-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            {/* Header Section */}
            <div className="flex items-start justify-between p-4 border-b border-slate-100">
                <div 
                    onClick={onSelectClientClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectClientClick() }}
                    className="text-left flex-grow pr-4 min-w-0 cursor-pointer focus:outline-none group"
                    aria-label="Trocar de cliente"
                >
                    {selectedClient ? (
                        <>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Cliente</span>
                                {selectedClient.telefone && (
                                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                        {selectedClient.telefone}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 leading-tight truncate group-hover:text-slate-900 transition-colors">
                                {selectedClient.nome}
                            </h2>
                        </>
                    ) : (
                        <>
                            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Cliente</span>
                            <h2 className="text-xl font-bold text-slate-800 leading-tight truncate mt-1">
                                Nenhum cliente selecionado
                            </h2>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <ActionButton
                        onClick={onAddClient}
                        icon="fas fa-plus"
                        tooltip="Adicionar Novo Cliente"
                    />
                    <ActionButton
                        onClick={onEditClient}
                        icon="fas fa-pen"
                        tooltip="Editar Cliente Atual"
                        disabled={!selectedClient}
                    />
                    <ActionButton
                        onClick={onDeleteClient}
                        icon="fas fa-trash-alt"
                        tooltip="Excluir Cliente Atual"
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        disabled={!selectedClient}
                    />
                </div>
            </div>

            {/* Address Section */}
            {fullAddress && (
                <div className="px-4 py-3 bg-slate-50/50">
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="group flex items-start gap-2.5 text-sm text-slate-600 hover:text-blue-600 transition-colors"
                        aria-label={`Abrir endereço no mapa: ${fullAddress}`}
                    >
                        <i className="fas fa-map-marker-alt text-slate-400 group-hover:text-blue-500 flex-shrink-0 mt-0.5"></i>
                        <span className="group-hover:underline leading-relaxed">{fullAddress}</span>
                    </a>
                </div>
            )}
        </div>
    );
};

export default React.memo(ClientBar);