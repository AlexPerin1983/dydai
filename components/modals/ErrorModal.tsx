import React, { ReactNode } from 'react';
import Modal from '../ui/Modal';

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: ReactNode;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
}) => {
    
    const footer = (
        <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
            Entendi
        </button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={footer}
        >
            <div className="text-slate-600 space-y-3">
                <div className="flex items-center gap-3 text-red-600">
                    <i className="fas fa-exclamation-triangle text-xl"></i>
                    <p className="font-semibold">{message}</p>
                </div>
            </div>
        </Modal>
    );
};

export default ErrorModal;