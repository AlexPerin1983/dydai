import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

interface PublicRetalhoData {
    id: number;
    codigoQr: string;
    larguraCm: number;
    comprimentoCm: number;
    status: string;
}

interface PublicEstoqueData {
    id?: number;
    tipo: 'bobina' | 'retalho';
    filmId: string;
    codigoQr: string;
    larguraCm: number;
    comprimentoTotalM?: number;
    comprimentoRestanteM?: number;
    comprimentoCm?: number;
    areaM2?: number;
    status: string;
    localizacao?: string;
    dataCadastro: string;
    retalhosAssociados?: PublicRetalhoData[];
}

const EstoquePublicoView: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<PublicEstoqueData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string>('');

    useEffect(() => {
        // Pegar o código QR da URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('qr') || params.get('code') || '';
        setQrCode(code);

        if (code) {
            fetchData(code);
        } else {
            setLoading(false);
            setError('Código QR não informado');
        }
    }, []);

    const fetchData = async (code: string) => {
        console.log('--- Debug EstoquePublicoView ---');
        console.log('Código recebido:', code);

        setLoading(true);
        setError(null);

        try {
            // Buscar na tabela de bobinas (consulta pública - sem user_id check)
            console.log('Tentando buscar na tabela bobinas...');
            const { data: bobina, error: bobinaError } = await supabase
                .from('bobinas')
                .select('id, film_id, codigo_qr, largura_cm, comprimento_total_m, comprimento_restante_m, status, localizacao, data_cadastro')
                .eq('codigo_qr', code)
                .limit(1)
                .maybeSingle();

            console.log('Resultado Bobina:', { bobina, bobinaError });

            if (bobinaError) {
                console.error('Erro Supabase Bobina:', bobinaError);
            }

            if (bobina) {
                // Se achou a bobina, busca os retalhos associados
                const { data: retalhosData } = await supabase
                    .from('retalhos')
                    .select('id, codigo_qr, largura_cm, comprimento_cm, status')
                    .eq('bobina_id', bobina.id)
                    .order('data_cadastro', { ascending: false });

                const retalhosAssociados: PublicRetalhoData[] = (retalhosData || []).map((r: any) => ({
                    id: r.id,
                    codigoQr: r.codigo_qr,
                    larguraCm: r.largura_cm,
                    comprimentoCm: r.comprimento_cm,
                    status: r.status
                }));

                setData({
                    id: bobina.id,
                    tipo: 'bobina',
                    filmId: bobina.film_id,
                    codigoQr: bobina.codigo_qr,
                    larguraCm: bobina.largura_cm,
                    comprimentoTotalM: bobina.comprimento_total_m,
                    comprimentoRestanteM: bobina.comprimento_restante_m,
                    status: bobina.status,
                    localizacao: bobina.localizacao,
                    dataCadastro: bobina.data_cadastro,
                    retalhosAssociados
                });
                setLoading(false);
                return;
            }

            // Buscar na tabela de retalhos
            const { data: retalho, error: retalhoError } = await supabase
                .from('retalhos')
                .select('id, film_id, codigo_qr, largura_cm, comprimento_cm, area_m2, status, localizacao, data_cadastro')
                .eq('codigo_qr', code)
                .limit(1)
                .maybeSingle();

            if (retalho && !retalhoError) {
                setData({
                    id: retalho.id,
                    tipo: 'retalho',
                    filmId: retalho.film_id,
                    codigoQr: retalho.codigo_qr,
                    larguraCm: retalho.largura_cm,
                    comprimentoCm: retalho.comprimento_cm,
                    areaM2: retalho.area_m2,
                    status: retalho.status,
                    localizacao: retalho.localizacao,
                    dataCadastro: retalho.data_cadastro
                });
                setLoading(false);
                return;
            }

            if (bobinaError || retalhoError) {
                const errorMsg = `Erro: ${bobinaError?.message || ''} ${retalhoError?.message || ''}`;
                setError(errorMsg);
            } else {
                setError('Item não encontrado no sistema.');
            }
            setLoading(false);
        } catch (err: any) {
            console.error('Erro geral:', err);
            setError(`Erro interno: ${err.message}`);
            setLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        const s = status?.toLowerCase() || '';
        switch (s) {
            case 'ativa':
            case 'disponivel':
                return { label: 'Disponível', icon: '✅', color: '#22c55e' };
            case 'finalizada':
            case 'usado':
                return { label: 'Finalizado', icon: '⚠️', color: '#f59e0b' };
            case 'descartada':
            case 'descartado':
                return { label: 'Descartado', icon: '❌', color: '#ef4444' };
            case 'reservado':
                return { label: 'Reservado', icon: '🔒', color: '#3b82f6' };
            default:
                return { label: status || 'Desconhecido', icon: '📦', color: '#64748b' };
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="public-estoque-page">
            <div className="container">
                {/* Header */}
                <div className="header">
                    <div className="logo">📦 Películas BR</div>
                    <div className="subtitle">Consulta de Material</div>
                </div>

                {/* Content */}
                {loading && (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Carregando informações...</p>
                    </div>
                )}

                {error && (
                    <div className="error-card">
                        <div className="error-icon">❌</div>
                        <h2>Não encontrado</h2>
                        <p>{error}</p>
                        {qrCode && <p className="qr-code">{qrCode}</p>}
                    </div>
                )}

                {data && (
                    <div className="material-card">
                        {/* Status Badge */}
                        <div
                            className="status-banner"
                            style={{ backgroundColor: getStatusInfo(data.status).color }}
                        >
                            <span className="status-icon">{getStatusInfo(data.status).icon}</span>
                            <span className="status-text">{getStatusInfo(data.status).label}</span>
                        </div>

                        {/* Tipo */}
                        <div className="material-type">
                            {data.tipo === 'bobina' ? '🎞️ Bobina' : '✂️ Retalho'}
                        </div>

                        {/* Nome da película */}
                        <h1 className="film-name">{data.filmId}</h1>

                        {/* Info Grid */}
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Código</span>
                                <span className="value code">{data.codigoQr}</span>
                            </div>

                            <div className="info-item">
                                <span className="label">Largura</span>
                                <span className="value">{data.larguraCm} cm</span>
                            </div>

                            {data.tipo === 'bobina' && (
                                <>
                                    <div className="info-item">
                                        <span className="label">Comprimento Total</span>
                                        <span className="value">{data.comprimentoTotalM} m</span>
                                    </div>
                                    <div className="info-item highlight">
                                        <span className="label">🎯 Material Restante</span>
                                        <span className="value large">{data.comprimentoRestanteM?.toFixed(2)} m</span>
                                    </div>
                                </>
                            )}

                            {data.tipo === 'retalho' && (
                                <>
                                    <div className="info-item">
                                        <span className="label">Comprimento</span>
                                        <span className="value">{data.comprimentoCm} cm</span>
                                    </div>
                                    <div className="info-item highlight">
                                        <span className="label">📐 Área</span>
                                        <span className="value large">{data.areaM2?.toFixed(2)} m²</span>
                                    </div>
                                </>
                            )}

                            {data.localizacao && (
                                <div className="info-item highlight">
                                    <span className="label">📍 Localização</span>
                                    <span className="value large">{data.localizacao}</span>
                                </div>
                            )}

                            <div className="info-item">
                                <span className="label">Cadastrado em</span>
                                <span className="value">{formatDate(data.dataCadastro)}</span>
                            </div>
                        </div>

                        {/* Progress bar for bobinas */}
                        {data.tipo === 'bobina' && data.comprimentoTotalM && data.comprimentoRestanteM && (
                            <div className="progress-section">
                                <div className="progress-header">
                                    <span>Utilização</span>
                                    <span>{((1 - data.comprimentoRestanteM / data.comprimentoTotalM) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${(data.comprimentoRestanteM / data.comprimentoTotalM) * 100}%`,
                                            backgroundColor: data.comprimentoRestanteM / data.comprimentoTotalM > 0.3
                                                ? '#22c55e'
                                                : '#f59e0b'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Lista de Retalhos Associados */}
                        {data.retalhosAssociados && data.retalhosAssociados.length > 0 && (
                            <div className="retalhos-section">
                                <h3>✂️ Retalhos Associados ({data.retalhosAssociados.length})</h3>
                                <div className="retalhos-list">
                                    {data.retalhosAssociados.map(retalho => (
                                        <div key={retalho.id} className="retalho-item">
                                            <div className="retalho-info">
                                                <span className="retalho-dims">{retalho.larguraCm}cm x {retalho.comprimentoCm}cm</span>
                                                <span className="retalho-qr">{retalho.codigoQr}</span>
                                            </div>
                                            <span className={`retalho-status status-${retalho.status}`}>
                                                {retalho.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="footer">

                    <p>Sistema de Controle de Estoque</p>
                    <a href="/" className="login-link">Fazer login para mais detalhes →</a>
                </div>
            </div>

            <style>{`
                .retalhos-section {
                    margin-top: 2rem;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 1.5rem;
                }

                .retalhos-section h3 {
                    font-size: 1.1rem;
                    color: #1e293b;
                    margin-bottom: 1rem;
                    text-align: center;
                    font-weight: 600;
                }

                .retalhos-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    max-height: 300px;
                    overflow-y: auto;
                }

                .retalho-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }

                .retalho-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .retalho-dims {
                    font-weight: 600;
                    color: #334155;
                    font-size: 0.95rem;
                }

                .retalho-qr {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    font-family: monospace;
                }

                .retalho-status {
                    font-size: 0.75rem;
                    padding: 0.25rem 0.75rem;
                    border-radius: 999px;
                    font-weight: 600;
                    text-transform: capitalize;
                }

                .status-disponivel { background: #dcfce7; color: #166534; }
                .status-usado { background: #ffedd5; color: #9a3412; }
                .status-descartado { background: #fee2e2; color: #991b1b; }
                .status-reservado { background: #fef9c3; color: #854d0e; }

                .public-estoque-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    padding: 1rem;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .container {
                    max-width: 500px;
                    margin: 0 auto;
                }

                .header {
                    text-align: center;
                    padding: 2rem 0;
                }

                .logo {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 0.25rem;
                }

                .subtitle {
                    color: #94a3b8;
                    font-size: 0.9rem;
                }

                .loading {
                    text-align: center;
                    padding: 3rem;
                    color: white;
                }

                .spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid #334155;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .error-card {
                    background: #1e293b;
                    border-radius: 16px;
                    padding: 2rem;
                    text-align: center;
                    color: white;
                }

                .error-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .error-card h2 {
                    margin: 0 0 0.5rem 0;
                }

                .error-card p {
                    color: #94a3b8;
                    margin: 0;
                }

                .qr-code {
                    font-family: monospace;
                    color: #64748b;
                    font-size: 0.85rem;
                    margin-top: 1rem !important;
                }

                .material-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .status-banner {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    color: white;
                    font-weight: 600;
                }

                .status-icon {
                    font-size: 1.25rem;
                }

                .material-type {
                    text-align: center;
                    padding: 1rem 1rem 0;
                    color: #64748b;
                    font-size: 0.9rem;
                }

                .film-name {
                    text-align: center;
                    margin: 0.5rem 0 1.5rem;
                    padding: 0 1rem;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    padding: 0 1.5rem;
                }

                .info-item {
                    display: flex;
                    flex-direction: column;
                }

                .info-item .label {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin-bottom: 0.25rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .info-item .value {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1e293b;
                }

                .info-item .value.code {
                    font-family: monospace;
                    font-size: 0.8rem;
                    color: #3b82f6;
                }

                .info-item .value.large {
                    font-size: 1.5rem;
                    color: #3b82f6;
                }

                .info-item.highlight {
                    grid-column: 1 / -1;
                    background: #f0f9ff;
                    padding: 1rem;
                    border-radius: 12px;
                    text-align: center;
                }

                .progress-section {
                    padding: 1.5rem;
                    border-top: 1px solid #e2e8f0;
                    margin-top: 1.5rem;
                }

                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                    color: #64748b;
                }

                .progress-bar {
                    height: 12px;
                    background: #e2e8f0;
                    border-radius: 6px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    transition: width 0.5s ease;
                    border-radius: 6px;
                }

                .footer {
                    text-align: center;
                    padding: 2rem;
                    color: #64748b;
                }

                .footer p {
                    margin: 0 0 0.5rem 0;
                    font-size: 0.85rem;
                }

                .login-link {
                    color: #3b82f6;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.9rem;
                }

                .login-link:hover {
                    text-decoration: underline;
                }

                .manage-btn {
                    display: inline-block;
                    background: #3b82f6;
                    color: white;
                    text-decoration: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5);
                    transition: transform 0.2s;
                }

                .manage-btn:active {
                    transform: scale(0.98);
                }
            `}</style>
        </div>
    );
};

export default EstoquePublicoView;
