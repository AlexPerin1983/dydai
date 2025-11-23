import React, { useState } from 'react';
import { TotalsDrawer } from './ui/TotalsDrawer';

interface Totals {
    totalM2: number;
    subtotal: number;
    totalItemDiscount: number;
    generalDiscountAmount: number;
    finalTotal: number;
}

interface MobileFooterProps {
    totals: Totals;
    generalDiscount: { value: string; type: 'percentage' | 'fixed' };
    onOpenGeneralDiscountModal: () => void;
    onUpdateGeneralDiscount: (value: { value: string; type: 'percentage' | 'fixed' }) => void;
    onAddMeasurement: () => void;
    onDuplicateMeasurements: () => void;
    onGeneratePdf: () => void;
    isGeneratingPdf: boolean;
    onOpenAIModal: () => void;
}

const MobileFooter: React.FC<MobileFooterProps> = ({
    totals,
    generalDiscount,
    onOpenGeneralDiscountModal,
    onUpdateGeneralDiscount,
    onAddMeasurement,
    onDuplicateMeasurements,
    onGeneratePdf,
    isGeneratingPdf,
    onOpenAIModal
}) => {
    const [isTotalsDrawerOpen, setIsTotalsDrawerOpen] = useState(false);

    const ActionButton: React.FC<{ onClick: () => void, label: string, icon: string, isActive?: boolean }> = ({ onClick, label, icon, isActive = false }) => (
        <button onClick={onClick} aria-label={label} className={`flex flex-col items-center justify-center transition-colors w-16 h-full ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            <i className={`${icon} text-xl h-6`}></i>
            <span className="text-[10px] mt-1 font-medium">{label}</span>
        </button>
    );

    const PdfActionButton = () => {
        if (isGeneratingPdf) {
            return (
                <div className="flex flex-col items-center justify-center w-16 h-full text-slate-500 dark:text-slate-400">
                    <div className="loader-sm"></div>
                    <span className="text-[10px] mt-1 font-medium">Gerando...</span>
                    <style jsx>{`
                        .loader-sm {
                            border: 3px solid #f3f3f3;
                            border-top: 3px solid #3498db;
                            border-radius: 50%;
                            width: 20px;
                            height: 20px;
                            animation: spin 1s linear infinite;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                     `}</style>
                </div>
            );
        }
        return <ActionButton onClick={onGeneratePdf} label="Gerar PDF" icon="fas fa-file-pdf" />;
    };

    const handleUpdateDiscount = (value: string, type: 'percentage' | 'fixed') => {
        onUpdateGeneralDiscount({ value, type });
    };

    return (
        <>
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-[0_-8px_20px_rgba(0,0,0,0.1)] border-t border-slate-200 dark:border-slate-700 z-30">
                <div className="container mx-auto px-2">
                    {/* Main Action Bar */}
                    <div className="relative">
                        <div className="flex justify-around items-center h-16">
                            <ActionButton onClick={onOpenAIModal} label="com IA" icon="fas fa-robot" />
                            <ActionButton onClick={onDuplicateMeasurements} label="Duplicar" icon="fas fa-copy" />

                            {/* Floating Action Button */}
                            <div className="-translate-y-5">
                                <button
                                    onClick={onAddMeasurement}
                                    aria-label="Adicionar Nova Medida"
                                    className="w-14 h-14 bg-slate-900 dark:bg-slate-700 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                >
                                    <i className="fas fa-plus text-xl"></i>
                                </button>
                            </div>

                            <ActionButton
                                onClick={() => setIsTotalsDrawerOpen(true)}
                                label="Totais"
                                icon="fas fa-dollar-sign"
                                isActive={isTotalsDrawerOpen}
                            />
                            <PdfActionButton />
                        </div>
                    </div>
                </div>
            </div>

            <TotalsDrawer
                isOpen={isTotalsDrawerOpen}
                onClose={() => setIsTotalsDrawerOpen(false)}
                totals={totals}
                generalDiscount={generalDiscount}
                onUpdateGeneralDiscount={handleUpdateDiscount}
            />
        </>
    );
};

export default React.memo(MobileFooter);