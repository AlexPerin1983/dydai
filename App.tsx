// ... (código anterior)
type UIMeasurement = Measurement & { isNew?: boolean };
type ActiveTab = 'client' | 'films' | 'settings' | 'history' | 'agenda';

export type NumpadConfig = {
    isOpen: boolean;
    measurementId: number | null;
    field: 'largura' | 'altura' | 'quantidade' | null;
    currentValue: string;
    shouldClearOnNextInput: boolean;
};

export type SchedulingInfo = {
    pdf: SavedPDF;
    agendamento?: Agendamento;
} | {
    agendamento: Partial<Agendamento>;
    pdf?: SavedPDF;
};

interface ExtractedClientData {
// ... (restante do código)