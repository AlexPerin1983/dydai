import React, { useState, useRef, useEffect } from 'react';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false, className = '' }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<string | number>(defaultOpen ? 'auto' : 0);

    useEffect(() => {
        if (isOpen) {
            setHeight(contentRef.current?.scrollHeight || 'auto');
        } else {
            setHeight(0);
        }
    }, [isOpen, children]);

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                type="button"
            >
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-base">{title}</span>
                <i className={`fas fa-chevron-down text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            <div
                ref={contentRef}
                style={{ height }}
                className="transition-all duration-300 ease-in-out overflow-hidden"
            >
                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-700/50">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Accordion;
