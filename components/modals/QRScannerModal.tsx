import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Bobina, Retalho, Consumo, Client } from '../../types';
import {
    getBobinaByQR,
    getBobinaById,
    getRetalhoByQR,
    getConsumosByBobina,
    getRetalhosByBobina,
    saveConsumo,
    saveBobina,
    saveRetalho
} from '../../services/estoqueDb';
import { getAllClients } from '../../services/db';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDataUpdated: () => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onDataUpdated }) => {
    const [scanning, setScanning] = useState(true);
    const [result, setResult] = useState<{
        type: 'bobina' | 'retalho';
        data: Bobina | Retalho;
        consumos?: Consumo[];
        retalhos?: Retalho[];
        parentBobina?: Bobina;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [loadingSecondary, setLoadingSecondary] = useState(false);
    const [showConsumoForm, setShowConsumoForm] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);

    // Form de consumo
    const [consumoMetros, setConsumoMetros] = useState('');
    const [consumoLargura, setConsumoLargura] = useState('');
    const [consumoComprimento, setConsumoComprimento] = useState('');
    const [consumoClientId, setConsumoClientId] = useState<number | ''>('');
    const [consumoTipo, setConsumoTipo] = useState<'corte' | 'perda' | 'amostra' | 'descarte'>('corte');
    const [consumoObs, setConsumoObs] = useState('');
    const [consumoDestino, setConsumoDestino] = useState<'consumo' | 'retalho'>('consumo');
    const [saving, setSaving] = useState(false);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ... (stopScanner implementation)

    // ... (handleQRCodeScanned implementation)

    // ... (startScanner implementation)

    // ... (useEffect hooks)

    const resetConsumoForm = () => {
        setConsumoMetros('');
        setConsumoLargura('');
        setConsumoComprimento('');
        setConsumoClientId('');
        setConsumoTipo('corte');
        setConsumoDestino('consumo');
        setConsumoObs('');
    };

    // ... (handleClose, handleScanAgain implementations)

    const handleRegistrarConsumo = async () => {
        if (!result) return;

        const metros = parseFloat(consumoMetros) || 0;
        if (metros <= 0) {
            alert('Informe a quantidade de metros consumidos');
            return;
        }

        setSaving(true);
        try {
            const consumo: Omit<Consumo, 'id'> = {
                bobinaId: result.type === 'bobina' ? (result.data as Bobina).id : undefined,
                retalhoId: result.type === 'retalho' ? (result.data as Retalho).id : undefined,
                clientId: consumoClientId || undefined,
                clientName: consumoClientId
                    ? clients.find(c => c.id === consumoClientId)?.nome
                    : undefined,
                metrosConsumidos: metros,
                larguraCorteCm: parseFloat(consumoLargura) || undefined,
                comprimentoCorteCm: parseFloat(consumoComprimento) || undefined,
                areaM2: consumoLargura && consumoComprimento
                    ? (parseFloat(consumoLargura) * parseFloat(consumoComprimento)) / 10000
                    : undefined,
                tipo: consumoTipo,
                observacao: consumoObs || undefined
            };

            await saveConsumo(consumo);

            // Se for para salvar como retalho, cria o retalho também
            if (consumoDestino === 'retalho' && result.type === 'bobina') {
                const bobina = result.data as Bobina;
                const novoRetalho: Omit<Retalho, 'id'> = {
                    bobinaId: bobina.id,
                    filmId: bobina.filmId,
                    codigoQr: '', // Será gerado pelo backend/service
                    larguraCm: parseFloat(consumoLargura) || bobina.larguraCm,
                    comprimentoCm: parseFloat(consumoComprimento) || (metros * 100),
                    status: 'disponivel',
                    localizacao: 'Scanner',
                    observacao: `Gerado a partir de consumo: ${consumoObs || 'Sem obs'}`
                };
                await saveRetalho(novoRetalho);
            }

            // Atualizar dados locais
            if (result.type === 'bobina') {
                const bobina = result.data as Bobina;
                const [consumos, retalhos] = await Promise.all([
                    getConsumosByBobina(bobina.id!),
                    getRetalhosByBobina(bobina.id!)
                ]);
                const updatedBobina = await getBobinaByQR(bobina.codigoQr);
                if (updatedBobina) {
                    setResult({ type: 'bobina', data: updatedBobina, consumos, retalhos });
                }
            }

            setShowConsumoForm(false);
            resetConsumoForm();
            onDataUpdated();
            alert(consumoDestino === 'retalho' ? 'Consumo registrado e Retalho criado!' : 'Consumo registrado com sucesso!');
        } catch (err) {
            console.error('Erro ao registrar consumo:', err);
            alert('Erro ao registrar consumo');
        } finally {
            setSaving(false);
        }
    };

    // ... (formatDate implementation)

    // ... (JSX render)


    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content scanner-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        {scanning ? '📱 Escanear QR Code' :
                            result ? `📦 ${result.type === 'bobina' ? 'Bobina' : 'Retalho'}` :
                                'Erro'}
                    </h2>
                    <button className="close-btn" onClick={handleClose}>×</button>
                </div>

                <div className="modal-body">
                    {scanning && (
                        <>
                            <div id="qr-reader" ref={containerRef} className="qr-scanner-container"></div>
                            <p className="scanner-hint">Aponte a câmera para o QR Code</p>
                        </>
                    )}

                    {loadingData && (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Buscando informações...</p>
                        </div>
                    )}

                    {error && !loadingData && (
                        <div className="error-container">
                            <div className="error-icon">❌</div>
                            <p>{error}</p>
                            <button className="btn-primary" onClick={handleScanAgain}>
                                Tentar Novamente
                            </button>
                        </div>
                    )}

                    {result && !showConsumoForm && !loadingData && (
                        <div className="result-container">
                            {/* Informações básicas */}
                            <div className="info-card">
                                <div className="info-header">
                                    <h3>{result.data.filmId}</h3>
                                    <span className={`status-badge ${result.data.status}`}>
                                        {result.data.status}
                                    </span>
                                </div>

                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="label">Código</span>
                                        <span className="value code">{result.data.codigoQr}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Largura</span>
                                        <span className="value">{result.data.larguraCm} cm</span>
                                    </div>

                                    {result.type === 'bobina' && (
                                        <>
                                            <div className="info-item">
                                                <span className="label">Comprimento Total</span>
                                                <span className="value">{(result.data as Bobina).comprimentoTotalM} m</span>
                                            </div>
                                            <div className="info-item highlight">
                                                <span className="label">🎯 Restante</span>
                                                <span className="value">{(result.data as Bobina).comprimentoRestanteM.toFixed(2)} m</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Uso</span>
                                                <span className="value">
                                                    {((1 - (result.data as Bobina).comprimentoRestanteM / (result.data as Bobina).comprimentoTotalM) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {result.type === 'retalho' && (
                                        <>
                                            <div className="info-item">
                                                <span className="label">Comprimento</span>
                                                <span className="value">{(result.data as Retalho).comprimentoCm} cm</span>
                                            </div>
                                            <div className="info-item highlight">
                                                <span className="label">Área</span>
                                                <span className="value">
                                                    {((result.data as Retalho).areaM2 ||
                                                        ((result.data as Retalho).larguraCm * (result.data as Retalho).comprimentoCm) / 10000
                                                    ).toFixed(2)} m²
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {(result.data as any).fornecedor && (
                                        <div className="info-item">
                                            <span className="label">Fornecedor</span>
                                            <span className="value">{(result.data as Bobina).fornecedor}</span>
                                        </div>
                                    )}

                                    {(result.data as any).lote && (
                                        <div className="info-item">
                                            <span className="label">Lote</span>
                                            <span className="value">{(result.data as Bobina).lote}</span>
                                        </div>
                                    )}

                                    <div className="info-item">
                                        <span className="label">Cadastrado em</span>
                                        <span className="value">{formatDate(result.data.dataCadastro)}</span>
                                    </div>
                                </div>

                                {/* Barra de progresso para bobinas */}
                                {result.type === 'bobina' && (
                                    <div className="progress-section">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${((result.data as Bobina).comprimentoRestanteM / (result.data as Bobina).comprimentoTotalM) * 100}%`,
                                                    backgroundColor: (result.data as Bobina).comprimentoRestanteM / (result.data as Bobina).comprimentoTotalM > 0.3
                                                        ? '#22c55e'
                                                        : '#f59e0b'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Retalhos associados (quando escaneia bobina) */}
                            {result.type === 'bobina' && (
                                <div className="history-section retalhos-section">
                                    <h4>✂️ Retalhos Associados {result.retalhos ? `(${result.retalhos.length})` : ''}</h4>

                                    {loadingSecondary ? (
                                        <div className="loading-secondary">
                                            <div className="spinner-small"></div>
                                            <span>Buscando retalhos...</span>
                                        </div>
                                    ) : (
                                        <div className="history-list">
                                            {result.retalhos && result.retalhos.length > 0 ? (
                                                result.retalhos.map(retalho => (
                                                    <div key={retalho.id} className="history-item retalho-item">
                                                        <div className="history-main">
                                                            <span className="history-metros">{retalho.larguraCm}x{retalho.comprimentoCm}cm</span>
                                                            <span className={`history-tipo status-${retalho.status}`}>{retalho.status}</span>
                                                        </div>
                                                        <div className="history-details">
                                                            <span className="history-client">📍 {retalho.localizacao || 'Sem local'}</span>
                                                            <span className="history-date">{formatDate(retalho.dataCadastro)}</span>
                                                        </div>
                                                        <div className="history-obs">QR: {retalho.codigoQr}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty-history">
                                                    Nenhum retalho associado encontrado.
                                                    <br />
                                                    <small style={{ opacity: 0.7 }}>(Bobina ID: {(result.data as Bobina).id})</small>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Bobina de origem (quando escaneia retalho) */}
                            {result.type === 'retalho' && result.parentBobina && (
                                <div className="history-section parent-section">
                                    <h4>📦 Bobina de Origem</h4>
                                    <div className="history-item parent-item">
                                        <div className="history-main">
                                            <span className="history-metros">{result.parentBobina.filmId}</span>
                                            <span className={`history-tipo status-${result.parentBobina.status}`}>{result.parentBobina.status}</span>
                                        </div>
                                        <div className="history-details">
                                            <span className="history-client">Restante: {result.parentBobina.comprimentoRestanteM.toFixed(2)}m</span>
                                            <span className="history-date">QR: {result.parentBobina.codigoQr}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Histórico de consumos */}
                            {result.type === 'bobina' && result.consumos && result.consumos.length > 0 && (
                                <div className="history-section">
                                    <h4>📋 Histórico de Consumos ({result.consumos.length})</h4>
                                    <div className="history-list">
                                        {result.consumos.map(consumo => (
                                            <div key={consumo.id} className="history-item">
                                                <div className="history-main">
                                                    <span className="history-metros">-{consumo.metrosConsumidos}m</span>
                                                    <span className="history-tipo">{consumo.tipo}</span>
                                                </div>
                                                <div className="history-details">
                                                    {consumo.clientName && (
                                                        <span className="history-client">👤 {consumo.clientName}</span>
                                                    )}
                                                    <span className="history-date">{formatDate(consumo.dataConsumo)}</span>
                                                </div>
                                                {consumo.observacao && (
                                                    <div className="history-obs">{consumo.observacao}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Botões de ação */}
                            <div className="action-buttons">
                                {result.type === 'bobina' && result.data.status === 'ativa' && (
                                    <button
                                        className="btn-primary"
                                        onClick={() => setShowConsumoForm(true)}
                                    >
                                        ✂️ Registrar Consumo
                                    </button>
                                )}
                                <button className="btn-secondary" onClick={handleScanAgain}>
                                    📱 Escanear Outro
                                </button>
                            </div>
                        </div>
                    )}

                    {showConsumoForm && result && (
                        <div className="consumo-form">
                            <h4>✂️ Registrar Consumo</h4>
                            <p className="form-subtitle">Bobina: {result.data.filmId}</p>

                            <div className="form-group">
                                <label>Metros consumidos *</label>
                                <input
                                    type="number"
                                    value={consumoMetros}
                                    onChange={e => setConsumoMetros(e.target.value)}
                                    placeholder="Ex: 2.5"
                                    step="0.01"
                                    autoFocus
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Largura corte (cm)</label>
                                    <input
                                        type="number"
                                        value={consumoLargura}
                                        onChange={e => setConsumoLargura(e.target.value)}
                                        placeholder="Ex: 100"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Comprimento (cm)</label>
                                    <input
                                        type="number"
                                        value={consumoComprimento}
                                        onChange={e => setConsumoComprimento(e.target.value)}
                                        placeholder="Ex: 150"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>O que foi feito com o corte?</label>
                                <div className="radio-group">
                                    <label className={`radio-option ${consumoDestino === 'consumo' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="destino"
                                            value="consumo"
                                            checked={consumoDestino === 'consumo'}
                                            onChange={() => setConsumoDestino('consumo')}
                                        />
                                        <span>Apliquei no Cliente</span>
                                    </label>
                                    <label className={`radio-option ${consumoDestino === 'retalho' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="destino"
                                            value="retalho"
                                            checked={consumoDestino === 'retalho'}
                                            onChange={() => setConsumoDestino('retalho')}
                                        />
                                        <span>Guardei como Retalho</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Cliente (opcional)</label>
                                <select
                                    value={consumoClientId}
                                    onChange={e => setConsumoClientId(e.target.value ? parseInt(e.target.value) : '')}
                                    disabled={consumoDestino === 'retalho'}
                                >
                                    <option value="">Selecione um cliente</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Tipo</label>
                                <select
                                    value={consumoTipo}
                                    onChange={e => setConsumoTipo(e.target.value as any)}
                                >
                                    <option value="corte">Corte</option>
                                    <option value="amostra">Amostra</option>
                                    <option value="perda">Perda</option>
                                    <option value="descarte">Descarte</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Observação</label>
                                <textarea
                                    value={consumoObs}
                                    onChange={e => setConsumoObs(e.target.value)}
                                    placeholder="Observações sobre o consumo..."
                                    rows={2}
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => setShowConsumoForm(false)}
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleRegistrarConsumo}
                                    disabled={saving}
                                >
                                    {saving ? 'Salvando...' : 'Confirmar Consumo'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                    .scanner-modal {
                        max-width: 500px;
                        max-height: 95vh;
                    }

                    .qr-scanner-container {
                                        width: 100%;
                                    max-width: 350px;
                                    margin: 0 auto;
                                    border-radius: 12px;
                                    overflow: hidden;
                    }

                                    .scanner-hint {
                                        text - align: center;
                                    color: #64748b;
                                    margin-top: 1rem;
                                    font-size: 0.9rem;
                    }

                                    .error-container {
                                        text - align: center;
                                    padding: 2rem;
                    }

                                    .error-icon {
                                        font - size: 3rem;
                                    margin-bottom: 1rem;
                    }

                                    .result-container {
                                        display: flex;
                                    flex-direction: column;
                                    gap: 1rem;
                    }

                                    .info-card {
                                        background: #f8fafc;
                                    border-radius: 12px;
                                    padding: 1rem;
                    }

                                    .dark .info-card {
                                        background: #1e293b;
                    }

                                    .info-header {
                                        display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    margin-bottom: 1rem;
                                    padding-bottom: 0.75rem;
                                    border-bottom: 1px solid #e2e8f0;
                    }

                                    .dark .info-header {
                                        border - bottom - color: #334155;
                    }

                                    .info-header h3 {
                                        margin: 0;
                                    font-size: 1.25rem;
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

                                    .status-badge.ativa, .status-badge.disponivel {
                                        background: #22c55e;
                    }

                                    .status-badge.finalizada, .status-badge.usado {
                                        background: #f59e0b;
                    }

                                    .status-badge.descartada, .status-badge.descartado {
                                        background: #ef4444;
                    }

                                    .info-grid {
                                        display: grid;
                                    grid-template-columns: 1fr 1fr;
                                    gap: 0.75rem;
                    }

                                    .info-item {
                                        display: flex;
                                    flex-direction: column;
                    }

                                    .info-item .label {
                                        font - size: 0.75rem;
                                    color: #64748b;
                                    margin-bottom: 0.25rem;
                    }

                                    .info-item .value {
                                        font - size: 1rem;
                                    font-weight: 600;
                                    color: #1e293b;
                    }

                                    .dark .info-item .value {
                                        color: #f1f5f9;
                    }

                                    .info-item .value.code {
                                        font - family: monospace;
                                    font-size: 0.85rem;
                                    color: #3b82f6;
                    }

                                    .info-item.highlight .value {
                                        font - size: 1.25rem;
                                    color: #3b82f6;
                    }

                                    .progress-section {
                                        margin - top: 1rem;
                    }

                                    .progress-bar {
                                        height: 8px;
                                    background: #e2e8f0;
                                    border-radius: 4px;
                                    overflow: hidden;
                    }

                                    .dark .progress-bar {
                                        background: #334155;
                    }

                                    .progress-fill {
                                        height: 100%;
                                    transition: width 0.3s ease;
                    }

                                    .history-section {
                                        background: #f8fafc;
                                    border-radius: 12px;
                                    padding: 1rem;
                    }

                                    .dark .history-section {
                                        background: #1e293b;
                    }

                                    .history-section h4 {
                                        margin: 0 0 0.75rem 0;
                                    font-size: 1rem;
                                    font-weight: 600;
                    }

                                    .history-list {
                                        display: flex;
                                    flex-direction: column;
                                    gap: 0.5rem;
                                    max-height: 200px;
                                    overflow-y: auto;
                    }

                                    .history-item {
                                        background: white;
                                    border-radius: 8px;
                                    padding: 0.75rem;
                                    border-left: 3px solid #f59e0b;
                    }

                                    .dark .history-item {
                                        background: #334155;
                    }

                                    .history-main {
                                        display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    margin-bottom: 0.25rem;
                    }

                                    .history-metros {
                                        font - weight: 700;
                                    color: #ef4444;
                                    font-size: 1.1rem;
                    }

                                    .history-tipo {
                                        font - size: 0.75rem;
                                    background: #e2e8f0;
                                    padding: 0.15rem 0.5rem;
                                    border-radius: 10px;
                                    text-transform: uppercase;
                    }

                                    .dark .history-tipo {
                                        background: #475569;
                    }

                                    .history-details {
                                        display: flex;
                                    justify-content: space-between;
                                    font-size: 0.8rem;
                                    color: #64748b;
                    }

                                    .history-obs {
                                        font - size: 0.8rem;
                                    color: #64748b;
                                    margin-top: 0.25rem;
                                    font-style: italic;
                    }

                                    .retalhos-section {
                                        border - top: 2px solid #e2e8f0;
                                    padding-top: 1rem;
                    }

                                    .dark .retalhos-section {
                                        border - top - color: #334155;
                    }

                                    .retalho-item {
                                        border - left - color: #22c55e;
                    }

                                    .parent-item {
                                        border - left - color: #3b82f6;
                    }

                                    .history-tipo.status-disponivel,
                                    .history-tipo.status-ativa {
                                        background: #dcfce7;
                                    color: #166534;
                    }

                                    .history-tipo.status-usado,
                                    .history-tipo.status-finalizada {
                                        background: #fef3c7;
                                    color: #92400e;
                    }

                                    .history-tipo.status-descartado,
                                    .history-tipo.status-descartada {
                                        background: #fee2e2;
                                    color: #991b1b;
                    }

                                    .dark .history-tipo.status-disponivel,
                                    .dark .history-tipo.status-ativa {
                                        background: #064e3b;
                                    color: #dcfce7;
                    }

                                    .loading-container {
                                        display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    padding: 3rem 1rem;
                                    gap: 1rem;
                                    color: #64748b;
                    }

                                    .spinner {
                                        width: 40px;
                                    height: 40px;
                                    border: 4px solid #e2e8f0;
                                    border-top-color: #3b82f6;
                                    border-radius: 50%;
                                    animation: spin 1s linear infinite;
                    }

                                    @keyframes spin {
                                        to {transform: rotate(360deg); }
                    }

                                    .empty-history {
                                        padding: 1rem;
                                    text-align: center;
                                    color: #94a3b8;
                                    font-style: italic;
                                    font-size: 0.9rem;
                                    background: #f8fafc;
                                    border-radius: 8px;
                    }

                                    .dark .empty-history {
                                        background: #1e293b;
                                    color: #64748b;
                    }

                                    .action-buttons {
                                        display: flex;
                                    gap: 0.75rem;
                                    margin-top: 0.5rem;
                    }

                                    .action-buttons button {
                                        flex: 1;
                    }

                                    .consumo-form {
                                        background: #f8fafc;
                                    border-radius: 12px;
                                    padding: 1rem;
                    }

                                    .dark .consumo-form {
                                        background: #1e293b;
                    }

                                    .consumo-form h4 {
                                        margin: 0 0 0.25rem 0;
                    }

                                    .form-subtitle {
                                        color: #64748b;
                                    font-size: 0.9rem;
                                    margin-bottom: 1rem;
                    }

                                    .form-group {
                                        margin - bottom: 1rem;
                    }

                                    .form-group label {
                                        display: block;
                                    margin-bottom: 0.5rem;
                                    font-weight: 500;
                                    font-size: 0.9rem;
                    }

                                    .form-group input,
                                    .form-group select,
                                    .form-group textarea {
                                        width: 100%;
                                    padding: 0.75rem;
                                    border: 1px solid #e2e8f0;
                                    border-radius: 8px;
                                    font-size: 1rem;
                                    background: white;
                    }

                                    .dark .form-group input,
                                    .dark .form-group select,
                                    .dark .form-group textarea {
                                        background: #334155;
                                    border-color: #475569;
                                    color: white;
                    }

                                    .form-row {
                                        display: grid;
                                    grid-template-columns: 1fr 1fr;
                                    gap: 1rem;
                    }

                                    .form-actions {
                                        display: flex;
                                    gap: 1rem;
                                    margin-top: 1rem;
                    }

                                    .form-actions button {
                                        flex: 1;
                    }

                                    .btn-primary {
                                        background: #3b82f6;
                                    color: white;
                                    border: none;
                                    padding: 0.75rem 1.5rem;
                                    border-radius: 8px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    transition: background 0.2s;
                    }

                                    .btn-primary:hover {
                                        background: #2563eb;
                    }

                                    .btn-primary:disabled {
                                        background: #94a3b8;
                                    cursor: not-allowed;
                    }

                                    .btn-secondary {
                                        background: #e2e8f0;
                                    color: #1e293b;
                                    border: none;
                                    padding: 0.75rem 1.5rem;
                                    border-radius: 8px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    transition: background 0.2s;
                    }

                                    .dark .btn-secondary {
                                        background: #475569;
                                    color: white;
                    }

                                    .btn-secondary:hover {
                                        background: #cbd5e1;
                    }

                                    .dark .btn-secondary:hover {
                                        background: #64748b;
                    }
                `}</style>
        </div>
    );
};

export default QRScannerModal;
