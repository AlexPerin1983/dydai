// Database Service - Agora usando Supabase
// Este arquivo redireciona todas as chamadas para o serviço Supabase

// Re-exporta todas as funções do supabaseDb
export {
    // Client functions
    getAllClients,
    saveClient,
    deleteClient,

    // Measurement functions (deprecated - use proposal options)
    getMeasurements,
    saveMeasurements,
    deleteMeasurements,

    // Proposal Options functions
    getProposalOptions,
    saveProposalOptions,
    deleteProposalOptions,

    // UserInfo functions
    getUserInfo,
    saveUserInfo,

    // Custom Film functions
    getAllCustomFilms,
    saveCustomFilm,
    deleteCustomFilm,

    // Saved PDF functions
    savePDF,
    updatePDF,
    getAllPDFs,
    getPDFsForClient,
    getPDFBlob,
    deletePDF,

    // Agendamento functions
    getAllAgendamentos,
    saveAgendamento,
    deleteAgendamento,
    getAgendamentoByPdfId,

    // Migration function
    migratePDFsWithProposalOptionId
} from './supabaseDb';