import React from 'react';
import Modal from '../ui/Modal';

interface AIConfigErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoToSettings: () => void;
    provider: 'gemini' | 'openai';
}

const AIConfigErrorModal: React.FC<AIConfigErrorModalProps> = ({ isOpen, onClose, onGoToSettings, provider }) => {
    
    const providerName = provider === 'gemini' ? 'Google Gemini' : 'OpenAI';
    
    const footer = (
        <>
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-slate-100 transition-colors"
            >
                Fechar
            </button>
            <button
                onClick={onGoToSettings}
                className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-md hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
                <i className="fas fa-cog"></i>
                Ir para Configurações
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Configuração de IA Necessária"
            footer={footer}
        >
            <div className="text-slate-700 space-y-4">
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <i className="fas fa-exclamation-triangle text-red-500 mt-1 flex-shrink-0"></i>
                    <p className="text-sm text-red-800">
                        A funcionalidade de Inteligência Artificial requer uma chave de API válida.
                    </p>
                </div>
                <p>
                    Por favor, acesse a aba <strong>Empresa</strong> e configure sua chave de API para o provedor <strong>{providerName}</strong>.
                </p>
                <p className="text-sm text-slate-500">
                    Isso permitirá que a IA processe textos, imagens ou áudios para preencher automaticamente as medidas ou dados do cliente.
                </p>
            </div>
        </Modal>
    );
};

export default AIConfigErrorModal;