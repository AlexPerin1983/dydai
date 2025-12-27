<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1YmLcdbVLzJjsmLUAXdFSYwnPWrDgq5sj

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Modo OCR Local (Gratuito)

O app suporta **dois modos de extração de dados**:

### 1. Modo Gemini (Pago)
- Usa a API do Google Gemini para extração inteligente
- Suporta imagem, texto e áudio
- Requer configuração de API Key na aba "Empresa"
- Melhor precisão e contexto semântico

### 2. Modo OCR Local (100% Gratuito) 
- Roda **inteiramente no navegador** usando [Tesseract.js](https://tesseract.projectnaptha.com/)
- **Zero custo** - nenhuma chamada de API externa
- **Privacidade total** - nenhum dado enviado para servidor
- Suporta apenas imagem e texto (áudio não suportado)
- Extrai: medidas (120x80, 1.20m x 0.80m), dados de cliente (telefone, email, CPF/CNPJ)

Para usar o modo OCR Local, configure o provedor como `local_ocr` nas configurações da empresa.

> ⚠️ **Limitação**: O primeiro OCR pode levar 5-15 segundos para carregar os dados de idioma português (~3MB).
