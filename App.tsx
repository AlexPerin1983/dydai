// ... (imports e tipos)

    const processClientDataWithGemini = async (input: { type: 'text' | 'image' | 'audio'; data: string | File[] | Blob }): Promise<ExtractedClientData | null> => {
        if (!userInfo?.aiConfig?.apiKey) {
            throw new Error("Chave de API do Gemini não configurada.");
        }
        
        try {
            const genAI = new GoogleGenerativeAI(userInfo!.aiConfig!.apiKey);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            nome: { type: SchemaType.STRING, description: 'Nome completo do cliente.' },
                            telefone: { type: SchemaType.STRING, description: 'Telefone do cliente, apenas dígitos. Ex: 83999998888' },
                            email: { type: SchemaType.STRING, description: 'Email do cliente.' },
                            cpfCnpj: { type: SchemaType.STRING, description: 'CPF ou CNPJ do cliente, apenas dígitos.' },
                            cep: { type: SchemaType.STRING, description: 'CEP do endereço, apenas dígitos.' },
                            logradouro: { type: SchemaType.STRING, description: 'Rua ou Logradouro.' },
                            numero: { type: SchemaType.STRING, description: 'Número do endereço.' },
                            complemento: { type: SchemaType.STRING, description: 'Complemento (opcional).' },
                            bairro: { type: SchemaType.STRING, description: 'Bairro.' },
                            cidade: { type: SchemaType.STRING, description: 'Cidade.' },
                            uf: { type: SchemaType.STRING, description: 'Estado (UF).' },
                        },
                    }
                }
            });
    
            const prompt = `
                Você é um assistente especialista em extração de dados de clientes. Sua tarefa é extrair o máximo de informações de contato, endereço completo (incluindo CEP, logradouro, número, bairro, cidade e UF) e documento (CPF ou CNPJ) de um cliente a partir da entrada fornecida (texto, imagem ou áudio).
                
                **Regra Crítica para Telefone:** O telefone deve ser extraído APENAS com o DDD e o número (máximo 11 dígitos). Remova qualquer código de país (ex: +55) se presente. Ex: Se for "+55 83 99999-8888", extraia "83999998888".
                
                Formate os campos de telefone, CPF/CNPJ e CEP APENAS com dígitos, sem pontuação ou espaços.
                
                **Regra para UF:** O campo UF deve conter APENAS a sigla do estado (2 letras).
                
                Responda APENAS com um objeto JSON válido que corresponda ao schema fornecido. Não inclua nenhuma outra explicação ou texto.
            `;
    
            const parts: any[] = [prompt];
    
            if (input.type === 'text') {
                const textData = input.data as string;
                if (textData.trim()) {
                    parts.push(textData);
                } else {
                    throw new Error("O conteúdo de texto está vazio.");
                }
            } else if (input.type === 'image') {
                const files = input.data as File[];
                if (files.length === 0) {
                    throw new Error("Nenhuma imagem foi fornecida.");
                }
                for (const file of files) {
                    const { mimeType, data } = await blobToBase64(file);
                    parts.push({ inlineData: { mimeType, data } });
                }
            } else if (input.type === 'audio') {
                const blobData = input.data as Blob;
                if (blobData.size === 0) {
                    throw new Error("O arquivo de áudio está vazio.");
                }
                const { mimeType, data } = await blobToBase64(blobData);
                    parts.push({ inlineData: { mimeType, data } });
            }
            
            if (parts.length === 1) {
                 // Se só tiver o prompt, significa que o conteúdo do usuário estava vazio/inválido
                 throw new Error("Nenhum conteúdo válido foi fornecido para a IA processar.");
            }
    
            const result = await model.generateContent({ contents: parts });
            const response = await result.response;
            
            // Tenta fazer o parse do JSON
            try {
                const extractedData = JSON.parse(response.text());
                return extractedData as ExtractedClientData;
            } catch (e) {
                console.error("Erro de JSON.parse:", e);
                // Se o parse falhar, tenta limpar a string (removendo caracteres extras antes/depois do JSON)
                const jsonText = response.text().trim();
                const start = jsonText.indexOf('{');
                const end = jsonText.lastIndexOf('}');
                
                if (start !== -1 && end !== -1 && end > start) {
                    const cleanedJson = jsonText.substring(start, end + 1);
                    try {
                        const extractedData = JSON.parse(cleanedJson);
                        console.log("JSON corrigido com sucesso.");
                        return extractedData as ExtractedClientData;
                    } catch (e2) {
                        // Se a correção falhar, lança o erro original
                        throw new Error(`A resposta da IA não é um JSON válido. Erro: ${e instanceof Error ? e.message : 'JSON malformado'}`);
                    }
                }
                
                throw new Error(`A resposta da IA não é um JSON válido. Erro: ${e instanceof Error ? e.message : 'JSON malformado'}`);
            }

        } catch (error) {
            console.error("Erro ao processar dados do cliente com Gemini:", error);
            throw error; // Re-throw para ser capturado pelo handleProcessAIClientInput
        }
    };

// ... (restante do App.tsx)