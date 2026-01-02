// Serviço para gerenciar serviços prestados
// Usado para gerar QR Codes em locais onde foi prestado serviço

import { supabase } from './supabaseClient';
import { UserInfo, Film } from '../types';

export interface ServicoPrestado {
    id?: number;
    user_id?: string;
    codigo_qr: string;

    // Dados do cliente/local
    cliente_nome: string;
    endereco?: string;
    cidade?: string;
    uf?: string;
    tipo_local?: 'residencial' | 'comercial' | 'condominio' | 'empresa' | 'outros';

    // Dados do serviço
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
    data_servico?: string;
    observacoes?: string;

    // Dados da empresa (snapshot)
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

    // Metadata
    created_at?: string;
    updated_at?: string;
}

// Gerar código único para o serviço
export function gerarCodigoServico(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SVC-${timestamp}-${random}`;
}

// Criar snapshot da empresa a partir do UserInfo
export function criarSnapshotEmpresa(userInfo: UserInfo): Partial<ServicoPrestado> {
    return {
        empresa_nome: userInfo.empresa || userInfo.nome,
        empresa_telefone: userInfo.telefone,
        empresa_email: userInfo.email,
        empresa_site: userInfo.site,
        empresa_endereco: userInfo.endereco,
        empresa_logo: userInfo.logo,
        empresa_cores: userInfo.cores
    };
}

// Criar detalhes do filme a partir do Film
export function criarDetalhesFilme(film: Film): ServicoPrestado['filme_detalhes'] {
    return {
        uv: film.uv,
        ir: film.ir,
        vtl: film.vtl,
        garantiaFabricante: film.garantiaFabricante,
        garantiaMaoDeObra: film.garantiaMaoDeObra,
        espessura: film.espessura,
        tser: film.tser
    };
}

// Helper para obter user_id atual
async function getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function getAllServicosPrestados(): Promise<ServicoPrestado[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
        .from('servicos_prestados')
        .select('*')
        .eq('user_id', userId)
        .order('data_servico', { ascending: false });

    if (error) {
        console.error('Erro ao buscar serviços prestados:', error);
        return [];
    }

    return data.map(mapRowToServico);
}

export async function getServicoByCodigo(codigo: string): Promise<ServicoPrestado | null> {
    const { data, error } = await supabase
        .from('servicos_prestados')
        .select('*')
        .eq('codigo_qr', codigo)
        .limit(1)
        .maybeSingle();

    if (error || !data) {
        console.error('Erro ao buscar serviço:', error);
        return null;
    }

    return mapRowToServico(data);
}

export async function saveServicoPrestado(servico: ServicoPrestado): Promise<ServicoPrestado | null> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('Usuário não autenticado');
        return null;
    }

    const row = {
        user_id: userId,
        codigo_qr: servico.codigo_qr,
        cliente_nome: servico.cliente_nome,
        endereco: servico.endereco || null,
        cidade: servico.cidade || null,
        uf: servico.uf || null,
        tipo_local: servico.tipo_local || 'outros',
        filme_aplicado: servico.filme_aplicado,
        filme_detalhes: servico.filme_detalhes || null,
        metros_aplicados: servico.metros_aplicados || null,
        data_servico: servico.data_servico || new Date().toISOString(),
        observacoes: servico.observacoes || null,
        empresa_nome: servico.empresa_nome,
        empresa_telefone: servico.empresa_telefone || null,
        empresa_email: servico.empresa_email || null,
        empresa_site: servico.empresa_site || null,
        empresa_endereco: servico.empresa_endereco || null,
        empresa_logo: servico.empresa_logo || null,
        empresa_cores: servico.empresa_cores || null
    };

    if (servico.id) {
        // Update
        const { data, error } = await supabase
            .from('servicos_prestados')
            .update(row)
            .eq('id', servico.id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar serviço:', error);
            return null;
        }

        return mapRowToServico(data);
    } else {
        // Insert
        const { data, error } = await supabase
            .from('servicos_prestados')
            .insert(row)
            .select()
            .single();

        if (error) {
            console.error('Erro ao salvar serviço:', error);
            return null;
        }

        return mapRowToServico(data);
    }
}

export async function deleteServicoPrestado(id: number): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
        .from('servicos_prestados')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        console.error('Erro ao deletar serviço:', error);
        return false;
    }

    return true;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapRowToServico(row: any): ServicoPrestado {
    return {
        id: row.id,
        user_id: row.user_id,
        codigo_qr: row.codigo_qr,
        cliente_nome: row.cliente_nome,
        endereco: row.endereco,
        cidade: row.cidade,
        uf: row.uf,
        tipo_local: row.tipo_local,
        filme_aplicado: row.filme_aplicado,
        filme_detalhes: row.filme_detalhes,
        metros_aplicados: row.metros_aplicados,
        data_servico: row.data_servico,
        observacoes: row.observacoes,
        empresa_nome: row.empresa_nome,
        empresa_telefone: row.empresa_telefone,
        empresa_email: row.empresa_email,
        empresa_site: row.empresa_site,
        empresa_endereco: row.empresa_endereco,
        empresa_logo: row.empresa_logo,
        empresa_cores: row.empresa_cores,
        created_at: row.created_at,
        updated_at: row.updated_at
    };
}

// Gerar URL pública do serviço
export function gerarUrlServico(codigoQr: string): string {
    // Usar a URL base da aplicação
    let baseUrl = window.location.origin;

    // Em desenvolvimento, substituir localhost pelo IP para testes em dispositivos móveis
    // Detecta IPs locais comuns (192.168.x.x, 10.x.x.x, etc)
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        // Tentar obter o IP da rede local através do hostname
        // Se estiver acessando via IP, mantém o IP
        // Se estiver via localhost, sugere usar o IP
        console.log('[QR Service] URL gerada com localhost. Para testar em dispositivos móveis, acesse via IP da rede local.');
    }

    return `${baseUrl}/?servico=${codigoQr}`;
}
