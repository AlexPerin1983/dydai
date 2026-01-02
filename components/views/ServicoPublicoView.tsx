import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

interface ServicoData {
    id: number;
    codigo_qr: string;
    cliente_nome: string;
    endereco?: string;
    cidade?: string;
    uf?: string;
    tipo_local?: string;
    filme_aplicado: string;
    filme_detalhes?: {
        uv?: number;
        ir?: number;
        vtl?: number;
        garantiaFabricante?: number;
        garantiaMaoDeObra?: number;
        espessura?: number;
        tser?: number;
    };
    metros_aplicados?: number;
    data_servico: string;
    observacoes?: string;
    empresa_nome: string;
    empresa_telefone?: string;
    empresa_email?: string;
    empresa_site?: string;
    empresa_endereco?: string;
    empresa_logo?: string;
    empresa_cores?: {
        primaria?: string;
        secundaria?: string;
    };
}

const ServicoPublicoView: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ServicoData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string>('');

    useEffect(() => {
        // Pegar o código QR da URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('servico') || params.get('s') || '';
        setQrCode(code);

        if (code) {
            fetchData(code);
        } else {
            setLoading(false);
            setError('Código de serviço não informado');
        }
    }, []);

    const fetchData = async (code: string) => {
        console.log('--- Debug ServicoPublicoView ---');
        console.log('Código recebido:', code);

        setLoading(true);
        setError(null);

        try {
            const { data: servico, error: servicoError } = await supabase
                .from('servicos_prestados')
                .select('*')
                .eq('codigo_qr', code)
                .limit(1)
                .maybeSingle();

            console.log('Resultado Serviço:', { servico, servicoError });

            if (servicoError) {
                console.error('Erro Supabase:', servicoError);
                setError('Erro ao buscar informações do serviço.');
                setLoading(false);
                return;
            }

            if (servico) {
                setData({
                    id: servico.id,
                    codigo_qr: servico.codigo_qr,
                    cliente_nome: servico.cliente_nome,
                    endereco: servico.endereco,
                    cidade: servico.cidade,
                    uf: servico.uf,
                    tipo_local: servico.tipo_local,
                    filme_aplicado: servico.filme_aplicado,
                    filme_detalhes: servico.filme_detalhes,
                    metros_aplicados: servico.metros_aplicados,
                    data_servico: servico.data_servico,
                    observacoes: servico.observacoes,
                    empresa_nome: servico.empresa_nome,
                    empresa_telefone: servico.empresa_telefone,
                    empresa_email: servico.empresa_email,
                    empresa_site: servico.empresa_site,
                    empresa_endereco: servico.empresa_endereco,
                    empresa_logo: servico.empresa_logo,
                    empresa_cores: servico.empresa_cores
                });
            } else {
                setError('Serviço não encontrado no sistema.');
            }

            setLoading(false);
        } catch (err: any) {
            console.error('Erro geral:', err);
            setError(`Erro interno: ${err.message}`);
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getTipoLocalInfo = (tipo?: string) => {
        const t = tipo?.toLowerCase() || '';
        switch (t) {
            case 'residencial': return { label: 'Residência', icon: '🏠' };
            case 'comercial': return { label: 'Comercial', icon: '🏢' };
            case 'condominio': return { label: 'Condomínio', icon: '🏘️' };
            case 'empresa': return { label: 'Empresa', icon: '🏭' };
            default: return { label: tipo || 'Local', icon: '📍' };
        }
    };

    const handleWhatsApp = () => {
        if (data?.empresa_telefone) {
            const phone = data.empresa_telefone.replace(/\D/g, '');
            const message = encodeURIComponent(
                `Olá! Vi o serviço de película aplicado no ${data.cliente_nome} e gostaria de solicitar um orçamento.`
            );
            window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
        }
    };

    const handleEmail = () => {
        if (data?.empresa_email) {
            const subject = encodeURIComponent('Solicitação de Orçamento - Película');
            const body = encodeURIComponent(
                `Olá!\n\nVi o serviço de película aplicado no ${data.cliente_nome} e gostaria de solicitar um orçamento.\n\nAguardo retorno.`
            );
            window.open(`mailto:${data.empresa_email}?subject=${subject}&body=${body}`, '_blank');
        }
    };

    const handleCall = () => {
        if (data?.empresa_telefone) {
            window.open(`tel:${data.empresa_telefone}`, '_blank');
        }
    };

    const primaryColor = data?.empresa_cores?.primaria || '#3b82f6';

    return (
        <div className="servico-publico-page">
            <div className="container">
                {/* Header com Logo da Empresa */}
                <div className="header">
                    {data?.empresa_logo ? (
                        <img src={data.empresa_logo} alt={data.empresa_nome} className="empresa-logo" />
                    ) : (
                        <div className="logo-placeholder" style={{ backgroundColor: primaryColor }}>
                            {data?.empresa_nome?.charAt(0) || '🎞️'}
                        </div>
                    )}
                    <div className="empresa-nome">{data?.empresa_nome || 'Películas Profissionais'}</div>
                    <div className="subtitle">Serviço de Aplicação de Película</div>
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
                    <>
                        {/* Card Principal do Serviço */}
                        <div className="servico-card">
                            {/* Banner de Identificação */}
                            <div className="id-banner" style={{ backgroundColor: primaryColor }}>
                                <span className="id-icon">✅</span>
                                <span className="id-text">Serviço Verificado</span>
                            </div>

                            {/* Tipo de Local */}
                            <div className="local-type">
                                <span className="local-icon">{getTipoLocalInfo(data.tipo_local).icon}</span>
                                <span className="local-text">{getTipoLocalInfo(data.tipo_local).label}</span>
                            </div>

                            {/* Nome do Local */}
                            <h1 className="local-name">{data.cliente_nome}</h1>

                            {/* Endereço */}
                            {(data.endereco || data.cidade) && (
                                <p className="local-address">
                                    {data.endereco}{data.cidade && `, ${data.cidade}`}{data.uf && ` - ${data.uf}`}
                                </p>
                            )}

                            {/* Película Aplicada */}
                            <div className="film-section">
                                <h3>🎞️ Película Aplicada</h3>
                                <div className="film-name">{data.filme_aplicado}</div>

                                {/* Especificações Técnicas */}
                                {data.filme_detalhes && (
                                    <div className="specs-grid">
                                        {data.filme_detalhes.uv && (
                                            <div className="spec-item">
                                                <span className="spec-label">Proteção UV</span>
                                                <span className="spec-value">{data.filme_detalhes.uv}%</span>
                                            </div>
                                        )}
                                        {data.filme_detalhes.ir && (
                                            <div className="spec-item">
                                                <span className="spec-label">Rejeição IR</span>
                                                <span className="spec-value">{data.filme_detalhes.ir}%</span>
                                            </div>
                                        )}
                                        {data.filme_detalhes.vtl && (
                                            <div className="spec-item">
                                                <span className="spec-label">Luz Visível</span>
                                                <span className="spec-value">{data.filme_detalhes.vtl}%</span>
                                            </div>
                                        )}
                                        {data.filme_detalhes.garantiaFabricante && (
                                            <div className="spec-item">
                                                <span className="spec-label">Garantia Fab.</span>
                                                <span className="spec-value">{data.filme_detalhes.garantiaFabricante} anos</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Área Aplicada e Data */}
                            <div className="info-row">
                                {data.metros_aplicados && (
                                    <div className="info-item-small">
                                        <span className="label">📐 Área</span>
                                        <span className="value">{data.metros_aplicados.toFixed(2)} m²</span>
                                    </div>
                                )}
                                <div className="info-item-small">
                                    <span className="label">📅 Data</span>
                                    <span className="value">{formatDate(data.data_servico)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Card de Manutenção / Padronização */}
                        <div className="maintenance-card">
                            <h3>⚠️ Importante: Mantenha o Padrão</h3>
                            <p>
                                Para garantir a <strong>uniformidade visual</strong> e evitar diferenças de tonalidade,
                                desbotamento irregular ou variação de cores, é essencial que futuras aplicações
                                utilizem o <strong>mesmo modelo de película</strong>.
                            </p>
                            <div className="film-reminder">
                                <span className="reminder-label">Película deste local:</span>
                                <span className="reminder-value">{data.filme_aplicado}</span>
                            </div>
                            <p className="small-text">
                                Entre em contato conosco para garantir a continuidade do padrão aplicado.
                            </p>
                        </div>

                        {/* Card de Contato */}
                        <div className="contact-card">
                            <h3>📞 Solicite um Orçamento</h3>
                            <p className="contact-intro">
                                Gostou do resultado? Faça seu orçamento sem compromisso!
                            </p>

                            <div className="contact-buttons">
                                {data.empresa_telefone && (
                                    <button
                                        className="contact-btn whatsapp"
                                        onClick={handleWhatsApp}
                                    >
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                        WhatsApp
                                    </button>
                                )}
                                {data.empresa_telefone && (
                                    <button
                                        className="contact-btn phone"
                                        onClick={handleCall}
                                    >
                                        📱 Ligar
                                    </button>
                                )}
                                {data.empresa_email && (
                                    <button
                                        className="contact-btn email"
                                        onClick={handleEmail}
                                    >
                                        ✉️ E-mail
                                    </button>
                                )}
                            </div>

                            {/* Info da Empresa */}
                            <div className="empresa-info">
                                <div className="empresa-name">{data.empresa_nome}</div>
                                {data.empresa_endereco && (
                                    <div className="empresa-address">{data.empresa_endereco}</div>
                                )}
                                {data.empresa_site && (
                                    <a href={data.empresa_site.startsWith('http') ? data.empresa_site : `https://${data.empresa_site}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="empresa-site">
                                        🌐 {data.empresa_site}
                                    </a>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Footer */}
                <div className="footer">
                    <p>Sistema de Rastreabilidade de Serviços</p>
                    <p className="small">Código: {qrCode}</p>
                </div>
            </div>

            <style>{`
                .servico-publico-page {
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

                .empresa-logo {
                    width: 80px;
                    height: 80px;
                    object-fit: contain;
                    border-radius: 16px;
                    background: white;
                    padding: 8px;
                    margin-bottom: 0.75rem;
                }

                .logo-placeholder {
                    width: 80px;
                    height: 80px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    color: white;
                    font-weight: 700;
                    margin: 0 auto 0.75rem;
                }

                .empresa-nome {
                    font-size: 1.5rem;
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

                .servico-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    margin-bottom: 1rem;
                }

                .id-banner {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    color: white;
                    font-weight: 600;
                }

                .id-icon {
                    font-size: 1.25rem;
                }

                .local-type {
                    text-align: center;
                    padding: 1rem 1rem 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    color: #64748b;
                    font-size: 0.9rem;
                }

                .local-icon {
                    font-size: 1.25rem;
                }

                .local-name {
                    text-align: center;
                    margin: 0.5rem 0 0.25rem;
                    padding: 0 1rem;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .local-address {
                    text-align: center;
                    color: #64748b;
                    font-size: 0.85rem;
                    margin: 0 0 1rem 0;
                    padding: 0 1rem;
                }

                .film-section {
                    background: #f0f9ff;
                    padding: 1.25rem;
                    margin: 0 1rem 1rem;
                    border-radius: 12px;
                }

                .film-section h3 {
                    margin: 0 0 0.75rem 0;
                    font-size: 0.9rem;
                    color: #0369a1;
                }

                .film-name {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #0c4a6e;
                    margin-bottom: 1rem;
                }

                .specs-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                }

                .spec-item {
                    display: flex;
                    flex-direction: column;
                    background: white;
                    padding: 0.75rem;
                    border-radius: 8px;
                }

                .spec-label {
                    font-size: 0.7rem;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .spec-value {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #0c4a6e;
                }

                .info-row {
                    display: flex;
                    justify-content: center;
                    gap: 2rem;
                    padding: 1rem 1.5rem 1.5rem;
                }

                .info-item-small {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .info-item-small .label {
                    font-size: 0.75rem;
                    color: #64748b;
                }

                .info-item-small .value {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1e293b;
                }

                .maintenance-card {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                    border: 1px solid #f59e0b;
                }

                .maintenance-card h3 {
                    margin: 0 0 0.75rem 0;
                    color: #92400e;
                    font-size: 1rem;
                }

                .maintenance-card p {
                    color: #78350f;
                    font-size: 0.9rem;
                    margin: 0 0 1rem 0;
                    line-height: 1.5;
                }

                .film-reminder {
                    background: white;
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    margin-bottom: 0.75rem;
                }

                .reminder-label {
                    font-size: 0.75rem;
                    color: #92400e;
                }

                .reminder-value {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #78350f;
                }

                .small-text {
                    font-size: 0.8rem !important;
                    margin-bottom: 0 !important;
                }

                .contact-card {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                    text-align: center;
                }

                .contact-card h3 {
                    margin: 0 0 0.5rem 0;
                    color: #1e293b;
                }

                .contact-intro {
                    color: #64748b;
                    font-size: 0.9rem;
                    margin: 0 0 1.25rem 0;
                }

                .contact-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                    justify-content: center;
                    margin-bottom: 1.5rem;
                }

                .contact-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1.25rem;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    border: none;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .contact-btn:active {
                    transform: scale(0.98);
                }

                .contact-btn.whatsapp {
                    background: #25d366;
                    color: white;
                    flex: 1;
                    justify-content: center;
                }

                .contact-btn.phone {
                    background: #3b82f6;
                    color: white;
                }

                .contact-btn.email {
                    background: #64748b;
                    color: white;
                }

                .empresa-info {
                    padding-top: 1rem;
                    border-top: 1px solid #e2e8f0;
                }

                .empresa-name {
                    font-weight: 600;
                    color: #1e293b;
                }

                .empresa-address {
                    color: #64748b;
                    font-size: 0.85rem;
                    margin-top: 0.25rem;
                }

                .empresa-site {
                    display: inline-block;
                    color: #3b82f6;
                    text-decoration: none;
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                }

                .footer {
                    text-align: center;
                    padding: 1.5rem;
                    color: #64748b;
                }

                .footer p {
                    margin: 0;
                    font-size: 0.85rem;
                }

                .footer .small {
                    font-size: 0.75rem;
                    color: #475569;
                    font-family: monospace;
                    margin-top: 0.25rem;
                }
            `}</style>
        </div>
    );
};

export default ServicoPublicoView;
