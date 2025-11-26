import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Client } from '../../types';
import { ListSkeleton } from '../ui/Skeleton';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

// Componente para item de cliente com long press para fixar
const ClientItem: React.FC<{
    client: Client;
    onSelect: (id: number) => void;
    onTogglePin: (id: number) => void;
}> = ({ client, onSelect, onTogglePin }) => {
    const [isPressing, setIsPressing] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const touchStartTime = useRef<number>(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartTime.current = Date.now();
        setIsPressing(true);

        longPressTimer.current = setTimeout(() => {
            // Vibração de feedback (se disponível)
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            onTogglePin(client.id!);
            setIsPressing(false);
        }, 500); // 500ms para ativar o long press
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }

        const pressDuration = Date.now() - touchStartTime.current;
        if (pressDuration < 500) {
            // Foi um toque rápido, seleciona o cliente
            onSelect(client.id!);
        }

        setIsPressing(false);
    };

    const handleTouchCancel = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
        setIsPressing(false);
    };

    const handleClick = () => {
        onSelect(client.id!);
    };

    return (
        <button
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            className={`w-full text-left p-4 bg-white dark:bg-slate-800 border rounded-lg shadow-sm transition-all duration-150 flex items-center justify-between ${isPressing
                    ? 'scale-95 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                } ${client.pinned ? 'border-l-4 border-l-blue-500' : ''}`}
        >
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    {client.pinned && (
                        <i className="fas fa-thumbtack text-blue-500 text-sm"></i>
                    )}
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{client.nome}</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{client.telefone || 'Sem telefone'}</p>
            </div>
            <i className="fas fa-chevron-right text-slate-400"></i>
        </button>
    );
};




interface ClientSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    clients: Client[];
    onClientSelect: (id: number | null) => void;
    isLoading: boolean;
    onAddNewClient: (clientName: string) => void;
    onTogglePin: (id: number) => void; // Nova prop para fixar/desfixar
}

const ClientSelectionModal: React.FC<ClientSelectionModalProps> = ({
    isOpen,
    onClose,
    clients,
    onClientSelect,
    isLoading,
    onAddNewClient,
    onTogglePin
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 200);
    const [visibleCount, setVisibleCount] = useState(10);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setVisibleCount(10);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        setVisibleCount(10);
    }, [debouncedSearchTerm]);

    const filteredClients = useMemo(() => {
        if (isLoading) return [];
        let result = clients;
        if (debouncedSearchTerm) {
            result = clients.filter(client =>
                client.nome.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            );
        }
        // Ordenar: fixados primeiro, depois por nome
        return result.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return a.nome.localeCompare(b.nome);
        });
    }, [clients, debouncedSearchTerm, isLoading]);

    const displayedClients = useMemo(() => {
        return filteredClients.slice(0, visibleCount);
    }, [filteredClients, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 10);
    };

    if (!isOpen) return null;

    const handleSelectClient = (id: number) => {
        onClientSelect(id);
        onClose();
    };

    const handleAddNew = () => {
        onAddNewClient(searchTerm);
    };

    const handleAddNewEmpty = () => {
        onAddNewClient('');
    }

    const handleClearSearch = () => {
        setSearchTerm('');
        inputRef.current?.focus();
    };

    return (
        <div className="fixed inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-50 flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0">
                <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Selecionar Cliente</h2>
                    <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div className="mt-4 max-w-3xl mx-auto relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-search text-slate-400 text-lg"></i>
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar pelo nome do cliente..."
                        className="w-full pl-12 pr-10 py-4 rounded-xl border-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-inner focus:ring-2 focus:ring-slate-500 transition-all text-base"
                        disabled={isLoading}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            aria-label="Limpar busca"
                        >
                            <i className="fas fa-times-circle text-lg"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-4">
                <div className="max-w-3xl mx-auto space-y-2">
                    {isLoading ? (
                        <ListSkeleton count={6} />
                    ) : (
                        <>

                            {displayedClients.map(client => (
                                <ClientItem
                                    key={client.id}
                                    client={client}
                                    onSelect={handleSelectClient}
                                    onTogglePin={onTogglePin}
                                />
                            ))}

                            {visibleCount < filteredClients.length && (
                                <div className="pt-4 flex justify-center">
                                    <button
                                        onClick={handleLoadMore}
                                        className="group flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-full shadow-md hover:shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
                                    >
                                        <span>Carregar mais</span>
                                        <i className="fas fa-chevron-down text-sm group-hover:translate-y-0.5 transition-transform"></i>
                                    </button>
                                </div>
                            )}
                            {filteredClients.length === 0 && debouncedSearchTerm && (
                                <div className="text-center py-10 px-4">
                                    <p className="text-slate-500 dark:text-slate-400 mb-4">Nenhum cliente encontrado com o nome <strong className="text-slate-700 dark:text-slate-300">"{debouncedSearchTerm}"</strong>.</p>
                                    <button
                                        onClick={handleAddNew}
                                        className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition duration-300 shadow-sm flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <i className="fas fa-plus"></i>
                                        Adicionar "{debouncedSearchTerm}"
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky bottom-0">
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={handleAddNewEmpty}
                        className="w-full p-3 bg-slate-800 dark:bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition duration-300 shadow-md flex items-center justify-center gap-2"
                        disabled={isLoading}
                    >
                        <i className="fas fa-plus"></i>
                        Adicionar Novo Cliente
                    </button>
                </div>
            </div>
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ClientSelectionModal;