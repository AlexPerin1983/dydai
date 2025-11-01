import { Client, Measurement, UserInfo, Film, SavedPDF, Agendamento, ProposalOption, ActiveTab } from '../types';
import { mockUserInfo, mockClients } from './mockData';

const DB_NAME = 'PeliculasBrasilDB';
const DB_VERSION = 10; // Aumentei a versão para acomodar novas stores

// Stores
const CLIENT_STORE = 'clients';
const MEASUREMENT_STORE = 'measurements';
const FILM_STORE = 'films';
const PDF_STORE = 'pdfs';
const USER_INFO_STORE = 'user_info';
const AGENDAMENTO_STORE = 'agendamentos';
const PROPOSAL_OPTION_STORE = 'proposal_options';

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            return resolve(dbInstance);
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            // Client Store
            if (!db.objectStoreNames.contains(CLIENT_STORE)) {
                const clientStore = db.createObjectStore(CLIENT_STORE, { keyPath: 'id', autoIncrement: true });
                clientStore.createIndex('nome', 'nome', { unique: false });
            }

            // Measurement Store (Keyed by ProposalOption ID + Client ID for context, but we'll use a simple key for now)
            if (!db.objectStoreNames.contains(MEASUREMENT_STORE)) {
                db.createObjectStore(MEASUREMENT_STORE, { keyPath: 'id' });
            }

            // Film Store
            if (!db.objectStoreNames.contains(FILM_STORE)) {
                db.createObjectStore(FILM_STORE, { keyPath: 'nome' });
            }
            
            // PDF Store
            if (!db.objectStoreNames.contains(PDF_STORE)) {
                db.createObjectStore(PDF_STORE, { keyPath: 'id', autoIncrement: true });
            }

            // User Info Store (Single record with key 'info')
            if (!db.objectStoreNames.contains(USER_INFO_STORE)) {
                db.createObjectStore(USER_INFO_STORE, { keyPath: 'id' });
            }
            
            // Agendamento Store
            if (!db.objectStoreNames.contains(AGENDAMENTO_STORE)) {
                db.createObjectStore(AGENDAMENTO_STORE, { keyPath: 'id', autoIncrement: true });
            }
            
            // Proposal Option Store (Keyed by client ID)
            if (!db.objectStoreNames.contains(PROPOSAL_OPTION_STORE)) {
                db.createObjectStore(PROPOSAL_OPTION_STORE, { keyPath: 'id' });
            }
            
            // Seed initial data if necessary (only for UserInfo)
            const infoStore = db.transaction([USER_INFO_STORE], 'readwrite').objectStore(USER_INFO_STORE);
            infoStore.get('info').onsuccess = (e) => {
                if (!(e.target as IDBRequest).result) {
                    infoStore.add(mockUserInfo);
                }
            };
        };

        request.onsuccess = (event) => {
            dbInstance = (event.target as IDBOpenDBRequest).result;
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            reject(new Error(`Database error: ${(event.target as IDBOpenDBRequest).error?.message || 'Unknown error'}`));
        };
    });
};

const getTransaction = (storeName: string, mode: IDBTransactionMode): IDBTransaction => {
    const db = dbInstance || (() => { throw new Error("DB not initialized"); })();
    return db.transaction([storeName], mode);
};

const getStore = (tx: IDBTransaction, storeName: string): IDBObjectStore => {
    return tx.objectStore(storeName);
};

// --- Client Operations ---

export const getAllClients = async (): Promise<Client[]> => {
    const tx = getTransaction(CLIENT_STORE, 'readonly');
    const store = getStore(tx, CLIENT_STORE);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as Client[]);
        request.onerror = () => reject(request.error);
    });
};

export const saveClient = async (client: Client): Promise<Client> => {
    const tx = getTransaction(CLIENT_STORE, 'readwrite');
    const store = getStore(tx, CLIENT_STORE);
    
    const finalClient = { ...client, lastUpdated: new Date().toISOString() };
    
    const request = store.put(finalClient);
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(finalClient as Client);
        request.onerror = () => reject(request.error);
    });
};

export const deleteClient = async (clientId: number): Promise<void> => {
    const tx = getTransaction(CLIENT_STORE, 'readwrite');
    const request = getStore(tx, CLIENT_STORE).delete(clientId);
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// --- Proposal Options Operations (New) ---

export const getProposalOptions = async (clientId: number): Promise<ProposalOption[]> => {
    const tx = getTransaction(PROPOSAL_OPTION_STORE, 'readonly');
    const store = getStore(tx, PROPOSAL_OPTION_STORE);
    
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result as ProposalOption[]);
        };
        request.onerror = () => reject(request.error);
    });
};

export const saveProposalOptions = async (clientId: number, options: ProposalOption[]): Promise<void> => {
    const tx = getTransaction(PROPOSAL_OPTION_STORE, 'readwrite');
    const store = getStore(tx, PROPOSAL_OPTION_STORE);
    
    // Limpa opções antigas do cliente (simplificação: deleta tudo e salva tudo)
    const clearRequest = store.clear(); 
    
    return new Promise((resolve, reject) => {
        clearRequest.onsuccess = () => {
            let count = 0;
            if (options.length === 0) {
                resolve();
                return;
            }
            
            options.forEach(opt => {
                // Adicionamos clientId para referência futura, embora o keyPath seja 'id'
                const optionWithClientId = { ...opt, clientId: clientId };
                const request = store.put(optionWithClientId);
                request.onsuccess = () => {
                    count++;
                    if (count === options.length) resolve();
                };
                request.onerror = () => reject(request.error);
            });
        };
        clearRequest.onerror = () => reject(clearRequest.error);
    });
};

export const deleteProposalOptions = async (clientId: number): Promise<void> => {
    const tx = getTransaction(PROPOSAL_OPTION_STORE, 'readwrite');
    const store = getStore(tx, PROPOSAL_OPTION_STORE);
    
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const optionsToDelete = request.result.filter((opt: any) => opt.clientId === clientId);
            let count = 0;
            if (optionsToDelete.length === 0) resolve();
            
            optionsToDelete.forEach((opt: ProposalOption) => {
                const req = store.delete(opt.id);
                req.onsuccess = () => {
                    count++;
                    if (count === optionsToDelete.length) resolve();
                };
                req.onerror = () => reject(req.error);
            });
        };
        request.onerror = () => reject(request.error);
    });
};


// --- Film Operations ---

export const getAllFilms = async (): Promise<Film[]> => {
    const tx = getTransaction(FILM_STORE, 'readonly');
    const request = getStore(tx, FILM_STORE).getAll();
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as Film[]);
        request.onerror = () => reject(request.error);
    });
};

export const saveFilm = async (film: Film): Promise<Film> => {
    const tx = getTransaction(FILM_STORE, 'readwrite');
    const request = getStore(tx, FILM_STORE).put(film);
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(film);
        request.onerror = () => reject(request.error);
    });
};

export const deleteFilm = async (filmName: string): Promise<void> => {
    const tx = getTransaction(FILM_STORE, 'readwrite');
    const request = getStore(tx, FILM_STORE).delete(filmName);
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const updateMeasurementFilmName = async (oldName: string, newName: string): Promise<void> => {
    const tx = getTransaction(MEASUREMENT_STORE, 'readwrite');
    const store = getStore(tx, MEASUREMENT_STORE);
    
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const measurementsToUpdate = request.result.filter((m: Measurement) => m.pelicula === oldName);
            let count = 0;
            if (measurementsToUpdate.length === 0) resolve();
            
            measurementsToUpdate.forEach((m: Measurement) => {
                const updatedM = { ...m, pelicula: newName };
                const req = store.put(updatedM);
                req.onsuccess = () => {
                    count++;
                    if (count === measurementsToUpdate.length) resolve();
                };
                req.onerror = () => reject(req.error);
            });
        };
        request.onerror = () => reject(request.error);
    });
};


// --- PDF Operations ---

export const savePDF = async (pdf: SavedPDF): Promise<SavedPDF> => {
    const tx = getTransaction(PDF_STORE, 'readwrite');
    const store = getStore(tx, PDF_STORE);
    const request = store.add(pdf);
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve({ ...pdf, id: request.result as number });
        request.onerror = () => reject(request.error);
    });
};

export const getPDFsForClient = async (clientId: number): Promise<SavedPDF[]> => {
    const tx = getTransaction(PDF_STORE, 'readonly');
    const request = getStore(tx, PDF_STORE).getAll();
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result.filter((p: SavedPDF) => p.clienteId === clientId) as SavedPDF[]);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deletePDF = async (pdfId: number): Promise<void> => {
    const tx = getTransaction(PDF_STORE, 'readwrite');
    const request = getStore(tx, PDF_STORE).delete(pdfId);
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getLatestPdfIdForClient = async (clientId: number): Promise<number | undefined> => {
    const tx = getTransaction(PDF_STORE, 'readonly');
    const request = getStore(tx, PDF_STORE).getAll();
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const clientPdfs = request.result.filter((p: SavedPDF) => p.clienteId === clientId) as SavedPDF[];
            if (clientPdfs.length === 0) {
                resolve(undefined);
                return;
            }
            const latestPdf = clientPdfs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            resolve(latestPdf.id);
        };
        request.onerror = () => reject(request.error);
    });
};


// --- User Info Operations ---

export const getUserInfo = async (): Promise<UserInfo> => {
    const tx = getTransaction(USER_INFO_STORE, 'readonly');
    const request = getStore(tx, USER_INFO_STORE).get('info');
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const info = request.result as UserInfo;
            if (info) {
                resolve(info);
            } else {
                // Se não existir, salva o mock e retorna o mock
                const txWrite = getTransaction(USER_INFO_STORE, 'readwrite');
                getStore(txWrite, USER_INFO_STORE).add(mockUserInfo);
                resolve(mockUserInfo);
            }
        };
        request.onerror = () => reject(request.error);
    });
};

export const saveUserInfo = async (info: UserInfo): Promise<UserInfo> => {
    const tx = getTransaction(USER_INFO_STORE, 'readwrite');
    const request = getStore(tx, USER_INFO_STORE).put(info);
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(info);
        request.onerror = () => reject(request.error);
    });
};

// --- Agendamento Operations (New) ---

export const saveAgendamento = async (agendamento: Agendamento): Promise<Agendamento> => {
    const tx = getTransaction(AGENDAMENTO_STORE, 'readwrite');
    const store = getStore(tx, AGENDAMENTO_STORE);
    const request = store.put(agendamento);
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(agendamento.id ? agendamento : { ...agendamento, id: request.result as number });
        request.onerror = () => reject(request.error);
    });
};

export const getAllAgendamentos = async (): Promise<Agendamento[]> => {
    const tx = getTransaction(AGENDAMENTO_STORE, 'readonly');
    const request = getStore(tx, AGENDAMENTO_STORE).getAll();
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as Agendamento[]);
        request.onerror = () => reject(request.error);
    });
};

export const deleteAgendamento = async (id: number): Promise<void> => {
    const tx = getTransaction(AGENDAMENTO_STORE, 'readwrite');
    const request = getStore(tx, AGENDAMENTO_STORE).delete(id);
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteAgendamentosForClient = async (clientId: number): Promise<void> => {
    const tx = getTransaction(AGENDAMENTO_STORE, 'readwrite');
    const store = getStore(tx, AGENDAMENTO_STORE);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const agendamentosToDelete = request.result.filter((ag: Agendamento) => ag.clienteId === clientId);
            let count = 0;
            if (agendamentosToDelete.length === 0) resolve();
            
            agendamentosToDelete.forEach(ag => {
                const req = store.delete(ag.id!);
                req.onsuccess = () => {
                    count++;
                    if (count === agendamentosToDelete.length) resolve();
                };
                req.onerror = () => reject(req.error);
            });
        };
        request.onerror = () => reject(request.error);
    });
};