import React from 'react';
import { Drawer } from 'vaul';

interface MobileActionsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export const MobileActionsDrawer: React.FC<MobileActionsDrawerProps> = ({
    open,
    onOpenChange,
    children,
    title,
    description
}) => {
    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]" />
                <Drawer.Content className="bg-white dark:bg-slate-800 flex flex-col rounded-t-2xl mt-24 fixed bottom-0 left-0 right-0 z-[9999] max-h-[85vh] outline-none border-t border-slate-200 dark:border-slate-700 shadow-2xl">
                    {/* Handle Bar */}
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-t-2xl flex-shrink-0">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 dark:bg-slate-600 mb-4" />

                        {(title || description) && (
                            <div className="mb-2 px-2">
                                {title && <Drawer.Title className="text-lg font-bold text-slate-800 dark:text-white mb-1">{title}</Drawer.Title>}
                                {description && <Drawer.Description className="text-sm text-slate-500 dark:text-slate-400">{description}</Drawer.Description>}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4 pt-0 overflow-y-auto flex-1 bg-white dark:bg-slate-800 pb-8">
                        {children}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};
