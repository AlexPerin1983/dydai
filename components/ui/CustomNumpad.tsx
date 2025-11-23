import React, { forwardRef, useRef, useState } from 'react';

interface CustomNumpadProps {
    isOpen: boolean;
    onInput: (value: string) => void;
    onDelete: () => void;
    onDone: () => void;
    onClose: () => void;
    onDuplicate: () => void;
    onClear: () => void;
    onAddGroup: () => void;
    activeField: 'largura' | 'altura' | 'quantidade' | null;
}

const CustomNumpad = forwardRef<HTMLDivElement, CustomNumpadProps>(({ isOpen, onInput, onDelete, onDone, onClose, onDuplicate, onClear, onAddGroup, activeField }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragY, setDragY] = useState(0);
    const startY = useRef(0);
    const currentY = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        startY.current = e.touches[0].clientY;
        currentY.current = 0;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const deltaY = e.touches[0].clientY - startY.current;
        if (deltaY > 0) { // Only allow dragging down
            currentY.current = deltaY;
            setDragY(deltaY);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (currentY.current > 100) { // Threshold to close
            onClose();
        }
        setDragY(0);
    };

    const handleVibrate = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const NumpadButton: React.FC<{
        action: () => void;
        children: React.ReactNode;
        className?: string;
        ariaLabel: string;
    }> = ({ action, children, className = '', ariaLabel }) => (
        <button
            type="button"
            onClick={() => {
                handleVibrate();
                action();
            }}
            aria-label={ariaLabel}
            className={`flex items-center justify-center h-10 rounded-lg text-xl font-semibold transition-colors duration-150 ${className}`}
        >
            {children}
        </button>
    );

    const IconButton: React.FC<{
        action: () => void;
        icon: string;
        ariaLabel: string;
        isPrimary?: boolean;
    }> = ({ action, icon, ariaLabel, isPrimary = false }) => (
        <button
            type="button"
            onClick={() => {
                handleVibrate();
                action();
            }}
            aria-label={ariaLabel}
            className={`flex items-center justify-center h-10 w-10 rounded-full text-lg transition-colors duration-150 ${isPrimary
                ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
        >
            <i className={icon}></i>
        </button>
    );

    const numberClasses = "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 shadow-sm";
    const actionClasses = "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 shadow-sm";
    const isLastField = activeField === 'quantidade';

    // Handle clicks outside
    React.useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as HTMLElement;

            // Se o clique for dentro do numpad, ignora
            if (ref.current && ref.current.contains(target)) {
                return;
            }

            // Se o clique for em um input (identificado pelo data attribute), ignora
            // pois o input vai lidar com a abertura/troca do teclado
            if (target.closest('[data-numpad-input="true"]')) {
                return;
            }

            // Caso contrário, fecha o teclado
            onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, onClose, ref]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop - pointer-events-none permite clicar através dele */}
            <div
                className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity duration-200 pointer-events-none"
                style={{ opacity: isOpen ? 1 : 0 }}
            />

            {/* Drawer */}
            <div
                ref={ref}
                className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white dark:bg-slate-800 rounded-t-2xl shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.2)] border-t-2 border-slate-200 dark:border-slate-700"
                style={{
                    transform: `translateY(${isDragging ? dragY : 0}px)`,
                    transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}
            >
                {/* Drag Handle */}
                <div
                    className="flex justify-center pt-2 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-12 h-1 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
                </div>

                {/* Numpad Content */}
                <div className="p-2 pb-3">
                    <div className="max-w-sm mx-auto">
                        <div className="grid grid-cols-3 gap-2">
                            <NumpadButton action={() => onInput('1')} className={numberClasses} ariaLabel="Número 1">1</NumpadButton>
                            <NumpadButton action={() => onInput('2')} className={numberClasses} ariaLabel="Número 2">2</NumpadButton>
                            <NumpadButton action={() => onInput('3')} className={numberClasses} ariaLabel="Número 3">3</NumpadButton>

                            <NumpadButton action={() => onInput('4')} className={numberClasses} ariaLabel="Número 4">4</NumpadButton>
                            <NumpadButton action={() => onInput('5')} className={numberClasses} ariaLabel="Número 5">5</NumpadButton>
                            <NumpadButton action={() => onInput('6')} className={numberClasses} ariaLabel="Número 6">6</NumpadButton>

                            <NumpadButton action={() => onInput('7')} className={numberClasses} ariaLabel="Número 7">7</NumpadButton>
                            <NumpadButton action={() => onInput('8')} className={numberClasses} ariaLabel="Número 8">8</NumpadButton>
                            <NumpadButton action={() => onInput('9')} className={numberClasses} ariaLabel="Número 9">9</NumpadButton>

                            <NumpadButton action={() => onInput(',')} className={actionClasses} ariaLabel="Vírgula">,</NumpadButton>
                            <NumpadButton action={() => onInput('0')} className={numberClasses} ariaLabel="Número 0">0</NumpadButton>
                            <NumpadButton action={onDelete} className={actionClasses} ariaLabel="Apagar">
                                <i className="fas fa-backspace text-lg"></i>
                            </NumpadButton>
                        </div>

                        {/* Barra de Ações */}
                        <div className="mt-3 grid grid-cols-5 gap-2">
                            <IconButton action={onDuplicate} ariaLabel="Duplicar medida" icon="fas fa-copy" />
                            <IconButton action={onClear} ariaLabel="Limpar campos" icon="fas fa-eraser" />
                            <IconButton action={onClose} ariaLabel="Recolher teclado" icon="fas fa-chevron-down" />
                            <IconButton action={onAddGroup} ariaLabel="Novo grupo" icon="fas fa-plus" />
                            <IconButton
                                action={onDone}
                                ariaLabel={isLastField ? "Confirmar entrada" : "Próximo campo"}
                                icon={isLastField ? "fas fa-check" : "fas fa-arrow-right"}
                                isPrimary
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
});

CustomNumpad.displayName = 'CustomNumpad';

export default CustomNumpad;