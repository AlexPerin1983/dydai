import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

interface PublicEstoqueData {
    tipo: 'bobina' | 'retalho';
    filmId: string;
    codigoQr: string;
    larguraCm: number;
    comprimentoTotalM?: number;
    comprimentoRestanteM?: number;
    comprimentoCm?: number;
    areaM2?: number;
    status: string;
    dataCadastro: string;
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
        setLoading(true);
        setError(null);

        try {
            // Buscar na tabela de bobinas (consulta pública - sem user_id check)
            // Nota: Isso requer uma policy especial ou service role
            const { data: bobina, error: bobinaError } = await supabase
                .from('bobinas')
                .select('film_id, codigo_qr, largura_cm, comprimento_total_m, comprimento_restante_m, status, data_cadastro')
                .eq('codigo_qr', code)
                .single();

            if (bobina && !bobinaError) {
                setData({
                    tipo: 'bobina',
                    filmId: bobina.film_id,
                    codigoQr: bobina.codigo_qr,
                    larguraCm: bobina.largura_cm,
                    comprimentoTotalM: bobina.comprimento_total_m,
                    comprimentoRestanteM: bobina.comprimento_restante_m,
                    status: bobina.status,
                    dataCadastro: bobina.data_cadastro
                });
                setLoading(false);
                return;
            }

            // Buscar na tabela de retalhos
            const { data: retalho, error: retalhoError } = await supabase
                .from('retalhos')
                .select('film_id, codigo_qr, largura_cm, comprimento_cm, area_m2, status, data_cadastro')
                .eq('codigo_qr', code)
                .single();

            if (retalho && !retalhoError) {
                setData({
                    tipo: 'retalho',
                    filmId: retalho.film_id,
                    codigoQr: retalho.codigo_qr,
                    larguraCm: retalho.largura_cm,
                    comprimentoCm: retalho.comprimento_cm,
                    areaM2: retalho.area_m2,
                    status: retalho.status,
                    dataCadastro: retalho.data_cadastro
                });
                setLoading(false);
                return;
            }

            setError('Material não encontrado. Verifique se o código está correto.');
        } catch (err) {
            console.error('Erro ao buscar dados:', err);
            setError('Erro ao carregar informações');
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        const statusMap: Record<string, { label: string; color: string; icon: string }> = {
            'ativa': { label: 'Disponível', color: '#22c55e', icon: '✅' },
            'disponivel': { label: 'Disponível', color: '#22c55e', icon: '✅' },
            'finalizada': { label: 'Finalizada', color: '#f59e0b', icon: '⚠️' },
            'usado': { label: 'Usado', color: '#f59e0b', icon: '⚠️' },
            'descartada': { label: 'Descartado', color: '#ef4444', icon: '❌' },
            'descartado': { label: 'Descartado', color: '#ef4444', icon: '❌' }
        };
        return statusMap[status] || { label: status, color: '#64748b', icon: '📦' };
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
                    </div>
                )}

                {/* Footer */}
                <div className="footer">
                    <p>Sistema de Controle de Estoque</p>
                    <a href="/" className="login-link">Fazer login para mais detalhes →</a>
                </div>
            </div>

            <style>{`
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
            `}</style>
        </div>
    );
};

export default EstoquePublicoView;
