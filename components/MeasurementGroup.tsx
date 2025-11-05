import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Measurement, Film } from '../types';
import DynamicSelector from './ui/DynamicSelector';
import { AMBIENTES, TIPOS_APLICACAO } from '../constants';
import Tooltip from './ui/Tooltip';
import DiscountModal from './modals/DiscountModal';

// Redefinindo NumpadConfig localmente para resolver erro de importação, pois não está sendo exportado de CustomNumpad.tsx
interface NumpadConfig {
    isOpen: boolean;
    measurementId: number | null;
    field: 'largura' | 'altura' | 'quantidade' | null;
    currentValue: string;
    shouldClearOnNextInput: boolean;
}

interface MeasurementGroupProps {
    measurement: Measurement & { isNew?: boolean };
    films: Film[];
    onUpdate: (updated: Partial<Measurement>) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onOpenFilmSelectionModal: (measurementId: number) => void;
    onOpenEditModal: (measurement: Measurement & { isNew?: boolean }) => void;
    onOpenDiscountModal: (measurement: Measurement) => void;
    index: number;
    isDragging: boolean;
    onDragStart: (index: number) => void;
    onDragEnter: (index: number) => void;
    onDragEnd: () => void;
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelection: (id: number, index: number, isShiftKey: boolean) => void;
    numpadConfig: NumpadConfig;
    onOpenNumpad: (measurementId: number, field: 'largura' | 'altura' | 'quantidade', currentValue: string | number) => void;
    isActive: boolean;
    swipedItemId: number | null;
    onSetSwipedItem: (id: number | null) => void;
    isModalMode?: boolean;
}

const MeasurementGroup: React.FC<MeasurementGroupProps> = ({
    measurement,
    films,
    onUpdate,
    onDelete,
    onDuplicate,
    onOpenFilmSelectionModal,
    onOpenEditModal,
    onOpenDiscountModal,
    index,
    isDragging,
    onDragStart,
    onDragEnter,
    onDragEnd,
    isSelectionMode,
    isSelected,
    onToggleSelection,
    numpadConfig,
    onOpenNumpad,
    isActive,
    swipedItemId,
    onSetSwipedItem,
    isModalMode = false
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [translateX, setTranslateX] = useState(0);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const swipeableRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const isDraggingCard = useRef(false);
    const gestureDirection = useRef<'horizontal' | 'vertical' | null>(null);
    const currentTranslateX = useRef(0);
    const ACTIONS_WIDTH_LEFT = 100; // Delete
    const ACTIONS_WIDTH_RIGHT = 100; // Approve/Revise (using generic swipe actions here)
    const SWIPE_THRESHOLD = 50;

    const isEditingThisMeasurement = numpadConfig.isOpen && numpadConfig.measurementId === measurement.id;

    const larguraNum = isEditingThisMeasurement && numpadConfig.field === 'largura' 
        ? parseFloat((numpadConfig.currentValue || '0').replace(',', '.'))
        : parseFloat((String(measurement.largura) || '0').replace(',', '.'));

    const alturaNum = isEditingThisMeasurement && numpadConfig.field === 'altura' 
        ? parseFloat((numpadConfig.currentValue || '0').replace(',', '.'))
        : parseFloat((String(measurement.altura) || '0').replace(',', '.'));

    const quantidadeNum = isEditingThisMeasurement && numpadConfig.field === 'quantidade' 
        ? parseInt(numpadConfig.currentValue || '0', 10)
        : measurement.quantidade || 0;

    const m2 = larguraNum * alturaNum * quantidadeNum;
    
    const selectedFilm = films.find(f => f.nome === measurement.pelicula);
    const pricePerM2 = useMemo(() => {
        if (selectedFilm) {
            if (selectedFilm.preco > 0) return selectedFilm.preco;
            if (selectedFilm.maoDeObra && selectedFilm.maoDeObra > 0) return selectedFilm.maoDeObra;
        }
        return 0;
    }, [selectedFilm]);

    const basePrice = pricePerM2 * m2;
    let finalPrice = basePrice;
    const discountValue = measurement.discount || 0;
    if (discountValue > 0) {
        if (measurement.discountType === 'percentage') {
            finalPrice = basePrice * (1 - discountValue / 100);
        } else { // fixed
            finalPrice = basePrice - discountValue;
        }
    }
    finalPrice = Math.max(0, finalPrice);

    const handleToggleExpand = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);
    
    const handleSwipeStart = (e: React.TouchEvent) => {
        if (isSelectionMode || isModalMode) return;
        
        if (swipedItemId && swipedItemId !== measurement.id) {
            onSetSwipedItem(null);
        }
        
        isDraggingCard.current = true;
        gestureDirection.current = null;
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        if (swipeableRef.current) {
            swipeableRef.current.style.transition = 'none';
        }
    };

    const handleSwipeMove = (e: React.TouchEvent) => {
        if (!isDraggingCard.current || !swipeableRef.current) return;

        const deltaX = e.touches[0].clientX - touchStartX.current;
        const deltaY = e.touches[0].clientY - touchStartY.current;

        if (gestureDirection.current === null) {
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                gestureDirection.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
            }
        }
        
        if (gestureDirection.current === 'vertical') return;
        if (e.cancelable) e.preventDefault();
        
        const newTranslateX = currentTranslateX.current + deltaX;
        let finalTranslateX = newTranslateX;
        
        if (newTranslateX > 0) { // Swipe right (Edit/Actions)
            finalTranslateX = Math.pow(newTranslateX, 0.7);
        } else if (newTranslateX < -ACTIONS_WIDTH_LEFT) { // Swipe left (Delete)
            const overflow = -ACTIONS_WIDTH_LEFT - newTranslateX;
            finalTranslateX = -ACTIONS_WIDTH_LEFT - Math.pow(overflow, 0.7);
        }
        swipeableRef.current.style.transform = `translateX(${finalTranslateX}px)`;
    };

    const handleSwipeEnd = () => {
        if (!isDraggingCard.current || !swipeableRef.current) return;
        isDraggingCard.current = false;
        if (gestureDirection.current === 'vertical') {
            gestureDirection.current = null;
            return;
        }
        gestureDirection.current = null;

        const transformValue = swipeableRef.current.style.transform;
        const matrix = new DOMMatrix(transformValue);
        const currentX = matrix.m41;

        swipeableRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
        
        if (currentX > ACTIONS_WIDTH_RIGHT / 2) {
            // Swipe right action (e.g., Edit/Actions menu) - Not implemented here, just reset
            swipeableRef.current.style.transform = `translateX(0px)`;
            currentTranslateX.current = 0;
            setTranslateX(0);
        } else if (currentX < -ACTIONS_WIDTH_LEFT / 2) {
            // Swipe left action (Delete) - Not implemented here, just reset
            swipeableRef.current.style.transform = `translateX(0px)`;
            currentTranslateX.current = 0;
            setTranslateX(0);
        } else {
            swipeableRef.current.style.transform = `translateX(0px)`;
            currentTranslateX.current = 0;
            setTranslateX(0);
        }
    };
    
    const handleActionClick = (action: 'edit' | 'delete' | 'discount') => {
        if (action === 'edit') onOpenEditModal(measurement);
        if (action === 'delete') onDelete();
        if (action === 'discount') setShowDiscountModal(true);
    };
    
    const handleDiscountSave = (discount: number, discountType: 'percentage' | 'fixed') => {
        onOpenDiscountModal({ ...measurement, discount, discountType });
        setShowDiscountModal(false);
    };

    const handleMainClick = () => {
        if (isSelectionMode) {
            onToggleSelection(measurement.id, index, false);
        } else if (!isDraggingCard.current && !isModalMode) {
            // If not dragging and not in modal mode, toggle expansion
            if (measurement.active) {
                handleToggleExpand();
            }
        }
    };
    
    const handleMainKeyDown = (e: React.KeyboardEvent) => {
        if (isSelectionMode) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleSelection(measurement.id, index, e.shiftKey);
            }
        } else if (!isDraggingCard.current && !isModalMode) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (measurement.active) handleToggleExpand();
            }
        }
    };

    const handleDragStartWrapper = (e: React.DragEvent) => {
        if (isSelectionMode || isModalMode) return;
        onDragStart(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(measurement.id));
    };
    
    const handleDragEnterWrapper = (e: React.DragEvent) => {
        if (isSelectionMode || isModalMode) return;
        onDragEnter(index);
    };

    const handleDragEndWrapper = () => {
        if (isSelectionMode || isModalMode) return;
        onDragEnd();
    };

    const getContainerClasses = () => {
        const base = "relative rounded-xl border transition-all duration-200 mb-2 shadow-sm";
        let classes = `${base} bg-white border-slate-200`;

        if (isDragging) {
            classes += ' opacity-50 border-blue-500 shadow-xl ring-4 ring-blue-200';
        } else if (isSelectionMode) {
            classes += isSelected ? ' bg-blue-50 border-blue-400' : ' bg-white border-slate-200 hover:bg-slate-50';
        } else if (isActive) {
            classes += ' border-2 border-indigo-500 shadow-md';
        } else if (measurement.isNew) {
            classes += ' border-2 border-green-400 shadow-lg';
        } else if (swipedItemId === measurement.id) {
            classes += ' shadow-lg';
        } else {
            classes += ' hover:bg-slate-50';
        }
        
        if (isModalMode) classes = classes.replace('mb-2', 'mb-0');

        return classes;
    };
    
    const inputBaseClasses = "w-full text-center py-2 px-1.5 rounded-lg border text-sm transition-colors duration-200";
    
    const isDraggable = !isSelectionMode && translateX === 0 && !isModalMode;

    const NumberInputButton: React.FC<{
        field: 'largura' | 'altura' | 'quantidade';
        placeholder: string;
        value: string | number;
    }> = ({ field, placeholder, value }) => {
        const isEditing = isEditingThisMeasurement && numpadConfig.field === field;
        const isSelectedForReplacement = isEditing && numpadConfig.shouldClearOnNextInput;
        const displayValue = isEditing ? numpadConfig.currentValue : String(value);
        
        const getButtonClasses = () => {
            let classes = `${inputBaseClasses} bg-white text-slate-800 border-slate-300 placeholder:text-slate-400 focus:outline-none`;
            if (isEditing) {
                classes += ' border-2 border-blue-500';
            }
            if (!measurement.active) {
                classes += ' bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed';
            }
            return classes;
        };
        
        const renderContent = () => {
            // Usando text-sm para o conteúdo
            const displayValWithComma = (isEditing ? displayValue.replace('.', ',') : displayValue);

            if (isEditing) {
                if (isSelectedForReplacement && displayValWithComma) {
                    return (
                        <span className="bg-blue-500 text-white rounded-sm px-1">
                            {displayValWithComma}
                        </span>
                    );
                }
                return (
                    <>
                        {displayValWithComma}
                        {/* Aumentando a altura do cursor para text-sm */}
                        <span className="inline-block w-px h-4 bg-blue-500 align-text-bottom ml-0.5 animate-blink" />
                    </>
                );
            }
            
            return value !== '' ? String(value).replace('.', ',') : <span className="text-slate-400">{placeholder}</span>;
        };
    
        return (
            <div
                role="button"
                tabIndex={measurement.active ? 0 : -1}
                onClick={() => measurement.active && !isSelectionMode && onOpenNumpad(measurement.id, field, value)}
                onKeyDown={(e) => {
                    if (measurement.active && !isSelectionMode && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onOpenNumpad(measurement.id, field, value);
                    }
                }}
                data-field={field} // ADICIONADO: data-field para foco
                className={getButtonClasses()}
            >
                {renderContent()}
            </div>
        );
    };

    return (
        <div 
            className={getContainerClasses()}
            data-measurement-id={measurement.id} // ADICIONADO: data-measurement-id para foco
            draggable={isDraggable}
            onDragStart={isDraggable ? handleDragStartWrapper : undefined}
            onDragEnter={isDraggable ? handleDragEnterWrapper : undefined}
            onDragEnd={isDraggable ? handleDragEndWrapper : undefined}
            onDragOver={isDraggable ? (e) => e.preventDefault() : undefined} // Necessário para permitir drop
            onTouchStart={handleSwipeStart}
            onTouchMove={handleSwipeMove}
            onTouchEnd={handleSwipeEnd}
            style={{ touchAction: 'pan-y', transform: translateX !== 0 ? `translateX(${translateX}px)` : undefined }}
            role={isSelectionMode ? "option" : "button"}
            aria-selected={isSelectionMode ? isSelected : undefined}
            tabIndex={isSelectionMode || measurement.active ? 0 : -1}
            onClick={!isSelectionMode && measurement.active ? handleMainClick : undefined}
            onKeyDown={!isSelectionMode && measurement.active ? handleMainKeyDown : undefined}
        >
            {/* Background Actions (Swipe Left/Right) */}
            <div className="absolute inset-0 flex justify-between items-stretch">
                {/* Ações à Direita (Edit/Discount) */}
                <div className="flex items-center justify-start">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleActionClick('discount'); }}
                        className="bg-indigo-500 text-white h-full w-20 flex flex-col items-center justify-center transition-colors hover:bg-indigo-600 text-xs font-semibold"
                        aria-label="Aplicar Desconto"
                    >
                        <i className="fas fa-percent text-lg"></i>
                        Desconto
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleActionClick('edit'); }}
                        className="bg-slate-500 text-white h-full w-20 flex flex-col items-center justify-center transition-colors hover:bg-slate-600 text-xs font-semibold"
                        aria-label="Editar Medida"
                    >
                        <i className="fas fa-pen text-lg"></i>
                        Editar
                    </button>
                </div>
                
                {/* Ações à Esquerda (Delete) */}
                <div className="flex items-center justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleActionClick('delete'); }}
                        className="bg-red-600 text-white h-full w-20 flex flex-col items-center justify-center transition-colors hover:bg-red-700 text-xs font-semibold"
                        aria-label="Excluir Medida"
                    >
                        <i className="fas fa-trash-alt text-lg"></i>
                        Excluir
                    </button>
                </div>
            </div>

            {/* Foreground Content */}
            <div
                ref={swipeableRef}
                style={{ touchAction: 'pan-y', transform: translateX !== 0 ? `translateX(${translateX}px)` : undefined }}
                className="relative z-10 w-full"
            >
                <div className="p-3 flex flex-col gap-2">
                    {/* Checkbox for selection mode */}
                    {isSelectionMode && (
                        <div className="absolute left-1 top-1 z-20">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => { e.stopPropagation(); onToggleSelection(measurement.id, index, e.nativeEvent.shiftKey); }}
                                className="h-5 w-5 text-blue-600 rounded-md border-slate-400 focus:ring-offset-0 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                aria-label={`Selecionar medida ${index + 1}`}
                            />
                        </div>
                    )}

                    <div className={`flex items-center justify-between gap-2 ${isSelectionMode ? 'ml-6' : ''}`}>
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                            <span className={`text-xs font-bold ${isActive ? 'text-indigo-600' : 'text-slate-500'} flex-shrink-0`}>
                                {index + 1}
                            </span>
                            <span className="text-xs font-medium text-slate-500 truncate flex-grow min-w-0">
                                {measurement.pelicula}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {measurement.discount > 0 && (
                                <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${measurement.discountType === 'percentage' ? 'bg-red-100 text-red-700' : 'bg-red-100 text-red-700'}`}>
                                    {measurement.discountType === 'percentage' ? `${measurement.discount.toFixed(1).replace('.0', '')}%` : `R$ ${measurement.discount.toFixed(2).replace('.', ',')}`}
                                </div>
                            )}
                            {m2 > 0 && (
                                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {m2.toFixed(2).replace('.', ',')} m²
                                </span>
                            )}
                            <button onClick={() => onOpenEditModal(measurement)} className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors" aria-label="Abrir edição detalhada">
                                <i className="fas fa-ellipsis-h text-sm"></i>
                            </button>
                        </div>
                    </div>

                    {/* Input Fields */}
                    <div className="grid grid-cols-4 gap-2 mt-1">
                        <NumberInputButton field="largura" placeholder="L (m)" value={measurement.largura} />
                        <NumberInputButton field="altura" placeholder="A (m)" value={measurement.altura} />
                        <NumberInputButton field="quantidade" placeholder="Qtd" value={measurement.quantidade} />
                        
                        {/* Price Display / Film Selection */}
                        <div 
                            role="button"
                            tabIndex={measurement.active ? 0 : -1}
                            onClick={() => measurement.active && !isSelectionMode && onOpenFilmSelectionModal(measurement.id)}
                            onKeyDown={(e) => {
                                if (measurement.active && !isSelectionMode && (e.key === 'Enter' || e.key === ' ')) {
                                    e.preventDefault();
                                    onOpenFilmSelectionModal(measurement.id);
                                }
                            }}
                            className={`w-full text-center py-2 px-1.5 rounded-lg border text-xs transition-colors duration-200 ${inputBaseClasses} ${!measurement.active ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed' : 'bg-white border-slate-300 hover:bg-slate-50'}`}
                        >
                            <span className="text-slate-500 block leading-none">Preço</span>
                            <span className="font-bold text-slate-800 leading-tight mt-0.5 block">
                                {pricePerM2 > 0 ? `R$ ${pricePerM2.toFixed(2).replace('.', ',')}` : 'Selecione'}
                            </span>
                        </div>
                    </div>
                    
                    {/* Total Price */}
                    <div className="flex justify-end mt-2">
                        <span className="text-sm font-bold text-slate-800">
                            R$ {finalPrice.toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                </div>
            </div>
            
            {showDiscountModal && (
                <DiscountModal
                    isOpen={showDiscountModal}
                    onClose={() => setShowDiscountModal(false)}
                    onSave={handleDiscountSave}
                    initialValue={measurement.discount}
                    initialType={measurement.discountType}
                />
            )}
        </div>
    );
};

export default React.memo(MeasurementGroup);