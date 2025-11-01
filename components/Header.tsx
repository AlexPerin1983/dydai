import React from 'react';

type ActiveTab = 'client' | 'films' | 'settings' | 'history' | 'agenda';

interface HeaderProps {
    activeTab: ActiveTab;
    onTabChange: (tab: ActiveTab) => void;
}

const Header: React.FC<HeaderProps> = ({
// ... (código anterior)