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
                        : `text-slate-600 bg-white hover:bg-slate-200 hover:text-slate-800 ${className}`
                }`}
                aria-label={tooltip}
            >
                <i className={`${icon} text-sm`}></i>
            </button>
        </Tooltip>
    );

    const fullAddress = selectedClient ? formatAddress(selectedClient) : '';

    return (
        <div className="mb-4">
            {/* Header com título e ações */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <i className="fas fa-user-circle text-slate-400 text-lg"></i>
                    <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Cliente Selecionado</span>
                </div>
                <div className="flex items-center gap-1.5">
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
                        className="hover:bg-red-100 hover:text-red-600"
                        disabled={!selectedClient}
                    />
                </div>
            </div>

            {/* Card do cliente */}
            <div 
                onClick={onSelectClientClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectClientClick() }}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-sm"
                aria-label="Trocar de cliente"
            >
                {selectedClient ? (
                    <div className="space-y-2">
                        {/* Nome do cliente */}
                        <h2 className="text-xl font-bold text-slate-800 leading-tight">
                            {selectedClient.nome}
                        </h2>
                        
                        {/* Informações de contato */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            {selectedClient.telefone && (
                                <div className="flex items-center gap-1.5 text-slate-600">
                                    <i className="fas fa-phone text-slate-400 text-xs"></i>
                                    <span>{selectedClient.telefone}</span>
                                </div>
                            )}
                            {selectedClient.email && (
                                <div className="flex items-center gap-1.5 text-slate-600">
                                    <i className="fas fa-envelope text-slate-400 text-xs"></i>
                                    <span className="truncate max-w-[200px]">{selectedClient.email}</span>
                                </div>
                            )}
                        </div>

                        {/* Endereço com link para mapa */}
                        {fullAddress && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="group flex items-start gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors pt-1"
                                aria-label={`Abrir endereço no mapa: ${fullAddress}`}
                            >
                                <i className="fas fa-map-marker-alt text-slate-400 group-hover:text-blue-500 flex-shrink-0 mt-0.5"></i>
                                <span className="group-hover:underline leading-relaxed">{fullAddress}</span>
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <i className="fas fa-user-plus text-slate-400 text-xl"></i>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-700">
                            Nenhum cliente selecionado
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Clique aqui para selecionar um cliente
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ClientBar);