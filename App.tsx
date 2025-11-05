import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Agendamento, Client, SavedPDF, UserInfo, Film, Measurement, ProposalOption } from './types';
import * as db from './services/db';
import { usePwaInstallPrompt } from './src/hooks/usePwaInstallPrompt';
import { useClients } from './src/hooks/useClients';
import { useProposalOptions } from './src/hooks/useProposalOptions';
import { useMeasurements } from './src/hooks/useMeasurements';
import { useNumpad } from './src/hooks/useNumpad';
import Header, { ActiveTab } from './components/Header';
import ClientBar from './components/ClientBar';
import SummaryBar from './components/SummaryBar';
import ActionsBar from './components/ActionsBar';
import MobileFooter from './components/MobileFooter';
import ProposalOptionsCarousel from './components/ProposalOptionsCarousel';
import MeasurementList, { UIMeasurement } from './components/MeasurementList';
import CustomNumpad from './components/ui/CustomNumpad';
import ClientSelectionModal from './components/modals/ClientSelectionModal';
import ClientModal from './components/modals/ClientModal';
import UserModal from './components/modals/UserModal';
import FilmModal from './components/modals/FilmModal';
import FilmSelectionModal from './components/modals/FilmSelectionModal';
import DiscountModal from './components/modals/DiscountModal';
import GeneralDiscountModal from './components/modals/GeneralDiscountModal';
import ConfirmationModal from './components/modals/ConfirmationModal';
import PdfGenerationStatusModal from './components/modals/PdfGenerationStatusModal';
import PdfHistoryModal from './components/modals/PdfHistoryModal';
import PaymentMethodsModal from './components/modals/PaymentMethodsModal';
import ApiKeyModal from './components/modals/ApiKeyModal';
import SignatureModal from './components/modals/SignatureModal';
import AIMeasurementModal from './components/modals/AIMeasurementModal';
import AIClientModal from './components/modals/AIClientModal';
import { generatePDF } from './services/pdfGenerator';
import { SchedulingInfo } from './components/modals/AgendamentoModal'; // Importando SchedulingInfo

// Tipos locais para o App
type PdfGenerationStatus = 'idle' | 'generating' | 'success' | 'error';
type ClientModalMode = 'add' | 'edit';

export const App: React.FC = () => {
    const { deferredPrompt, promptInstall, isInstalled } = usePwaInstallPrompt();
    
    const { clients: allClients, selectedClientId, setSelectedClientId, loadClients, saveClient, deleteClient } = useClients();
    const { proposalOptions, activeOptionId, activeOption, isDirty: isProposalDirty, setActiveOptionId, updateMeasurements: updateProposalMeasurements, updateGeneralDiscount, addOption: handleAddProposalOption, renameOption: handleRenameProposalOption, deleteOption: handleDeleteProposalOption, duplicateOption: duplicateProposalOption, saveChanges: saveProposalChanges } = useProposalOptions(selectedClientId);
    
    const [isLoading, setIsLoading] = useState(true);
    const [films, setFilms] = useState<Film[]>([]);
    const [allSavedPdfs, setAllSavedPdfs] = useState<SavedPDF[]>([]);
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [activeTab, setActiveTab] = useState<ActiveTab>('client');
    const [isDirty, setIsDirty] = useState(false);
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
    const [hasLoadedAgendamentos, setHasLoadedAgendamentos] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    const [swipeDistance, setSwipeDistance] = useState(0);
    const [clientTransitionKey, setClientTransitionKey] = useState(0);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null); // Definido aqui para ser usado nas dependências

    // NOVO ESTADO: Rastreia qual medida deve ser focada após a adição
    const [measurementToFocusId, setMeasurementToFocusId] = useState<number | null>(null);


    // Modal States
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [clientModalMode, setClientModalMode] = useState<ClientModalMode>('add');
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [initialClientName, setInitialClientName] = useState<string>('');
    const [aiClientData, setAiClientData] = useState<Partial<Client> | undefined>(undefined);
    const [isAIClientModalOpen, setIsAIClientModalOpen] = useState(false);

    const [isFilmModalOpen, setIsFilmModalOpen] = useState(false);
    const [filmToEdit, setFilmToEdit] = useState<Film | null>(null);
    const [isFilmSelectionModalOpen, setIsFilmSelectionModalOpen] = useState(false);
    const [measurementIdForFilmSelection, setMeasurementIdForFilmSelection] = useState<number | null>(null);

    const [isGeneralDiscountModalOpen, setIsGeneralDiscountModalOpen] = useState(false);
    const [generalDiscount, setGeneralDiscount] = useState<{ value: string; type: 'percentage' | 'fixed' }>({ value: '', type: 'percentage' });
    
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [editingMeasurementForDiscount, setEditingMeasurementForDiscount] = useState<Measurement | null>(null);

    const [pdfGenerationStatus, setPdfGenerationStatus] = useState<PdfGenerationStatus>('idle');
    const [isPdfStatusModalOpen, setIsPdfStatusModalOpen] = useState(false);
    const [isPdfHistoryModalOpen, setIsPdfHistoryModalOpen] = useState(false);
    const [pdfToDownload, setPdfToDownload] = useState<{ blob: Blob, filename: string } | null>(null);
    
    const [isPaymentMethodsModalOpen, setIsPaymentMethodsModalOpen] = useState(false);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [apiKeyModalProvider, setApiKeyModalProvider] = useState<'gemini' | 'openai'>('gemini');
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    
    const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
    const [isApplyFilmToAllModalOpen, setIsApplyFilmToAllModalOpen] = useState(false);
    
    const [measurementToDeleteId, setMeasurementToDeleteId] = useState<number | null>(null);
    const [pdfToDeleteId, setPdfToDeleteId] = useState<number | null>(null);
    const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);
    const [schedulingInfo, setSchedulingInfo] = useState<SchedulingInfo>({ pdf: { id: 0, clienteId: 0, date: '', totalPreco: 0, totalM2: 0, pdfBlob: new Blob(), nomeArquivo: '' } });
    const [isAgendamentoDeleteModalOpen, setIsAgendamentoDeleteModalOpen] = useState(false);
    const [agendamentoToDelete, setAgendamentoToDelete] = useState<Agendamento | null>(null);
    const [isAIMeasurementModalOpen, setIsAIMeasurementModalOpen] = useState(false);
    
    const mainRef = useRef<HTMLDivElement>(null);
    const numpadRef = useRef<HTMLDivElement>(null);

    // --- Hooks Initialization ---
    
    // Definindo handleMeasurementsChange aqui para ser usado no useMeasurements e evitar redefinição
    const handleMeasurementsChange = useCallback((newMeasurements: Measurement[]) => {
        if (!activeOptionId) return;
        
        setProposalOptions(prev => prev.map(opt =>
            opt.id === activeOptionId
                ? { ...opt, measurements: newMeasurements }
                : opt
        ));
        setIsDirty(true);
    }, [activeOptionId]);

    const { measurements, totals, generalDiscount } = useMemo(() => {
        const activeMeasurements = activeOption?.measurements || [];
        let totalM2 = 0;
        let subtotal = 0;
        let totalItemDiscount = 0;
        let priceAfterItemDiscounts = 0;
        
        activeMeasurements.forEach(m => {
            const largura = parseFloat(String(m.largura || '0').replace(',', '.'));
            const altura = parseFloat(String(m.altura || '0').replace(',', '.'));
            const quantidade = Number(m.quantidade) || 0;
            const m2Item = largura * altura * quantidade;
            totalM2 += m2Item;

            const film = films.find(f => f.nome === m.pelicula);
            const pricePerM2 = film ? (film.preco > 0 ? film.preco : (film.maoDeObra || 0)) : 0;
            const basePrice = pricePerM2 * m2Item;
            subtotal += basePrice;

            let itemDiscountAmount = 0;
            const discountValue = m.discount || 0;
            if (m.discountType === 'percentage' && discountValue > 0) {
                itemDiscountAmount = basePrice * (discountValue / 100);
            } else if (m.discountType === 'fixed' && discountValue > 0) {
                itemDiscountAmount = discountValue;
            }
            totalItemDiscount += itemDiscountAmount;
            priceAfterItemDiscounts += Math.max(0, basePrice - itemDiscountAmount);
        });
        
        let generalDiscountAmount = 0;
        const discountValue = parseFloat(String(generalDiscount.value).replace(',', '.')) || 0;
        
        if (generalDiscount.type === 'percentage' && discountValue > 0) {
            generalDiscountAmount = priceAfterItemDiscounts * (discountValue / 100);
        } else if (generalDiscount.type === 'fixed' && discountValue > 0) {
            generalDiscountAmount = discountValue;
        }
        
        const finalTotal = Math.max(0, priceAfterItemDiscounts - generalDiscountAmount);

        return {
            measurements: activeMeasurements,
            totals: { totalM2, subtotal, totalItemDiscount, priceAfterItemDiscounts, generalDiscountAmount, finalTotal },
            generalDiscount: generalDiscount
        };
    }, [activeOption, films, generalDiscount]);

    const { createEmptyMeasurement: createEmptyMeasurementHook, addMeasurement: addMeasurementHook, duplicateMeasurement: duplicateMeasurementHook } = useMeasurements(films, handleMeasurementsChange);
    
    const { numpadConfig, openNumpad, closeNumpad, handleInput: handleNumpadInput, handleDelete: handleNumpadDelete, handleDone: handleNumpadDone, handleClear: handleNumpadClear } = useNumpad(measurements, handleMeasurementsChange);

    const addMeasurement = useCallback(() => {
        const newMeasurement: UIMeasurement = { ...createEmptyMeasurementHook(), isNew: true };
        const updatedMeasurements = [
            ...measurements.map(m => ({ ...m, isNew: false })),
            newMeasurement, 
        ];
        handleMeasurementsChange(updatedMeasurements);
        return newMeasurement.id; // RETORNA O ID DA NOVA MEDIDA
    }, [createEmptyMeasurementHook, measurements, handleMeasurementsChange]);
    
    const addMeasurementFromActionsBar = useCallback(() => {
        const newId = addMeasurement();
        if (newId) {
            setMeasurementToFocusId(newId);
        }
    }, [addMeasurement]);

    const handleGeneralDiscountChange = useCallback((discount: { value: string; type: 'percentage' | 'fixed' }) => {
        updateGeneralDiscount(discount);
    }, [updateGeneralDiscount]);

    const handleNumpadAddGroup = useCallback(() => {
        const { measurementId, field, currentValue } = numpadConfig;
    
        setProposalOptions(currentOptions => {
            if (!activeOptionId) return currentOptions;
            
            return currentOptions.map(opt => {
                if (opt.id !== activeOptionId) return opt;
                
                let measurementsWithSavedValue = opt.measurements;
                if (measurementId !== null && field !== null) {
                    let finalValue: string | number;
                    if (field === 'quantidade') {
                        finalValue = parseInt(String(currentValue), 10) || 1;
                    } else {
                        finalValue = (String(currentValue) === '' || String(currentValue) === '.') ? '0' : String(currentValue).replace('.', ',');
                    }
                    measurementsWithSavedValue = opt.measurements.map(m =>
                        m.id === measurementId ? { ...m, [field]: finalValue } : m
                    );
                }
        
                const newMeasurement: UIMeasurement = { ...createEmptyMeasurementHook(), isNew: true };
                const finalMeasurements = [
                    ...measurementsWithSavedValue.map(m => ({ ...m, isNew: false })),
                    newMeasurement,
                ];
                
                return { ...opt, measurements: finalMeasurements };
            });
        });
    
        setIsDirty(true);
        
        setNumpadConfig({ isOpen: false, measurementId: null, field: null, currentValue: '', shouldClearOnNextInput: false });
        
        // Foca na nova medida criada pelo numpad
        setMeasurementToFocusId(newMeasurement.id); 
    }, [numpadConfig, createEmptyMeasurementHook, activeOptionId]);

    const handleSwipeDirectionChange = useCallback((direction: 'left' | 'right' | null, distance: number) => {
        setSwipeDirection(direction);
        setSwipeDistance(distance);
    }, []);

    // --- Data Loading ---
    const loadData = useCallback(async () => {
        setIsLoading(true);
        await loadClients();
        const loadedFilms = await db.getAllCustomFilms();
        setFilms(loadedFilms);
        const loadedPdfs = await db.getAllPDFs();
        setAllSavedPdfs(loadedPdfs);
        const loadedAgendamentos = await db.getAllAgendamentos();
        setAgendamentos(loadedAgendamentos);
        const loadedUserInfo = await db.getUserInfo();
        setUserInfo(loadedUserInfo);
        
        // Set initial client if available
        if (loadedUserInfo.lastSelectedClientId) {
            setSelectedClientId(loadedUserInfo.lastSelectedClientId);
        } else if (allClients.length > 0) {
            setSelectedClientId(allClients[0].id!);
        }
        
        setIsLoading(false);
        setHasLoadedHistory(true);
        setHasLoadedAgendamentos(true);
    }, [loadClients, allClients]);

    useEffect(() => {
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // Auto-save proposal options when dirty
    useEffect(() => {
        if (isProposalDirty) {
            const timerId = setTimeout(() => {
                saveProposalChanges();
            }, 1500);
            return () => clearTimeout(timerId);
        }
    }, [isProposalDirty, saveProposalChanges]);

    // Auto-save client when selected client changes (if client data was modified elsewhere, though we rely on saveClient)
    useEffect(() => {
        if (selectedClientId && userInfo) {
            db.saveUserInfo({ ...userInfo, lastSelectedClientId: selectedClientId });
        }
    }, [selectedClientId, userInfo]);

    // --- Derived State & Calculations ---
    const selectedClient = useMemo(() => allClients.find(c => c.id === selectedClientId), [allClients, selectedClientId]);
    
    const pdfStatusMap = useMemo(() => {
        const map = new Map<number, SavedPDF['status']>();
        allSavedPdfs.forEach(pdf => {
            if (pdf.id && pdf.status) {
                map.set(pdf.id, pdf.status);
            }
        });
        return map;
    }, [allSavedPdfs]);

    // --- Handlers ---
    
    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        // Reset swipe state when changing tabs
        setSwipeDirection(null);
        setSwipeDistance(0);
    };

    const handleSaveClient = async (clientData: Omit<Client, 'id'> | Client) => {
        const savedClient = await saveClient(clientData as Omit<Client, 'id'>);
        await loadClients(savedClient.id!);
        setSelectedClientId(savedClient.id!);
        setClientTransitionKey(prev => prev + 1); // Force ClientBar re-render/transition
    };
    
    const handleOpenClientModal = (mode: ClientModalMode, client: Client | null = null, initialName: string = '', aiData?: Partial<Client>) => {
        setClientModalMode(mode);
        setClientToEdit(client);
        setInitialClientName(initialName);
        setAiClientData(aiData);
        setIsClientModalOpen(true);
    };
    
    const handleOpenClientSelectionModal = () => {
        if (allClients.length === 0) {
            handleOpenClientModal('add', null, '');
        } else {
            // If client is selected, we open selection modal to allow changing/editing
            setIsClientModalOpen(true);
            setClientModalMode('edit'); // Use edit mode structure to show list/add options
        }
    };

    const handleDeleteClient = () => {
        if (selectedClientId) {
            if (window.confirm(`Tem certeza que deseja excluir o cliente ${selectedClient?.nome} e TODOS os seus orçamentos salvos?`)) {
                deleteClient(selectedClientId);
                setSelectedClientId(null);
                setClientTransitionKey(prev => prev + 1);
            }
        }
    };
    
    const handleOpenClientModalFromAI = (data: Partial<Client>) => {
        handleOpenClientModal('add', null, '', data);
    };

    const handleOpenFilmModal = (film: Film | null = null) => {
        setFilmToEdit(film);
        setIsFilmModalOpen(true);
    };
    
    const handleSaveFilm = async (newFilmData: Film, originalFilm: Film | null) => {
        await db.saveCustomFilm(newFilmData);
        const updatedFilms = await db.getAllCustomFilms();
        setFilms(updatedFilms);
        setIsFilmModalOpen(false);
        
        // Update measurements if film name changed
        if (originalFilm && newFilmData.nome !== originalFilm.nome) {
            handleMeasurementsChange(prev => prev.map(m => m.pelicula === originalFilm.nome ? { ...m, pelicula: newFilmData.nome } : m));
        }
    };
    
    const handleDeleteFilm = async (filmName: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a película "${filmName}"? Isso afetará orçamentos existentes.`)) {
            await db.deleteCustomFilm(filmName);
            setFilms(prev => prev.filter(f => f.nome !== filmName));
            
            // Update measurements: set film to 'Nenhuma' if deleted
            handleMeasurementsChange(prev => prev.map(m => m.pelicula === filmName ? { ...m, pelicula: 'Nenhuma' } : m));
        }
    };
    
    const handleOpenFilmSelectionModal = (measurementId: number | null) => {
        setMeasurementIdForFilmSelection(measurementId);
        setIsFilmSelectionModalOpen(true);
    };
    
    const handleSelectFilm = (filmName: string) => {
        if (measurementIdForFilmSelection !== null) {
            handleMeasurementsChange(prev => prev.map(m => 
                m.id === measurementIdForFilmSelection ? { ...m, pelicula: filmName } : m
            ));
        }
        setIsFilmSelectionModalOpen(false);
    };
    
    const handleAddNewFilm = async (filmName: string) => {
        const newName = filmName.trim() || `Película ${films.length + 1}`;
        const newFilm: Film = {
            nome: newName,
            preco: 0,
            maoDeObra: 0,
            garantiaFabricante: 0,
            garantiaMaoDeObra: 30,
            uv: 0,
            ir: 0,
            vtl: 0,
            espessura: 0,
            tser: 0,
            imagens: [],
        };
        await handleSaveFilm(newFilm, null);
        // If we were selecting a film for a measurement, set the new film name
        if (measurementIdForFilmSelection !== null) {
            handleSelectFilm(newName);
        }
    };
    
    const handleOpenDiscountModal = (measurement: Measurement) => {
        setEditingMeasurementForDiscount(measurement);
        setIsDiscountModalOpen(true);
    };
    
    const handleCloseDiscountModal = useCallback(() => {
        setIsDiscountModalOpen(false);
        setEditingMeasurementForDiscount(null);
    }, []);
    
    const handleSaveDiscount = useCallback((discount: number, discountType: 'percentage' | 'fixed') => {
        if (!editingMeasurementForDiscount) return;
        
        const updatedMeasurements = measurements.map(m => 
            m.id === editingMeasurementForDiscount.id ? { ...m, discount, discountType } : m
        );
        handleMeasurementsChange(updatedMeasurements);
        handleCloseDiscountModal();
    }, [editingMeasurementForDiscount, measurements, handleMeasurementsChange, handleCloseDiscountModal]);

    const handleOpenGeneralDiscountModal = () => {
        setIsGeneralDiscountModalOpen(true);
    };
    
    const handleSaveGeneralDiscount = (discount: { value: string; type: 'percentage' | 'fixed' }) => {
        updateGeneralDiscount(discount);
        setIsGeneralDiscountModalOpen(false);
    };
    
    const handleOpenAIClientModal = useCallback(() => {
        setIsClientModalOpen(false);
        setIsAIClientModalOpen(true);
    }, []);
    
    const handleProcessAIClient = async (input: { type: 'text' | 'image' | 'audio'; data: string | File[] | Blob }) => {
        if (!userInfo?.aiConfig?.apiKey) {
            alert("Configure sua chave de API na aba 'Empresa' antes de usar a IA.");
            setIsAIClientModalOpen(false);
            return;
        }
        
        try {
            const genAI = new GoogleGenerativeAI(userInfo.aiConfig.apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            
            let content: any[] = [];
            if (input.type === 'text') {
                content.push({ type: 'text', text: input.data as string });
            } else if (input.type === 'image' && Array.isArray(input.data)) {
                for (const file of input.data) {
                    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
                    content.push({ type: 'image', inlineData: { data: blob.toString(), mimeType: file.type } });
                }
            } else if (input.type === 'audio' && input.data instanceof Blob) {
                content.push({ type: 'text', text: "Analisar áudio para dados de cliente." });
                // NOTE: Audio processing requires specific model capabilities and setup not fully implemented here,
                // we'll rely on text/image for client data extraction for now, but keep the structure.
                // For simplicity in this fix, we'll treat audio input as text prompt if Gemini supports it directly, 
                // otherwise, we'll just process the text tab. Since Gemini supports audio, we'll send a placeholder prompt.
                content.push({ type: 'text', text: "Analisar áudio para dados de cliente." });
            }
            
            const result = await model.generateContent([
                ...content,
                {type: 'text', text: "Extraia o máximo de informações de contato e endereço (Nome, Telefone, CPF/CNPJ, Endereço completo) do conteúdo fornecido. Retorne um objeto JSON válido com as chaves: nome, telefone, cpfCnpj, cep, logradouro, numero, bairro, cidade, uf. Use null se a informação não for encontrada."}
            ]);
            
            const response = await result.response;
            const aiData: Partial<Client> = JSON.parse(response.text());
            
            setIsAIClientModalOpen(false);
            handleOpenClientModalFromAI(aiData);

        } catch (error) {
            console.error("AI Client Processing Error:", error);
            alert(`Erro ao processar com IA: ${error instanceof Error ? error.message : String(error)}`);
        }
    };
    
    const handleProcessAIMeasurement = async (input: { type: 'text' | 'image' | 'audio'; data: string | File[] | Blob }) => {
        if (!userInfo?.aiConfig?.apiKey) {
            alert("Configure sua chave de API na aba 'Empresa' antes de usar a IA.");
            setIsAIMeasurementModalOpen(false);
            return;
        }
        
        try {
            const genAI = new GoogleGenerativeAI(userInfo.aiConfig.apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            
            let content: any[] = [];
            if (input.type === 'text') {
                content.push({ type: 'text', text: input.data as string });
            } else if (input.type === 'image' && Array.isArray(input.data)) {
                for (const file of input.data) {
                    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
                    content.push({ type: 'image', inlineData: { data: blob.toString(), mimeType: file.type } });
                }
            } else if (input.type === 'audio' && input.data instanceof Blob) {
                content.push({ type: 'text', text: "Analisar áudio para dados de medidas." });
            }
            
            const result = await model.generateContent([
                ...content,
                {type: 'text', text: "Analise o texto/imagem/áudio e extraia todas as medidas de vidro mencionadas. Para cada medida, identifique Largura (X), Altura (Y), Quantidade (Qtd), Ambiente e Tipo de Aplicação. Retorne uma lista de objetos JSON, onde cada objeto tem as chaves: largura (formato X.XX), altura (formato Y.YY), quantidade (inteiro), ambiente (string, use 'Desconhecido' se não especificado), tipoAplicacao (string, use 'Desconhecido' se não especificado). Use a película padrão ativa se nenhuma for mencionada. Se nenhuma medida for encontrada, retorne uma lista vazia."}
            ]);
            
            const response = await result.response;
            const extractedMeasurements: Measurement[] = JSON.parse(response.text());
            
            setIsAIMeasurementModalOpen(false);
            
            if (extractedMeasurements.length > 0) {
                const currentMeasurements = activeMeasurements.map(m => ({ ...m, isNew: false }));
                const newMeasurements: UIMeasurement[] = extractedMeasurements.map(m => ({
                    ...m,
                    id: Date.now() + Math.random(), // ID temporário único
                    isNew: true,
                    // Garante que os campos obrigatórios estejam preenchidos com defaults se a IA falhar
                    ambiente: m.ambiente || 'Desconhecido',
                    tipoAplicacao: m.tipoAplicacao || 'Desconhecido',
                    pelicula: m.pelicula || films[0]?.nome || 'Nenhuma',
                    active: true,
                    discount: 0,
                    discountType: 'percentage'
                }));
                
                const finalMeasurements = [...currentMeasurements, ...newMeasurements];
                handleMeasurementsChange(finalMeasurements);
                
                // Foca na primeira medida recém-adicionada pela IA
                setMeasurementToFocusId(newMeasurements[0].id);
            } else {
                alert("A IA não conseguiu extrair nenhuma medida do conteúdo fornecido.");
            }

        } catch (error) {
            console.error("AI Measurement Processing Error:", error);
            alert(`Erro ao processar com IA: ${error instanceof Error ? error.message : String(error)}`);
        }
    };
    
    const handleOpenAIMeasurementModal = () => {
        setIsAIMeasurementModalOpen(true);
    };

    const handleSaveFilm = async (newFilmData: Film, originalFilm: Film | null) => {
        await db.saveCustomFilm(newFilmData);
        const updatedFilms = await db.getAllCustomFilms();
        setFilms(updatedFilms);
        setIsFilmModalOpen(false);
        
        // Update measurements if film name changed
        if (originalFilm && newFilmData.nome !== originalFilm.nome) {
            handleMeasurementsChange(prev => prev.map(m => m.pelicula === originalFilm.nome ? { ...m, pelicula: newFilmData.nome } : m));
        }
    };
    
    const handleAddNewFilm = async (filmName: string) => {
        const newName = filmName.trim() || `Película ${films.length + 1}`;
        const newFilm: Film = {
            nome: newName,
            preco: 0,
            maoDeObra: 0,
            garantiaFabricante: 0,
            garantiaMaoDeObra: 30,
            uv: 0,
            ir: 0,
            vtl: 0,
            espessura: 0,
            tser: 0,
            imagens: [],
        };
        await handleSaveFilm(newFilm, null);
        // If we were selecting a film for a measurement, set the new film name
        if (measurementIdForFilmSelection !== null) {
            handleSelectFilm(newName);
        }
    };
    
    const handleSelectFilm = (filmName: string) => {
        if (measurementIdForFilmSelection !== null) {
            handleMeasurementsChange(prev => prev.map(m => 
                m.id === measurementIdForFilmSelection ? { ...m, pelicula: filmName } : m
            ));
        }
        setIsFilmSelectionModalOpen(false);
    };
    
    const handleOpenFilmModal = (film: Film | null = null) => {
        setFilmToEdit(film);
        setIsFilmModalOpen(true);
    };
    
    const handleDeleteFilm = async (filmName: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a película "${filmName}"? Isso afetará orçamentos existentes.`)) {
            await db.deleteCustomFilm(filmName);
            setFilms(prev => prev.filter(f => f.nome !== filmName));
            
            // Update measurements: set film to 'Nenhuma' if deleted
            handleMeasurementsChange(prev => prev.map(m => m.pelicula === filmName ? { ...m, pelicula: 'Nenhuma' } : m));
        }
    };
    
    const handleOpenFilmSelectionModal = (measurementId: number) => {
        setMeasurementIdForFilmSelection(measurementId);
        setIsFilmSelectionModalOpen(true);
    };
    
    const handleOpenEditModal = (measurement: UIMeasurement) => {
        setEditingMeasurementForDiscount(measurement); // Reusing state for modal context
        setIsDiscountModalOpen(true);
    };
    
    const handleSaveMeasurement = (updatedMeasurement: Partial<Measurement>) => {
        handleMeasurementsChange(prev => prev.map(m => m.id === editingMeasurementForDiscount?.id ? { ...m, ...updatedMeasurement } : m));
    };
    
    const handleDeleteMeasurementFromGroup = (id: number) => {
        setMeasurementToDeleteId(id);
    };
    
    const confirmDeleteMeasurement = () => {
        if (measurementToDeleteId !== null) {
            handleMeasurementsChange(prev => prev.filter(m => m.id !== measurementToDeleteId));
            setMeasurementToDeleteId(null);
        }
    };
    
    const duplicateMeasurements = () => {
        if (measurements.length > 0) {
            const newMeasurements: UIMeasurement[] = [];
            measurements.forEach(m => {
                newMeasurements.push({ ...m, id: Date.now() + Math.random(), isNew: true });
            });
            handleMeasurementsChange([...measurements.map(m => ({...m, isNew: false})), ...newMeasurements]);
            setMeasurementToFocusId(newMeasurements[0].id);
        }
    };
    
    const handleOpenClearAllModal = () => {
        setIsClearAllModalOpen(true);
    };
    
    const handleConfirmClearAll = () => {
        handleMeasurementsChange([]);
        setIsClearAllModalOpen(false);
    };
    
    const handleOpenApplyFilmToAllModal = () => {
        setIsApplyFilmToAllModalOpen(true);
    };
    
    const handleApplyFilmToAll = (filmName: string) => {
        handleMeasurementsChange(prev => prev.map(m => ({ ...m, pelicula: filmName })));
        setIsApplyFilmToAllModalOpen(false);
    };
    
    const handleGeneratePdf = async () => {
        if (!selectedClient || totals.finalTotal <= 0 || measurements.length === 0) {
            alert("Preencha o cliente, adicione medidas e garanta que o total seja maior que zero para gerar o PDF.");
            return;
        }
        if (!userInfo) {
            alert("Configurações da empresa não carregadas. Não é possível gerar PDF.");
            return;
        }
        
        setPdfGenerationStatus('generating');
        setIsPdfStatusModalOpen(true);
        
        try {
            const blob = await generatePDF(selectedClient, userInfo, films, measurements, generalDiscount, totals);
            const filename = `Orcamento_${selectedClient.nome.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            
            const savedPdf: Omit<SavedPDF, 'id'> = {
                clienteId: selectedClientId!,
                date: new Date().toISOString(),
                expirationDate: new Date(Date.now() + (userInfo.proposalValidityDays || 60) * 24 * 60 * 60 * 1000).toISOString(),
                totalPreco: totals.finalTotal,
                totalM2: totals.totalM2,
                subtotal: totals.subtotal,
                generalDiscountAmount: totals.generalDiscountAmount,
                generalDiscount: {
                    value: generalDiscount.value,
                    type: generalDiscount.type
                },
                pdfBlob: blob,
                nomeArquivo: filename,
                measurements: measurements.map(({ isNew, ...rest }) => rest),
                status: 'pending',
            };
            
            const saved = await db.savePDF(savedPdf);
            setAllSavedPdfs(prev => [...prev, saved]);
            
            setPdfGenerationStatus('success');
            
            // Trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("PDF Generation Failed:", error);
            setPdfGenerationStatus('error');
        }
    };
    
    const handleClosePdfStatusModal = () => {
        setPdfGenerationStatus('idle');
        setIsPdfStatusModalOpen(false);
    };
    
    const handleGoToHistory = () => {
        handleClosePdfStatusModal();
        setActiveTab('history');
    };
    
    const handleDeletePdf = async (pdfId: number) => {
        await db.deletePDF(pdfId);
        setAllSavedPdfs(prev => prev.filter(p => p.id !== pdfId));
        setAgendamentos(prev => prev.filter(a => a.pdfId !== pdfId));
    };
    
    const handleDownloadPdf = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleUpdatePdfStatus = async (pdfId: number, status: SavedPDF['status']) => {
        const pdfToUpdate = allSavedPdfs.find(p => p.id === pdfId);
        if (pdfToUpdate) {
            const updatedPdf: SavedPDF = { ...pdfToUpdate, status };
            await db.updatePDF(updatedPdf);
            setAllSavedPdfs(prev => prev.map(p => p.id === pdfId ? updatedPdf : p));
        }
    };
    
    const handleScheduleAppointment = (info: SchedulingInfo) => {
        setSchedulingInfo(info);
        setIsAgendamentoModalOpen(true);
    };
    
    const handleSaveAgendamento = async (agendamentoPayload: Omit<Agendamento, 'id'> | Agendamento) => {
        const savedAgendamento = await db.saveAgendamento(agendamentoPayload as Agendamento);
        
        // Update local state
        setAgendamentos(prev => {
            if ('id' in agendamentoPayload) {
                return prev.map(a => a.id === savedAgendamento.id ? savedAgendamento : a);
            } else {
                return [...prev, savedAgendamento];
            }
        });
        
        // Update PDF link if applicable
        if (schedulingInfo.pdf?.id && savedAgendamento.id) {
            const pdfToUpdate = allSavedPdfs.find(p => p.id === schedulingInfo.pdf!.id);
            if (pdfToUpdate) {
                const updatedPdf: SavedPDF = { ...pdfToUpdate, agendamentoId: savedAgendamento.id };
                await db.updatePDF(updatedPdf);
                setAllSavedPdfs(prev => prev.map(p => p.id === pdfToUpdate.id ? updatedPdf : p));
            }
        }
        
        setIsAgendamentoModalOpen(false);
    };
    
    const handleDeleteAgendamento = (agendamento: Agendamento) => {
        setAgendamentoToDelete(agendamento);
        setIsAgendamentoDeleteModalOpen(true);
    };
    
    const confirmDeleteAgendamento = async () => {
        if (agendamentoToDelete?.id) {
            await db.deleteAgendamento(agendamentoToDelete.id);
            setAgendamentos(prev => prev.filter(a => a.id !== agendamentoToDelete.id));
            
            // If PDF is linked, update PDF record
            if (agendamentoToDelete.pdfId) {
                const pdfToUpdate = allSavedPdfs.find(p => p.id === agendamentoToDelete.pdfId);
                if (pdfToUpdate) {
                    const updatedPdf: SavedPDF = { ...pdfToUpdate, agendamentoId: undefined };
                    await db.updatePDF(updatedPdf);
                    setAllSavedPdfs(prev => prev.map(p => p.id === pdfToUpdate.id ? updatedPdf : p));
                }
            }
            setIsAgendamentoDeleteModalOpen(false);
            setAgendamentoToDelete(null);
        }
    };
    
    const handleOpenApiKeyModal = (provider: 'gemini' | 'openai') => {
        setApiKeyModalProvider(provider);
        setIsApiKeyModalOpen(true);
    };
    
    const handleSaveApiKey = async (apiKey: string) => {
        if (!userInfo) return;
        const updatedUserInfo: UserInfo = {
            ...userInfo,
            aiConfig: {
                ...(userInfo.aiConfig || { provider: 'gemini', apiKey: '' }),
                apiKey: apiKey,
            }
        };
        await saveUserInfo(updatedUserInfo);
        setUserInfo(updatedUserInfo);
        setIsApiKeyModalOpen(false);
    };
    
    const handleSavePaymentMethods = async (methods: PaymentMethods) => {
        if (!userInfo) return;
        const updatedUserInfo: UserInfo = {
            ...userInfo,
            payment_methods: methods
        };
        await saveUserInfo(updatedUserInfo);
        setUserInfo(updatedUserInfo);
        setIsPaymentMethodsModalOpen(false);
    };
    
    const handleSaveUserInfo = async (newUserInfo: UserInfo) => {
        await saveUserInfo(newUserInfo);
        setUserInfo(newUserInfo);
    };
    
    const handlePromptPwaInstall = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
        } else {
            alert('O navegador não forneceu um prompt de instalação. Tente abrir o site em uma nova janela ou verifique o diagnóstico PWA.');
        }
    };

    const handleSaveSignature = (signatureDataUrl: string) => {
        if (!userInfo) return;
        handleSaveUserInfo({ ...userInfo, assinatura: signatureDataUrl });
        setIsSignatureModalOpen(false);
    };
    
    const handleOpenUserModal = () => {
        // In a real app, this would open the UserModal, but since UserModal is complex, we rely on settings tab for now.
        setActiveTab('settings');
    };
    
    const handleOpenClientModal = (mode: ClientModalMode, client: Client | null = null, initialName: string = '', aiData?: Partial<Client>) => {
        setClientModalMode(mode);
        setClientToEdit(client);
        setInitialClientName(initialName);
        setAiClientData(aiData);
        setIsClientModalOpen(true);
    };
    
    const handleSaveClient = async (clientData: Omit<Client, 'id'> | Client) => {
        const savedClient = await saveClient(clientData as Omit<Client, 'id'>);
        await loadClients(savedClient.id!); // Reload clients to ensure selection is correct
        setSelectedClientId(savedClient.id!);
        setClientTransitionKey(prev => prev + 1); // Force ClientBar re-render/transition
        setIsClientModalOpen(false);
    };
    
    const handleOpenClientSelectionModal = () => {
        // If client is selected, we open selection modal to allow changing/editing
        setIsClientModalOpen(true);
        setClientModalMode('edit'); // Use edit mode structure to show list/add options
    };

    const handleDeleteClient = () => {
        if (selectedClientId) {
            if (window.confirm(`Tem certeza que deseja excluir o cliente ${selectedClient?.nome} e TODOS os seus orçamentos salvos?`)) {
                deleteClient(selectedClientId);
                setSelectedClientId(null);
                setClientTransitionKey(prev => prev + 1);
            }
        }
    };
    
    const handleOpenClientModalFromAI = (data: Partial<Client>) => {
        handleOpenClientModal('add', null, '', data);
    };

    // --- Render Logic ---
    
    const goToNextClient = useCallback(() => {
        if (allClients.length > 1) {
            const currentIndex = allClients.findIndex(c => c.id === selectedClientId);
            const nextIndex = (currentIndex + 1) % allClients.length;
            setSelectedClientId(allClients[nextIndex].id!);
            setClientTransitionKey(prev => prev + 1);
        }
    }, [allClients, selectedClientId]);

    const goToPrevClient = useCallback(() => {
        if (allClients.length > 1) {
            const currentIndex = allClients.findIndex(c => c.id === selectedClientId);
            const prevIndex = (currentIndex - 1 + allClients.length) % allClients.length;
            setSelectedClientId(allClients[prevIndex].id!);
            setClientTransitionKey(prev => prev + 1);
        }
    }, [allClients, selectedClientId]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center p-20">
                    <div className="loader mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Carregando dados...</p>
                </div>
            );
        }

        if (allClients.length === 0) {
            return (
                <div className="text-center p-8 flex flex-col items-center justify-center h-full min-h-[300px] bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <i className="fas fa-user-friends fa-3x mb-4 text-slate-400"></i>
                    <h3 className="text-xl font-semibold text-slate-800">Nenhum Cliente Cadastrado</h3>
                    <p className="mt-2 text-slate-600 max-w-xs mx-auto">Comece adicionando seu primeiro cliente para criar orçamentos.</p>
                    <button
                        onClick={() => handleOpenClientModal('add')}
                        className="mt-6 px-6 py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i>
                        Adicionar Cliente
                    </button>
                </div>
            );
        }
        
        if (selectedClientId && measurements.length > 0) {
             return (
                <MeasurementList
                    measurements={measurements as UIMeasurement[]}
                    films={films}
                    onMeasurementsChange={handleMeasurementsChange}
                    onOpenFilmModal={handleOpenFilmModal}
                    onOpenFilmSelectionModal={handleOpenFilmSelectionModal}
                    onOpenClearAllModal={() => setIsClearAllModalOpen(true)}
                    onOpenApplyFilmToAllModal={() => setIsApplyFilmToAllModalOpen(true)}
                    numpadConfig={numpadConfig}
                    onOpenNumpad={openNumpad}
                    activeMeasurementId={numpadConfig.measurementId}
                    onOpenEditModal={handleOpenEditModal}
                    onOpenDiscountModal={handleOpenDiscountModal}
                    swipeDirection={swipeDirection}
                    swipeDistance={swipeDistance}
                    onDeleteMeasurement={handleDeleteMeasurementFromGroup}
                    totalM2={totals.totalM2}
                    measurementToFocusId={measurementToFocusId} // PASSANDO NOVO PROP
                    onSetMeasurementToFocusId={setMeasurementToFocusId} // PASSANDO NOVO PROP
                />
            );
        }
        
        if (selectedClientId && measurements.length === 0) {
            return (
                <div className="text-center p-8 flex flex-col items-center justify-center h-full min-h-[300px] bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 mt-4">
                    <i className="fas fa-ruler-combined fa-3x mb-4 text-slate-400"></i>
                    <h3 className="text-xl font-semibold text-slate-800">Nenhuma Medida Cadastrada</h3>
                    <p className="mt-2 text-slate-600 max-w-xs mx-auto">Adicione medidas para este cliente ou use a IA para preencher automaticamente.</p>
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={addMeasurementFromActionsBar}
                            className="px-5 py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition duration-300 shadow-md"
                        >
                            Adicionar Medida
                        </button>
                        <button
                            onClick={() => setIsAIMeasurementModalOpen(true)}
                            className="px-5 py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition duration-300 shadow-md flex items-center gap-2"
                        >
                            <i className="fas fa-robot"></i> IA
                        </button>
                    </div>
                </div>
            );
        }
         return (
            <div className="text-center p-8 flex flex-col items-center justify-center h-full min-h-[300px] bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <i className="fas fa-user-friends fa-3x mb-4 text-slate-400"></i>
                <h3 className="text-xl font-semibold text-slate-800">Selecione um Cliente</h3>
                <p className="mt-2 text-slate-600 max-w-xs mx-auto">Você precisa selecionar um cliente ativo para começar a adicionar medidas e gerar orçamentos.</p>
                <button
                    onClick={handleOpenClientSelectionModal}
                    className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
                >
                    <i className="fas fa-users"></i>
                    Selecionar Cliente
                </button>
            </div>
        );
    }

    const measurementToDelete = measurements.find(m => m.id === measurementToDeleteId);

    return (
        <div className="h-full font-roboto flex flex-col">
            <main ref={mainRef} className="flex-grow overflow-y-auto pb-36 sm:pb-0">
                <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 border-b border-slate-200">
                    <div className="container mx-auto px-2 sm:px-4 w-full max-w-2xl">
                        <div className="pt-2 pb-1 sm:py-3">
                            <Header
                                activeTab={activeTab}
                                onTabChange={handleTabChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-0.5 sm:px-4 py-4 sm:py-8 w-full max-w-2xl">
                    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                       {deferredPrompt && !isInstalled && (
                            <div className="p-3 mb-4 bg-blue-100 border-l-4 border-blue-500 text-blue-800 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-bold">Instale o App!</p>
                                    <p className="text-sm">Clique no ícone de download no navegador para instalar.</p>
                                </div>
                                <button onClick={promptInstall} className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                    Instalar
                                </button>
                            </div>
                       )}
                       
                       {activeTab === 'client' ? (
                           <>
                               {allClients.length > 0 ? (
                                   <div className="bg-slate-100 p-2 px-2 rounded-xl">
                                       <ClientBar
                                           key={clientTransitionKey}
                                           selectedClient={selectedClient}
                                           onSelectClientClick={handleOpenClientSelectionModal}
                                           onAddClient={() => handleOpenClientModal('add')}
                                           onEditClient={() => handleOpenClientModal('edit', selectedClient)}
                                           onDeleteClient={handleDeleteClient}
                                           onSwipeLeft={goToNextClient}
                                           onSwipeRight={goToPrevClient}
                                       />
                                       
                                       {proposalOptions.length > 0 && activeOptionId && (
                                           <ProposalOptionsCarousel
                                               options={proposalOptions}
                                               activeOptionId={activeOptionId}
                                               onSelectOption={setActiveOptionId}
                                               onRenameOption={handleRenameProposalOption}
                                               onDeleteOption={handleDeleteProposalOption}
                                               onAddOption={handleAddProposalOption}
                                               onSwipeDirectionChange={handleSwipeDirectionChange}
                                           />
                                       )}
                                       
                                       <div id="contentContainer" className="w-full min-h-[300px]">
                                           {renderContent()}
                                       </div>
                                   </div>
                               ) : (
                                   <div id="contentContainer" className="w-full min-h-[300px]">
                                       {renderContent()}
                                   </div>
                               )}
                           </>
                       ) : ['history', 'agenda'].includes(activeTab) ? (
                           <div id="contentContainer" className="w-full min-h-[300px]">
                               {activeTab === 'history' && (
                                   <PdfHistoryView
                                       pdfs={allSavedPdfs}
                                       clients={allClients}
                                       agendamentos={agendamentos}
                                       onDelete={handleDeletePdf}
                                       onDownload={handleDownloadPdf}
                                       onUpdateStatus={handleUpdatePdfStatus}
                                       onSchedule={handleScheduleAppointment}
                                   />
                               )}
                               {activeTab === 'agenda' && (
                                   <AgendaView
                                       agendamentos={agendamentos}
                                       pdfs={allSavedPdfs}
                                       clients={allClients}
                                       onEditAgendamento={(ag) => { setSchedulingInfo({ agendamento: ag }); setIsAgendamentoModalOpen(true); }}
                                       onCreateNewAgendamento={(date) => { setSchedulingInfo({ pdf: undefined, agendamento: undefined, start: date }); setIsAgendamentoModalOpen(true); }}
                                   />
                               )}
                           </div>
                       ) : (
                           <div id="contentContainer" className="w-full min-h-[300px]">
                               {renderContent()}
                           </div>
                       )}


                        {activeTab === 'client' && selectedClientId && (
                            <>
                                <div className="hidden sm:block mt-6 pt-6 border-t border-slate-200">
                                   <SummaryBar 
                                        totals={totals}
                                        generalDiscount={generalDiscount}
                                        onOpenGeneralDiscountModal={() => setIsGeneralDiscountModalOpen(true)}
                                        isDesktop
                                    />
                                   <ActionsBar
                                        onAddMeasurement={addMeasurementFromActionsBar} // Usando a nova função
                                        onDuplicateMeasurements={duplicateMeasurements}
                                        onGeneratePdf={handleGeneratePdf}
                                        isGeneratingPdf={pdfGenerationStatus === 'generating'}
                                        onOpenAIModal={() => setIsAIMeasurementModalOpen(true)}
                                   />
                                </div>
                                <MobileFooter
                                    totals={totals}
                                    generalDiscount={generalDiscount}
                                    onOpenGeneralDiscountModal={() => setIsGeneralDiscountModalOpen(true)}
                                    onAddMeasurement={addMeasurementFromActionsBar} // Usando a nova função
                                    onDuplicateMeasurements={duplicateMeasurements}
                                    onGeneratePdf={handleGeneratePdf}
                                    isGeneratingPdf={pdfGenerationStatus === 'generating'}
                                    onOpenAIModal={() => setIsAIMeasurementModalOpen(true)}
                                />
                            </>
                        )}
                    </div>
                </div>
            </main>

            
            {isClientModalOpen && (
                <ClientModal
                    isOpen={isClientModalOpen}
                    onClose={() => setIsClientModalOpen(false)}
                    onSave={handleSaveClient}
                    mode={clientModalMode}
                    client={clientModalMode === 'edit' ? clientToEdit : null}
                    initialName={initialClientName}
                    aiData={aiClientData}
                    onOpenAIModal={handleOpenClientModalFromAI}
                />
            )}
            {isAIClientModalOpen && (
                <AIClientModal
                    isOpen={isAIClientModalOpen}
                    onClose={() => setIsAIClientModalOpen(false)}
                    onProcess={handleProcessAIClient}
                    isProcessing={isProcessingAIClient}
                    provider={userInfo?.aiConfig?.provider || 'gemini'}
                />
            )}
            {isFilmModalOpen && (
                <FilmModal
                    isOpen={isFilmModalOpen}
                    onClose={() => setIsFilmModalOpen(false)}
                    onSave={handleSaveFilm}
                    onDelete={handleDeleteFilm}
                    film={filmToEdit}
                />
            )}
            {isFilmSelectionModalOpen && (
                <FilmSelectionModal
                    isOpen={isFilmSelectionModalOpen}
                    onClose={() => setIsFilmSelectionModalOpen(false)}
                    films={films}
                    onSelect={handleSelectFilm}
                    onAddNewFilm={handleAddNewFilm}
                    onEditFilm={handleOpenFilmModal}
                    onDeleteFilm={handleDeleteFilm}
                />
            )}
            {isGeneralDiscountModalOpen && (
                <GeneralDiscountModal
                    isOpen={isGeneralDiscountModalOpen}
                    onClose={() => setIsGeneralDiscountModalOpen(false)}
                    onSave={handleSaveGeneralDiscount}
                    initialValue={generalDiscount.value}
                    initialType={generalDiscount.type}
                />
            )}
            {isDiscountModalOpen && editingMeasurementForDiscount && (
                <DiscountModal
                    isOpen={isDiscountModalOpen}
                    onClose={handleCloseDiscountModal}
                    onSave={handleSaveDiscount}
                    initialValue={editingMeasurementForDiscount.discount}
                    initialType={editingMeasurementForDiscount.discountType}
                />
            )}
            {isPdfStatusModalOpen && (
                <PdfGenerationStatusModal
                    status={pdfGenerationStatus === 'generating' ? 'generating' : 'success'}
                    onClose={handleClosePdfStatusModal}
                    onGoToHistory={handleGoToHistory}
                />
            )}
            {isPdfHistoryModalOpen && (
                <PdfHistoryModal
                    isOpen={isPdfHistoryModalOpen}
                    onClose={() => setIsPdfHistoryModalOpen(false)}
                    pdfs={allSavedPdfs}
                    onDelete={handleDeletePdf}
                    onDownload={handleDownloadPdf}
                />
            )}
            {isPaymentMethodsModalOpen && userInfo && (
                <PaymentMethodsModal
                    isOpen={isPaymentMethodsModalOpen}
                    onClose={() => setIsPaymentMethodsModalOpen(false)}
                    onSave={handleSavePaymentMethods}
                    paymentMethods={userInfo.payment_methods}
                />
            )}
            {isApiKeyModalOpen && userInfo && (
                <ApiKeyModal
                    isOpen={isApiKeyModalOpen}
                    onClose={() => setIsApiKeyModalOpen(false)}
                    onSave={handleSaveApiKey}
                    currentApiKey={userInfo.aiConfig?.apiKey}
                    provider={apiKeyModalProvider}
                />
            )}
            {isSignatureModalOpen && userInfo && (
                <SignatureModal
                    isOpen={isSignatureModalOpen}
                    onClose={() => setIsSignatureModalOpen(false)}
                    onSave={handleSaveSignature}
                />
            )}
            {isClearAllModalOpen && (
                <ConfirmationModal
                    isOpen={isClearAllModalOpen}
                    onClose={() => setIsClearAllModalOpen(false)}
                    onConfirm={handleConfirmClearAll}
                    title="Confirmar Exclusão Total"
                    message="Tem certeza que deseja apagar TODAS as medidas desta opção? Esta ação não pode ser desfeita."
                    confirmButtonText="Sim, Excluir Todas"
                    confirmButtonVariant="danger"
                />
            )}
            {isApplyFilmToAllModalOpen && films.length > 0 && (
                <FilmSelectionModal
                    isOpen={isApplyFilmToAllModalOpen}
                    onClose={() => setIsApplyFilmToAllModalOpen(false)}
                    films={films}
                    onSelect={handleApplyFilmToAll}
                    onAddNewFilm={handleAddNewFilm}
                    onEditFilm={handleOpenFilmModal}
                    onDeleteFilm={handleDeleteFilm}
                />
            )}
            {isAgendamentoModalOpen && selectedClient && userInfo && (
                <AgendamentoModal
                    isOpen={isAgendamentoModalOpen}
                    onClose={() => setIsAgendamentoModalOpen(false)}
                    onSave={handleSaveAgendamento}
                    onDelete={handleDeleteAgendamento}
                    schedulingInfo={schedulingInfo}
                    clients={allClients}
                    onAddNewClient={(name) => handleOpenClientModal('add', null, name)}
                    userInfo={userInfo}
                    agendamentos={agendamentos}
                />
            )}
            {isAgendamentoDeleteModalOpen && (
                <ConfirmationModal
                    isOpen={isAgendamentoDeleteModalOpen}
                    onClose={() => setIsAgendamentoDeleteModalOpen(false)}
                    onConfirm={confirmDeleteAgendamento}
                    title="Confirmar Exclusão de Agendamento"
                    message="Tem certeza que deseja excluir este agendamento? Se estiver vinculado a um orçamento, o vínculo será removido."
                    confirmButtonText="Sim, Excluir"
                    confirmButtonVariant="danger"
                />
            )}
            {isAIMeasurementModalOpen && userInfo && (
                <AIMeasurementModal
                    isOpen={isAIMeasurementModalOpen}
                    onClose={() => setIsAIMeasurementModalOpen(false)}
                    onProcess={handleProcessAIMeasurement}
                    isProcessing={isProcessingAIMeasurement}
                    provider={userInfo.aiConfig?.provider || 'gemini'}
                />
            )}
            {isSignatureModalOpen && (
                <SignatureModal
                    isOpen={isSignatureModalOpen}
                    onClose={() => setIsSignatureModalOpen(false)}
                    onSave={handleSaveSignature}
                />
            )}
            {measurementToDeleteId && (
                <ConfirmationModal
                    isOpen={!!measurementToDeleteId}
                    onClose={() => setMeasurementToDeleteId(null)}
                    onConfirm={confirmDeleteMeasurement}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja apagar a medida de ${measurementToDelete?.ambiente || 'ambiente desconhecido'}?`}
                    confirmButtonText="Sim, Excluir"
                    confirmButtonVariant="danger"
                />
            )}
        </div>
    );
}

// Placeholder for isProcessingAIClient and isProcessingAIMeasurement states/functions if they were used elsewhere
const isProcessingAIClient = false;
const isProcessingAIMeasurement = false;