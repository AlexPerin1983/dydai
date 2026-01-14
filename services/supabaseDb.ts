// Supabase Database Service
// Migração do IndexedDB para Supabase
import { supabase } from './supabaseClient';
import { Client, Measurement, UserInfo, Film, SavedPDF, Agendamento, ProposalOption } from '../types';
import { mockUserInfo } from './mockData';

// Helper para obter o user_id atual
const getCurrentUserId = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user.id;

    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
};

// ============================================
// CLIENT FUNCTIONS
// ============================================

export const getAllClients = async (): Promise<Client[]> => {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('nome', { ascending: true });

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        nome: row.nome || '',
        telefone: row.telefone || '',
        email: row.email || '',
        cpfCnpj: row.cpf_cnpj || '',
        cep: row.cep || '',
        logradouro: row.logradouro || '',
        numero: row.numero || '',
        complemento: row.complemento || '',
        bairro: row.bairro || '',
        cidade: row.cidade || '',
        uf: row.uf || '',
        lastUpdated: row.last_updated,
        pinned: row.pinned || false,
        pinnedAt: row.pinned_at ? new Date(row.pinned_at).getTime() : undefined
    }));
};

export const saveClient = async (client: Omit<Client, 'id'> | Client): Promise<Client> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const clientData = {
        user_id: userId,
        nome: client.nome,
        telefone: client.telefone,
        email: client.email,
        cpf_cnpj: client.cpfCnpj,
        cep: client.cep || null,
        logradouro: client.logradouro || null,
        numero: client.numero || null,
        complemento: client.complemento || null,
        bairro: client.bairro || null,
        cidade: client.cidade || null,
        uf: client.uf || null,
        last_updated: new Date().toISOString(),
        pinned: client.pinned || false,
        pinned_at: client.pinnedAt ? new Date(client.pinnedAt).toISOString() : null
    };

    if ('id' in client && client.id) {
        const { data, error } = await supabase
            .from('clients')
            .update(clientData)
            .eq('id', client.id)
            .select()
            .single();

        if (error) throw error;
        return mapRowToClient(data);
    } else {
        const { data, error } = await supabase
            .from('clients')
            .insert(clientData)
            .select()
            .single();

        if (error) throw error;
        return mapRowToClient(data);
    }
};

export const deleteClient = async (id: number): Promise<void> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

const mapRowToClient = (row: any): Client => ({
    id: row.id,
    nome: row.nome || '',
    telefone: row.telefone || '',
    email: row.email || '',
    cpfCnpj: row.cpf_cnpj || '',
    cep: row.cep || '',
    logradouro: row.logradouro || '',
    numero: row.numero || '',
    complemento: row.complemento || '',
    bairro: row.bairro || '',
    cidade: row.cidade || '',
    uf: row.uf || '',
    lastUpdated: row.last_updated,
    pinned: row.pinned || false,
    pinnedAt: row.pinned_at ? new Date(row.pinned_at).getTime() : undefined
});

// ============================================
// PROPOSAL OPTIONS FUNCTIONS
// ============================================

export const getProposalOptions = async (clientId: number): Promise<ProposalOption[]> => {
    const { data, error } = await supabase
        .from('proposal_options')
        .select('*')
        .eq('client_id', clientId);

    if (error) {
        console.error('Error fetching proposal options:', error);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        measurements: row.measurements || [],
        generalDiscount: row.general_discount || { value: '0', type: 'percentage' }
    }));
};

export const saveProposalOptions = async (clientId: number, options: ProposalOption[]): Promise<void> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    await supabase
        .from('proposal_options')
        .delete()
        .eq('client_id', clientId);

    if (options.length > 0) {
        const optionsData = options.map(opt => ({
            user_id: userId,
            client_id: clientId,
            name: opt.name,
            measurements: opt.measurements,
            general_discount: opt.generalDiscount
        }));

        const { error } = await supabase
            .from('proposal_options')
            .insert(optionsData);

        if (error) throw error;
    }

    await supabase
        .from('clients')
        .update({ last_updated: new Date().toISOString() })
        .eq('id', clientId);
};

export const deleteProposalOptions = async (clientId: number): Promise<void> => {
    const { error } = await supabase
        .from('proposal_options')
        .delete()
        .eq('client_id', clientId);

    if (error) throw error;
};

// ============================================
// USER INFO FUNCTIONS
// ============================================

export const getUserInfo = async (): Promise<UserInfo> => {
    const userId = await getCurrentUserId();
    if (!userId) return mockUserInfo;

    const { data, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !data) return mockUserInfo;

    return {
        ...mockUserInfo,
        nome: data.nome || mockUserInfo.nome,
        empresa: data.empresa || mockUserInfo.empresa,
        telefone: data.telefone || mockUserInfo.telefone,
        email: data.email || mockUserInfo.email,
        endereco: data.endereco || mockUserInfo.endereco,
        cpfCnpj: data.cpf_cnpj || mockUserInfo.cpfCnpj,
        site: data.site,
        logo: data.logo,
        assinatura: data.assinatura,
        cores: data.cores || mockUserInfo.cores,
        payment_methods: data.payment_methods || mockUserInfo.payment_methods,
        proposalValidityDays: data.proposal_validity_days,
        prazoPagamento: data.prazo_pagamento,
        workingHours: data.working_hours,
        employees: data.employees,
        aiConfig: data.ai_config || mockUserInfo.aiConfig,
        lastSelectedClientId: data.last_selected_client_id
    };
};

export const saveUserInfo = async (userInfo: UserInfo): Promise<UserInfo> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Usuário não autenticado. Por favor, faça login novamente.');

    const userInfoData = {
        user_id: userId,
        nome: userInfo.nome,
        empresa: userInfo.empresa,
        telefone: userInfo.telefone,
        email: userInfo.email,
        endereco: userInfo.endereco,
        cpf_cnpj: userInfo.cpfCnpj,
        site: userInfo.site,
        logo: userInfo.logo,
        assinatura: userInfo.assinatura,
        cores: userInfo.cores,
        payment_methods: userInfo.payment_methods,
        proposal_validity_days: userInfo.proposalValidityDays,
        prazo_pagamento: userInfo.prazoPagamento,
        working_hours: userInfo.workingHours,
        employees: userInfo.employees,
        ai_config: userInfo.aiConfig,
        last_selected_client_id: userInfo.lastSelectedClientId
    };

    const { error } = await supabase
        .from('user_info')
        .upsert(userInfoData, { onConflict: 'user_id' });

    if (error) {
        console.error('Erro ao salvar informações do usuário:', error);
        throw error;
    }
    return userInfo;
};

// ============================================
// CUSTOM FILM FUNCTIONS
// ============================================

export const getAllCustomFilms = async (): Promise<Film[]> => {
    const { data, error } = await supabase
        .from('films')
        .select('*')
        .order('pinned', { ascending: false, nullsFirst: false })
        .order('nome', { ascending: true });

    if (error) {
        console.error('Error fetching films:', error);
        return [];
    }

    return (data || []).map(row => ({
        nome: row.nome,
        preco: row.preco,
        precoMetroLinear: row.preco_metro_linear,
        maoDeObra: row.mao_de_obra,
        garantiaFabricante: row.garantia_fabricante,
        garantiaMaoDeObra: row.garantia_mao_de_obra,
        uv: row.uv,
        ir: row.ir,
        vtl: row.vtl,
        espessura: row.espessura,
        tser: row.tser,
        imagens: row.imagens,
        pinned: row.pinned,
        pinnedAt: row.pinned_at ? new Date(row.pinned_at).getTime() : undefined,
        customFields: row.custom_fields
    }));
};

export const saveCustomFilm = async (film: Film): Promise<Film> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const filmData = {
        user_id: userId,
        nome: film.nome,
        preco: film.preco,
        preco_metro_linear: film.precoMetroLinear,
        mao_de_obra: film.maoDeObra,
        garantia_fabricante: film.garantiaFabricante,
        garantia_mao_de_obra: film.garantiaMaoDeObra,
        uv: film.uv,
        ir: film.ir,
        vtl: film.vtl,
        espessura: film.espessura,
        tser: film.tser,
        imagens: film.imagens,
        pinned: film.pinned,
        pinned_at: film.pinnedAt ? new Date(film.pinnedAt).toISOString() : null,
        custom_fields: film.customFields
    };

    const { error } = await supabase
        .from('films')
        .upsert(filmData, { onConflict: 'user_id,nome' });

    if (error) throw error;
    return film;
};

export const deleteCustomFilm = async (filmName: string): Promise<void> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('films')
        .delete()
        .eq('nome', filmName)
        .eq('user_id', userId);

    if (error) throw error;
};

// ============================================
// SAVED PDF FUNCTIONS
// ============================================

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

const mapRowToPDF = (row: any): SavedPDF => ({
    id: row.id,
    clienteId: row.client_id,
    clientName: row.client_name,
    date: row.date,
    expirationDate: row.expiration_date,
    totalPreco: row.total_preco,
    totalM2: row.total_m2,
    subtotal: row.subtotal,
    generalDiscountAmount: row.general_discount_amount,
    generalDiscount: row.general_discount,
    pdfBlob: row.pdf_blob ? base64ToBlob(row.pdf_blob) : new Blob(),
    nomeArquivo: row.nome_arquivo,
    measurements: row.measurements,
    status: row.status,
    agendamentoId: row.agendamento_id,
    proposalOptionName: row.proposal_option_name,
    proposalOptionId: row.proposal_option_id
});

export const savePDF = async (pdfData: Omit<SavedPDF, 'id'>): Promise<SavedPDF> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const blobBase64 = await blobToBase64(pdfData.pdfBlob);

    const pdfRow = {
        user_id: userId,
        client_id: pdfData.clienteId,
        client_name: pdfData.clientName,
        date: pdfData.date,
        expiration_date: pdfData.expirationDate,
        total_preco: pdfData.totalPreco,
        total_m2: pdfData.totalM2,
        subtotal: pdfData.subtotal,
        general_discount_amount: pdfData.generalDiscountAmount,
        general_discount: pdfData.generalDiscount,
        pdf_blob: blobBase64,
        nome_arquivo: pdfData.nomeArquivo,
        measurements: pdfData.measurements,
        status: pdfData.status || 'pending',
        agendamento_id: pdfData.agendamentoId,
        proposal_option_name: pdfData.proposalOptionName,
        proposal_option_id: pdfData.proposalOptionId
    };

    const { data, error } = await supabase
        .from('saved_pdfs')
        .insert(pdfRow)
        .select()
        .single();

    if (error) throw error;
    return mapRowToPDF(data);
};

export const updatePDF = async (pdfData: SavedPDF): Promise<SavedPDF> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const blobBase64 = await blobToBase64(pdfData.pdfBlob);

    const pdfRow = {
        client_id: pdfData.clienteId,
        client_name: pdfData.clientName,
        date: pdfData.date,
        expiration_date: pdfData.expirationDate,
        total_preco: pdfData.totalPreco,
        total_m2: pdfData.totalM2,
        subtotal: pdfData.subtotal,
        general_discount_amount: pdfData.generalDiscountAmount,
        general_discount: pdfData.generalDiscount,
        pdf_blob: blobBase64,
        nome_arquivo: pdfData.nomeArquivo,
        measurements: pdfData.measurements,
        status: pdfData.status,
        agendamento_id: pdfData.agendamentoId,
        proposal_option_name: pdfData.proposalOptionName,
        proposal_option_id: pdfData.proposalOptionId
    };

    const { data, error } = await supabase
        .from('saved_pdfs')
        .update(pdfRow)
        .eq('id', pdfData.id)
        .select()
        .single();

    if (error) throw error;
    return mapRowToPDF(data);
};

export const getAllPDFs = async (): Promise<SavedPDF[]> => {
    const { data, error } = await supabase
        .from('saved_pdfs')
        .select('id, client_id, client_name, date, expiration_date, total_preco, total_m2, subtotal, general_discount_amount, general_discount, nome_arquivo, measurements, status, agendamento_id, proposal_option_name, proposal_option_id')
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching PDFs:', error);
        return [];
    }

    return (data || []).map(row => mapRowToPDF(row));
};

export const getPDFsForClient = async (clientId: number): Promise<SavedPDF[]> => {
    const { data, error } = await supabase
        .from('saved_pdfs')
        .select('id, client_id, client_name, date, expiration_date, total_preco, total_m2, subtotal, general_discount_amount, general_discount, nome_arquivo, measurements, status, agendamento_id, proposal_option_name, proposal_option_id')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching PDFs for client:', error);
        return [];
    }

    return (data || []).map(row => mapRowToPDF(row));
};

export const getPDFBlob = async (id: number): Promise<Blob | null> => {
    const { data, error } = await supabase
        .from('saved_pdfs')
        .select('pdf_blob')
        .eq('id', id)
        .single();

    if (error || !data?.pdf_blob) return null;
    return base64ToBlob(data.pdf_blob);
};

export const deletePDF = async (id: number): Promise<void> => {
    const { data: pdf } = await supabase
        .from('saved_pdfs')
        .select('agendamento_id')
        .eq('id', id)
        .single();

    if (pdf?.agendamento_id) {
        await deleteAgendamento(pdf.agendamento_id);
    }

    const { error } = await supabase
        .from('saved_pdfs')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// ============================================
// AGENDAMENTO FUNCTIONS
// ============================================

export const getAllAgendamentos = async (): Promise<Agendamento[]> => {
    const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching agendamentos:', error);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        pdfId: row.pdf_id,
        clienteId: row.client_id,
        clienteNome: row.client_name,
        start: row.start_time,
        end: row.end_time,
        notes: row.notes
    }));
};

export const saveAgendamento = async (agendamento: Agendamento | Omit<Agendamento, 'id'>): Promise<Agendamento> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const agendamentoData = {
        user_id: userId,
        pdf_id: agendamento.pdfId,
        client_id: agendamento.clienteId,
        client_name: agendamento.clienteNome,
        start_time: agendamento.start,
        end_time: agendamento.end,
        notes: agendamento.notes
    };

    if ('id' in agendamento && agendamento.id) {
        const { data, error } = await supabase
            .from('agendamentos')
            .update(agendamentoData)
            .eq('id', agendamento.id)
            .select()
            .single();

        if (error) throw error;
        return mapRowToAgendamento(data);
    } else {
        const { data, error } = await supabase
            .from('agendamentos')
            .insert(agendamentoData)
            .select()
            .single();

        if (error) throw error;
        return mapRowToAgendamento(data);
    }
};

export const deleteAgendamento = async (id: number): Promise<void> => {
    const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const getAgendamentoByPdfId = async (pdfId: number): Promise<Agendamento | undefined> => {
    const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('pdf_id', pdfId)
        .single();

    if (error || !data) return undefined;
    return mapRowToAgendamento(data);
};

const mapRowToAgendamento = (row: any): Agendamento => ({
    id: row.id,
    pdfId: row.pdf_id,
    clienteId: row.client_id,
    clienteNome: row.client_name,
    start: row.start_time,
    end: row.end_time,
    notes: row.notes
});

// ============================================
// MEASUREMENTS FUNCTIONS (deprecated)
// ============================================

export const getMeasurements = async (clientId: number): Promise<Measurement[] | null> => {
    const options = await getProposalOptions(clientId);
    return options.length > 0 ? options[0].measurements : null;
};

export const saveMeasurements = async (clientId: number, medidas: Measurement[]): Promise<void> => {
    const options = await getProposalOptions(clientId);
    if (options.length > 0) {
        options[0].measurements = medidas;
        await saveProposalOptions(clientId, options);
    } else {
        await saveProposalOptions(clientId, [{
            id: 1,
            name: 'Opção 1',
            measurements: medidas,
            generalDiscount: { value: '0', type: 'percentage' }
        }]);
    }
};

export const deleteMeasurements = async (clientId: number): Promise<void> => {
    await deleteProposalOptions(clientId);
};

export const migratePDFsWithProposalOptionId = async (): Promise<{ updated: number; skipped: number; errors: number }> => {
    return { updated: 0, skipped: 0, errors: 0 };
};
