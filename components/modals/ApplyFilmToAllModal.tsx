import React, { useState } from 'react';
import { Film } from '../../types';
import Modal from '../ui/Modal';

interface ApplyFilmToAllModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (film: Film) => void;
    films: Film[];
}

export const ApplyFilmToAllModal: React.FC<ApplyFilmToAllModalProps> = ({
    isOpen,
    onClose,
    onApply,
    films
}) => {
    const [selectedFilmId, setSelectedFilmId] = useState<number | null>(null);

    const handleApply = () => {
        const film = films.find(f => f.id === selectedFilmId);
        if (film) {
            onApply(film);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Aplicar Película a Todos">
            <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-300">
                    Selecione a película que deseja aplicar a todas as medidas deste cliente.
                    Isso substituirá as películas existentes.
                </p>

                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {films.map(film => (
                        <button
                            key={film.id}
                            onClick={() => setSelectedFilmId(film.id)}
                            className={`p-3 rounded-lg border text-left transition-colors ${selectedFilmId === film.id
                                ? 'bg-slate-100 dark:bg-slate-700 border-slate-500'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className="font-medium text-slate-900 dark:text-white">{film.name}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                {film.brand} - R$ {film.pricePerM2.toFixed(2)}/m²
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!selectedFilmId}
                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Aplicar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ApplyFilmToAllModal;
