import React, { useState, useEffect, useCallback } from 'react';
import { Bobina, Retalho, Film } from '../../types';
import {
    getAllBobinas,
    saveBobina,
    deleteBobina,
    getAllRetalhos,
    saveRetalho,
    deleteRetalho,
    getEstoqueStats,
    generateQRCode,
    saveConsumo,
    EstoqueStats
} from '../../services/estoqueDb';
import { getAllCustomFilms } from '../../services/db';
import QRCode from 'qrcode';
import QRScannerModal from '../modals/QRScannerModal';

// Ícones
const PackageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
    </svg>
);

const ScissorsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const QrCodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="5" height="5" x="3" y="3" rx="1" />
        <rect width="5" height="5" x="16" y="3" rx="1" />
        <rect width="5" height="5" x="3" y="16" rx="1" />
        <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
        <path d="M21 21v.01" />
        <path d="M12 7v3a2 2 0 0 1-2 2H7" />
        <path d="M3 12h.01" />
        <path d="M12 3h.01" />
        <path d="M12 16v.01" />
        <path d="M16 12h1" />
        <path d="M21 12v.01" />
        <path d="M12 21v-1" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
);

interface EstoqueViewProps {
    films: Film[];
}

const EstoqueView: React.FC<EstoqueViewProps> = ({ films }) => {
    const [activeTab, setActiveTab] = useState<'bobinas' | 'retalhos'>('bobinas');
    const [bobinas, setBobinas] = useState<Bobina[]>([]);
    const [retalhos, setRetalhos] = useState<Retalho[]>([]);
    const [stats, setStats] = useState<EstoqueStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState<{ type: 'bobina' | 'retalho', item: Bobina | Retalho } | null>(null);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
    const [showScannerModal, setShowScannerModal] = useState(false);

    // Form states
    const [formFilmId, setFormFilmId] = useState('');
    const [formLargura, setFormLargura] = useState('');
    const [formComprimento, setFormComprimento] = useState('');
    const [formFornecedor, setFormFornecedor] = useState('');
    const [formLote, setFormLote] = useState('');
    const [formCusto, setFormCusto] = useState('');
    const [formObservacao, setFormObservacao] = useState('');
    const [formLocalizacao, setFormLocalizacao] = useState('');
    const [formBobinaId, setFormBobinaId] = useState<number | ''>('');
    const [formDeduzirDaBobina, setFormDeduzirDaBobina] = useState(false);

    // Modal de alteração de status
    const [showStatusModal, setShowStatusModal] = useState<{
        type: 'bobina' | 'retalho';
        item: Bobina | Retalho;
    } | null>(null);

    // Modal de confirmação de exclusão
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
        type: 'bobina' | 'retalho';
        id: number;
    } | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [bobinasData, retalhosData, statsData] = await Promise.all([
                getAllBobinas(),
                getAllRetalhos(),
                getEstoqueStats()
            ]);
            setBobinas(bobinasData);
            setRetalhos(retalhosData);
            setStats(statsData);
        } catch (error) {
            console.error('Erro ao carregar dados do estoque:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const generateQRCodeImage = async (code: string) => {
        try {
            // Gerar URL completa para consulta pública
            const baseUrl = window.location.origin;
            const publicUrl = `${baseUrl}?qr=${encodeURIComponent(code)}`;

            const url = await QRCode.toDataURL(publicUrl, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            setQrCodeDataUrl(url);
        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
        }
    };

    const handleShowQR = async (type: 'bobina' | 'retalho', item: Bobina | Retalho) => {
        setShowQRModal({ type, item });
        await generateQRCodeImage(item.codigoQr);
    };

    const handlePrintQR = () => {
        if (!showQRModal || !qrCodeDataUrl) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const item = showQRModal.item;
            const type = showQRModal.type === 'bobina' ? 'Bobina' : 'Retalho';

            printWindow.document.write(`
                <html>
                <head>
                    <title>QR Code - ${item.codigoQr}</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                        .qr-container { margin: 20px auto; }
                        .code { font-size: 14px; font-weight: bold; margin-top: 10px; }
                        .info { font-size: 12px; color: #666; margin-top: 5px; }
                        @media print {
                            body { margin: 0; padding: 10mm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="qr-container">
                        <img src="${qrCodeDataUrl}" alt="QR Code" />
                        <div class="code">${item.codigoQr}</div>
                        <div class="info">${type}: ${item.filmId}</div>
                        <div class="info">${item.larguraCm}cm x ${'comprimentoTotalM' in item ? item.comprimentoTotalM + 'm' : (item as Retalho).comprimentoCm + 'cm'}</div>
                    </div>
                    <script>window.print(); window.close();</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleAddBobina = async () => {
        if (!formFilmId || !formLargura || !formComprimento) {
            alert('Preencha os campos obrigatórios');
            return;
        }

        try {
            const novaBobina: Omit<Bobina, 'id'> = {
                filmId: formFilmId,
                codigoQr: generateQRCode(),
                larguraCm: parseFloat(formLargura),
                comprimentoTotalM: parseFloat(formComprimento),
                comprimentoRestanteM: parseFloat(formComprimento),
                custoTotal: formCusto ? parseFloat(formCusto) : undefined,
                fornecedor: formFornecedor || undefined,
                lote: formLote || undefined,
                status: 'ativa',
                observacao: formObservacao || undefined
            };

            await saveBobina(novaBobina);
            await loadData();
            resetForm();
            setShowAddModal(false);
        } catch (error) {
            console.error('Erro ao salvar bobina:', error);
            alert('Erro ao salvar bobina');
        }
    };

    const handleAddRetalho = async () => {
        if (!formFilmId || !formLargura || !formComprimento) {
            alert('Preencha os campos obrigatórios');
            return;
        }

        try {
            const novoRetalho: Omit<Retalho, 'id'> = {
                filmId: formFilmId,
                codigoQr: generateQRCode(),
                larguraCm: parseFloat(formLargura),
                comprimentoCm: parseFloat(formComprimento),
                bobinaId: formBobinaId || undefined,
                status: 'disponivel',
                localizacao: formLocalizacao || undefined,
                observacao: formObservacao || undefined
            };

            await saveRetalho(novoRetalho);

            // Se marcou para deduzir da bobina, registra o consumo
            if (formDeduzirDaBobina && formBobinaId) {
                const metrosRetalho = parseFloat(formComprimento) / 100; // cm para metros
                await saveConsumo({
                    bobinaId: formBobinaId,
                    metrosConsumidos: metrosRetalho,
                    larguraCorteCm: parseFloat(formLargura),
                    comprimentoCorteCm: parseFloat(formComprimento),
                    areaM2: (parseFloat(formLargura) * parseFloat(formComprimento)) / 10000,
                    tipo: 'corte',
                    observacao: `Retalho criado: ${formFilmId}`
                });
            }

            await loadData();
            resetForm();
            setShowAddModal(false);
        } catch (error) {
            console.error('Erro ao salvar retalho:', error);
            alert('Erro ao salvar retalho');
        }
    };

    const handleDelete = (type: 'bobina' | 'retalho', id: number) => {
        if (!id) {
            alert('Erro: ID do item não encontrado');
            return;
        }
        setShowDeleteConfirm({ type, id });
    };

    const handleConfirmDelete = async () => {
        if (!showDeleteConfirm) return;

        const { type, id } = showDeleteConfirm;

        try {
            if (type === 'bobina') {
                await deleteBobina(id);
            } else {
                await deleteRetalho(id);
            }
            await loadData();
            setShowDeleteConfirm(null);
        } catch (error: any) {
            console.error(`Erro ao excluir ${type}:`, error);
            const errorMessage = error?.message || 'Erro desconhecido';
            alert(`Erro ao excluir ${type}:\n${errorMessage}`);
        }
    };

    const handleChangeStatus = (type: 'bobina' | 'retalho', item: Bobina | Retalho) => {
        setShowStatusModal({ type, item });
    };

    const handleConfirmStatusChange = async (newStatus: string) => {
        if (!showStatusModal) return;

        const { type, item } = showStatusModal;

        try {
            if (type === 'bobina') {
                await saveBobina({ ...item as Bobina, status: newStatus });
            } else {
                await saveRetalho({ ...item as Retalho, status: newStatus });
            }
            await loadData();
            setShowStatusModal(null);
        } catch (error: any) {
            console.error('Erro ao alterar status:', error);
            alert('Erro ao alterar status');
        }
    };

    const getStatusOptions = (type: 'bobina' | 'retalho') => {
        return type === 'bobina'
            ? [
                { value: 'ativa', label: 'Ativa', emoji: '🟢', color: '#22c55e' },
                { value: 'finalizada', label: 'Finalizada', emoji: '🟡', color: '#f59e0b' },
                { value: 'descartada', label: 'Descartada', emoji: '🔴', color: '#ef4444' }
            ]
            : [
                { value: 'disponivel', label: 'Disponível', emoji: '🟢', color: '#22c55e' },
                { value: 'reservado', label: 'Reservado', emoji: '🟡', color: '#f59e0b' },
                { value: 'usado', label: 'Usado', emoji: '🟠', color: '#f97316' },
                { value: 'descartado', label: 'Descartado', emoji: '🔴', color: '#ef4444' }
            ];
    };

    const resetForm = () => {
        setFormFilmId('');
        setFormLargura('');
        setFormComprimento('');
        setFormFornecedor('');
        setFormLote('');
        setFormCusto('');
        setFormObservacao('');
        setFormLocalizacao('');
        setFormBobinaId('');
        setFormDeduzirDaBobina(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ativa':
            case 'disponivel':
                return 'var(--success)';
            case 'finalizada':
            case 'usado':
                return 'var(--warning)';
            case 'descartada':
            case 'descartado':
                return 'var(--danger)';
            default:
                return 'var(--text-secondary)';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'ativa': 'Ativa',
            'finalizada': 'Finalizada',
            'descartada': 'Descartada',
            'disponivel': 'Disponível',
            'reservado': 'Reservado',
            'usado': 'Usado',
            'descartado': 'Descartado'
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Carregando estoque...</p>
            </div>
        );
    }

    return (
        <div className="estoque-view">
            {/* Stats Cards */}
            {stats && (
                <div className="estoque-stats">
                    <div className="stat-card">
                        <div className="stat-icon"><PackageIcon /></div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalBobinasAtivas}</span>
                            <span className="stat-label">Bobinas Ativas</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: 'var(--primary)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalMetrosDisponiveis.toFixed(1)}m</span>
                            <span className="stat-label">Metros em Estoque</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: 'var(--success)' }}><ScissorsIcon /></div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalRetalhoDisponivel}</span>
                            <span className="stat-label">Retalhos Disponíveis</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: 'var(--warning)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20V10" />
                                <path d="M18 20V4" />
                                <path d="M6 20v-4" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.consumoUltimos30Dias.toFixed(1)}m</span>
                            <span className="stat-label">Consumo (30 dias)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="estoque-tabs">
                <button
                    className={`tab-btn ${activeTab === 'bobinas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bobinas')}
                >
                    <PackageIcon /> Bobinas ({bobinas.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'retalhos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('retalhos')}
                >
                    <ScissorsIcon /> Retalhos ({retalhos.length})
                </button>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons-row">
                <button
                    className="btn-scan-qr"
                    onClick={() => setShowScannerModal(true)}
                >
                    <QrCodeIcon /> Escanear QR Code
                </button>
                <button
                    className="btn-add-estoque"
                    onClick={() => setShowAddModal(true)}
                >
                    <PlusIcon /> Adicionar {activeTab === 'bobinas' ? 'Bobina' : 'Retalho'}
                </button>
            </div>

            {/* Lista de Bobinas */}
            {activeTab === 'bobinas' && (
                <div className="estoque-list">
                    {bobinas.length === 0 ? (
                        <div className="empty-state">
                            <PackageIcon />
                            <p>Nenhuma bobina cadastrada</p>
                            <p className="empty-hint">Clique em "Adicionar Bobina" para começar</p>
                        </div>
                    ) : (
                        bobinas.map(bobina => (
                            <div key={bobina.id} className="estoque-card">
                                <div className="estoque-card-header">
                                    <h3>{bobina.filmId}</h3>
                                    <span
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(bobina.status) }}
                                    >
                                        {getStatusLabel(bobina.status)}
                                    </span>
                                </div>
                                <div className="estoque-card-body">
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="label">Largura:</span>
                                            <span className="value">{bobina.larguraCm} cm</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Comprimento Total:</span>
                                            <span className="value">{bobina.comprimentoTotalM} m</span>
                                        </div>
                                        <div className="info-item highlight">
                                            <span className="label">Restante:</span>
                                            <span className="value">{bobina.comprimentoRestanteM.toFixed(2)} m</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Uso:</span>
                                            <span className="value">
                                                {((1 - bobina.comprimentoRestanteM / bobina.comprimentoTotalM) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    {bobina.fornecedor && (
                                        <div className="info-extra">
                                            <span>Fornecedor: {bobina.fornecedor}</span>
                                            {bobina.lote && <span> | Lote: {bobina.lote}</span>}
                                        </div>
                                    )}
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${(bobina.comprimentoRestanteM / bobina.comprimentoTotalM) * 100}%`,
                                                backgroundColor: bobina.comprimentoRestanteM / bobina.comprimentoTotalM > 0.3
                                                    ? 'var(--success)'
                                                    : 'var(--warning)'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="estoque-card-footer">
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleShowQR('bobina', bobina)}
                                        title="Ver QR Code"
                                    >
                                        <QrCodeIcon />
                                    </button>
                                    <span className="qr-code-text">{bobina.codigoQr}</span>
                                    <button
                                        className="btn-icon status"
                                        onClick={() => handleChangeStatus('bobina', bobina)}
                                        title="Alterar Status"
                                    >
                                        ⚙️
                                    </button>
                                    <button
                                        className="btn-icon danger"
                                        onClick={() => handleDelete('bobina', bobina.id!)}
                                        title="Excluir"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Lista de Retalhos */}
            {activeTab === 'retalhos' && (
                <div className="estoque-list">
                    {retalhos.length === 0 ? (
                        <div className="empty-state">
                            <ScissorsIcon />
                            <p>Nenhum retalho cadastrado</p>
                            <p className="empty-hint">Clique em "Adicionar Retalho" para começar</p>
                        </div>
                    ) : (
                        retalhos.map(retalho => (
                            <div key={retalho.id} className="estoque-card retalho">
                                <div className="estoque-card-header">
                                    <h3>{retalho.filmId}</h3>
                                    <span
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(retalho.status) }}
                                    >
                                        {getStatusLabel(retalho.status)}
                                    </span>
                                </div>
                                <div className="estoque-card-body">
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="label">Largura:</span>
                                            <span className="value">{retalho.larguraCm} cm</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Comprimento:</span>
                                            <span className="value">{retalho.comprimentoCm} cm</span>
                                        </div>
                                        <div className="info-item highlight">
                                            <span className="label">Área:</span>
                                            <span className="value">{retalho.areaM2?.toFixed(2) || ((retalho.larguraCm * retalho.comprimentoCm) / 10000).toFixed(2)} m²</span>
                                        </div>
                                    </div>
                                    {retalho.localizacao && (
                                        <div className="info-extra">
                                            <span>Local: {retalho.localizacao}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="estoque-card-footer">
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleShowQR('retalho', retalho)}
                                        title="Ver QR Code"
                                    >
                                        <QrCodeIcon />
                                    </button>
                                    <span className="qr-code-text">{retalho.codigoQr}</span>
                                    <button
                                        className="btn-icon status"
                                        onClick={() => handleChangeStatus('retalho', retalho)}
                                        title="Alterar Status"
                                    >
                                        ⚙️
                                    </button>
                                    <button
                                        className="btn-icon danger"
                                        onClick={() => handleDelete('retalho', retalho.id!)}
                                        title="Excluir"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal Adicionar */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Adicionar {activeTab === 'bobinas' ? 'Bobina' : 'Retalho'}</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Película *</label>
                                <select
                                    value={formFilmId}
                                    onChange={e => setFormFilmId(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione uma película</option>
                                    {films.map(film => (
                                        <option key={film.nome} value={film.nome}>{film.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Largura (cm) *</label>
                                    <input
                                        type="number"
                                        value={formLargura}
                                        onChange={e => setFormLargura(e.target.value)}
                                        placeholder="Ex: 152"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{activeTab === 'bobinas' ? 'Comprimento (m) *' : 'Comprimento (cm) *'}</label>
                                    <input
                                        type="number"
                                        value={formComprimento}
                                        onChange={e => setFormComprimento(e.target.value)}
                                        placeholder={activeTab === 'bobinas' ? 'Ex: 30' : 'Ex: 150'}
                                        required
                                    />
                                </div>
                            </div>

                            {activeTab === 'bobinas' ? (
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Fornecedor</label>
                                            <input
                                                type="text"
                                                value={formFornecedor}
                                                onChange={e => setFormFornecedor(e.target.value)}
                                                placeholder="Ex: 3M, Solar Gard"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Lote</label>
                                            <input
                                                type="text"
                                                value={formLote}
                                                onChange={e => setFormLote(e.target.value)}
                                                placeholder="Ex: ABC123"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Custo Total (R$)</label>
                                        <input
                                            type="number"
                                            value={formCusto}
                                            onChange={e => setFormCusto(e.target.value)}
                                            placeholder="Ex: 1500.00"
                                            step="0.01"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Associar a uma bobina */}
                                    <div className="form-group">
                                        <label>Origem do Retalho</label>
                                        <select
                                            value={formBobinaId}
                                            onChange={e => {
                                                const val = e.target.value ? parseInt(e.target.value) : '';
                                                setFormBobinaId(val);
                                                // Auto-preencher película quando seleciona bobina
                                                if (val) {
                                                    const bobina = bobinas.find(b => b.id === val);
                                                    if (bobina) {
                                                        setFormFilmId(bobina.filmId);
                                                        setFormLargura(bobina.larguraCm.toString());
                                                    }
                                                }
                                            }}
                                        >
                                            <option value="">Retalho avulso (sem bobina)</option>
                                            {bobinas.filter(b => b.status === 'ativa').map(bobina => (
                                                <option key={bobina.id} value={bobina.id}>
                                                    {bobina.filmId} - {bobina.larguraCm}cm ({bobina.comprimentoRestanteM.toFixed(1)}m restantes)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Checkbox para deduzir da bobina */}
                                    {formBobinaId && (
                                        <div className="form-group checkbox-group">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={formDeduzirDaBobina}
                                                    onChange={e => setFormDeduzirDaBobina(e.target.checked)}
                                                />
                                                <span>Deduzir do estoque da bobina</span>
                                            </label>
                                            <span className="checkbox-hint">
                                                Ao marcar, o comprimento do retalho será descontado da bobina automaticamente
                                            </span>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Localização</label>
                                        <input
                                            type="text"
                                            value={formLocalizacao}
                                            onChange={e => setFormLocalizacao(e.target.value)}
                                            placeholder="Ex: Prateleira A, Gaveta 3"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label>Observação</label>
                                <textarea
                                    value={formObservacao}
                                    onChange={e => setFormObservacao(e.target.value)}
                                    placeholder="Observações adicionais..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                Cancelar
                            </button>
                            <button
                                className="btn-primary"
                                onClick={activeTab === 'bobinas' ? handleAddBobina : handleAddRetalho}
                            >
                                Salvar {activeTab === 'bobinas' ? 'Bobina' : 'Retalho'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal QR Code */}
            {showQRModal && (
                <div className="modal-overlay" onClick={() => setShowQRModal(null)}>
                    <div className="modal-content qr-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>QR Code - {showQRModal.type === 'bobina' ? 'Bobina' : 'Retalho'}</h2>
                            <button className="close-btn" onClick={() => setShowQRModal(null)}>×</button>
                        </div>
                        <div className="modal-body qr-body">
                            {qrCodeDataUrl && (
                                <img src={qrCodeDataUrl} alt="QR Code" className="qr-image" />
                            )}
                            <div className="qr-info">
                                <p className="qr-code-display">{showQRModal.item.codigoQr}</p>
                                <p className="qr-film">{showQRModal.item.filmId}</p>
                                <p className="qr-dimensions">
                                    {showQRModal.item.larguraCm}cm x {
                                        'comprimentoTotalM' in showQRModal.item
                                            ? `${showQRModal.item.comprimentoTotalM}m`
                                            : `${(showQRModal.item as Retalho).comprimentoCm}cm`
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowQRModal(null)}>
                                Fechar
                            </button>
                            <button className="btn-primary" onClick={handlePrintQR}>
                                Imprimir QR Code
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner QR Code Modal */}
            <QRScannerModal
                isOpen={showScannerModal}
                onClose={() => setShowScannerModal(false)}
                onDataUpdated={loadData}
            />

            {/* Modal Alterar Status */}
            {showStatusModal && (
                <div className="modal-overlay" onClick={() => setShowStatusModal(null)}>
                    <div className="modal-content status-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Alterar Status</h2>
                            <button className="close-btn" onClick={() => setShowStatusModal(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="status-item-name">{showStatusModal.item.filmId}</p>
                            <p className="status-current">
                                Status atual: <strong>{showStatusModal.item.status}</strong>
                            </p>
                            <p className="status-label">Selecione o novo status:</p>
                            <div className="status-options">
                                {getStatusOptions(showStatusModal.type).map(option => (
                                    <button
                                        key={option.value}
                                        className={`status-option-btn ${showStatusModal.item.status === option.value ? 'current' : ''}`}
                                        style={{
                                            '--status-color': option.color
                                        } as React.CSSProperties}
                                        onClick={() => handleConfirmStatusChange(option.value)}
                                        disabled={showStatusModal.item.status === option.value}
                                    >
                                        <span className="status-emoji">{option.emoji}</span>
                                        <span className="status-text">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowStatusModal(null)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirmação de Exclusão */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="modal-content status-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ color: 'var(--danger)' }}>Confirmar Exclusão</h2>
                            <button className="close-btn" onClick={() => setShowDeleteConfirm(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                                Tem certeza que deseja excluir este <strong>{showDeleteConfirm.type}</strong>?
                            </p>
                            {showDeleteConfirm.type === 'bobina' ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Todos os consumos associados a ela permanecerão no histórico.
                                </p>
                            ) : (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Dica: Se o retalho foi usado, considere mudar o status para "usado" ao invés de excluir.
                                </p>
                            )}
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(null)}>
                                Cancelar
                            </button>
                            <button
                                className="btn-primary"
                                style={{ flex: 1, backgroundColor: 'var(--danger)' }}
                                onClick={handleConfirmDelete}
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .estoque-view {
                    padding: 1rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .estoque-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .stat-card {
                    background: var(--card-bg);
                    border-radius: 12px;
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: var(--primary-light);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                }

                .stat-info {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }

                .estoque-tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    background: var(--card-bg);
                    padding: 0.5rem;
                    border-radius: 12px;
                }

                .tab-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    border: none;
                    background: transparent;
                    border-radius: 8px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 500;
                }

                .tab-btn.active {
                    background: var(--primary);
                    color: white;
                }

                .tab-btn:hover:not(.active) {
                    background: var(--bg-secondary);
                }

                .action-buttons-row {
                    display: flex;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }

                .btn-scan-qr {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    flex: 1;
                    padding: 1rem;
                    background: #3b82f6;
                    border: none;
                    border-radius: 12px;
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .btn-scan-qr:hover {
                    background: #2563eb;
                }

                .btn-add-estoque {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    flex: 1;
                    padding: 1rem;
                    border: 2px dashed var(--border-color);
                    background: transparent;
                    border-radius: 12px;
                    color: var(--primary);
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .btn-add-estoque:hover {
                    background: var(--primary-light);
                    border-color: var(--primary);
                }

                .estoque-list {
                    display: grid;
                    gap: 1rem;
                }

                .estoque-card {
                    background: var(--card-bg);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .estoque-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-color);
                }

                .estoque-card-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: white;
                    text-transform: uppercase;
                }

                .estoque-card-body {
                    padding: 1rem;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 0.75rem;
                    margin-bottom: 0.75rem;
                }

                .info-item {
                    display: flex;
                    flex-direction: column;
                }

                .info-item .label {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin-bottom: 0.25rem;
                }

                .info-item .value {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .info-item.highlight .value {
                    color: var(--primary);
                    font-size: 1.1rem;
                }

                .info-extra {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin-bottom: 0.75rem;
                }

                .progress-bar {
                    height: 8px;
                    background: var(--bg-secondary);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    transition: width 0.3s ease;
                }

                .estoque-card-footer {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    background: var(--bg-secondary);
                    border-top: 1px solid var(--border-color);
                }

                .qr-code-text {
                    flex: 1;
                    font-family: monospace;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }

                .btn-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    border: none;
                    background: var(--card-bg);
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .btn-icon:hover {
                    background: var(--primary-light);
                    color: var(--primary);
                }

                .btn-icon.danger:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: var(--danger);
                }

                .btn-icon.status {
                    font-size: 1rem;
                }

                .btn-icon.status:hover {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                }

                /* Modal de Status */
                .status-modal {
                    max-width: 400px;
                }

                .status-item-name {
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin: 0 0 0.5rem 0;
                    color: var(--text-primary);
                }

                .status-current {
                    color: var(--text-secondary);
                    margin: 0 0 1.5rem 0;
                }

                .status-label {
                    font-weight: 500;
                    margin: 0 0 1rem 0;
                }

                .status-options {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .status-option-btn {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem 1.25rem;
                    border: 2px solid var(--border-color);
                    background: var(--bg-secondary);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                }

                .status-option-btn:hover:not(:disabled) {
                    border-color: var(--status-color);
                    background: rgba(var(--status-color), 0.1);
                    transform: translateX(4px);
                }

                .status-option-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .status-option-btn.current {
                    border-color: var(--status-color);
                    background: rgba(0, 0, 0, 0.05);
                }

                .status-emoji {
                    font-size: 1.5rem;
                }

                .status-text {
                    font-weight: 600;
                    font-size: 1.1rem;
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: var(--text-secondary);
                }

                .empty-state svg {
                    width: 64px;
                    height: 64px;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .empty-hint {
                    font-size: 0.85rem;
                    margin-top: 0.5rem;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                }

                .modal-content {
                    background: #ffffff;
                    border-radius: 16px;
                    width: 100%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow: auto;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }

                @media (prefers-color-scheme: dark) {
                    .modal-content {
                        background: #1e293b;
                    }
                }

                .dark .modal-content {
                    background: #1e293b;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                }

                .modal-header h2 {
                    margin: 0;
                    font-size: 1.25rem;
                }

                .close-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: none;
                    background: var(--bg-secondary);
                    font-size: 1.5rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary);
                }

                .modal-body {
                    padding: 1.5rem;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: var(--text-primary);
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    font-size: 1rem;
                }

                .form-group textarea {
                    resize: vertical;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .checkbox-group {
                    background: var(--primary-light);
                    padding: 1rem;
                    border-radius: 8px;
                    border: 1px solid var(--primary);
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    font-weight: 500;
                }

                .checkbox-label input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }

                .checkbox-hint {
                    display: block;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    margin-top: 0.5rem;
                }

                .modal-footer {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem 1.5rem;
                    border-top: 1px solid var(--border-color);
                }

                .btn-secondary,
                .btn-primary {
                    flex: 1;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-secondary {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                }

                .btn-primary {
                    background: var(--primary);
                    border: none;
                    color: white;
                }

                .btn-primary:hover {
                    background: var(--primary-dark);
                }

                /* QR Modal */
                .qr-modal {
                    max-width: 400px;
                }

                .qr-body {
                    text-align: center;
                }

                .qr-image {
                    max-width: 200px;
                    margin: 0 auto 1rem;
                }

                .qr-info {
                    margin-top: 1rem;
                }

                .qr-code-display {
                    font-family: monospace;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--primary);
                    margin-bottom: 0.5rem;
                }

                .qr-film {
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 0.25rem;
                }

                .qr-dimensions {
                    color: var(--text-secondary);
                }

                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
                    color: var(--text-secondary);
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--border-color);
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 1rem;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 600px) {
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .estoque-stats {
                        grid-template-columns: 1fr 1fr;
                    }
                    
                    .stat-card {
                        padding: 0.75rem;
                    }
                    
                    .stat-value {
                        font-size: 1.25rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default EstoqueView;
