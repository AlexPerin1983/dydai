"use client";

import Tesseract from "tesseract.js";

/**
 * Resultado do OCR com texto extraído e confiança
 */
export interface OcrResult {
    text: string;
    confidence: number; // 0-100
    words: Array<{ text: string; confidence: number }>;
}

export type OcrProgressCallback = (progress: number) => void;

/**
 * Executa OCR em uma imagem usando Tesseract.js (client-side)
 * @param imageFile Arquivo de imagem para processar
 * @param onProgress Callback para progresso (0-100)
 * @returns Resultado do OCR com texto e confiança
 */
export async function performOCR(
    imageFile: File | Blob,
    onProgress?: OcrProgressCallback
): Promise<OcrResult> {
    // Converter File/Blob para URL de objeto
    const imageUrl = URL.createObjectURL(imageFile);

    try {
        const result = await Tesseract.recognize(imageUrl, "por", {
            logger: (info) => {
                if (info.status === "recognizing text" && onProgress) {
                    onProgress(Math.round(info.progress * 100));
                }
            },
        });

        const words = result.data.words.map((word) => ({
            text: word.text,
            confidence: word.confidence,
        }));

        return {
            text: result.data.text,
            confidence: result.data.confidence,
            words,
        };
    } finally {
        // Limpar URL do objeto para evitar memory leak
        URL.revokeObjectURL(imageUrl);
    }
}

/**
 * Pré-carrega o worker do Tesseract para melhorar performance
 * Chame isso no início da aplicação se possível
 */
export async function preloadOCRWorker(): Promise<void> {
    // Tesseract.js v5 gerencia workers automaticamente
    // Esta função pode ser expandida para pré-carregar dados de idioma
    console.log("[OCR] Worker será carregado sob demanda");
}
