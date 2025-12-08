# Documentação Funcional - Aplicativo de Orçamentos e Gestão de Películas

Esta documentação detalha todas as funcionalidades e capacidades do aplicativo, servindo como base para a criação de páginas de vendas, materiais de marketing e apresentações para designers.

## 🚀 Visão Geral
O aplicativo é uma solução completa e moderna para profissionais e empresas que trabalham com instalação de películas (insulfilm) e vidros. Ele permite gerenciar clientes, criar orçamentos detalhados, agendar serviços e utilizar Inteligência Artificial para automatizar tarefas, tudo em uma interface premium e fácil de usar.

## 🎯 Público-Alvo
- Instaladores de Películas (Automotivo e Arquitetônico)
- Vidraçarias
- Empresas de Comunicação Visual
- Arquitetos e Decoradores

---

## ✅ Checklist de Funcionalidades (Para Página de Vendas)

### 1. Gestão Inteligente de Clientes 👥
- [x] **Cadastro Completo**: Nome, telefone, e-mail, CPF/CNPJ e endereço completo.
- [x] **Busca de CEP**: Preenchimento automático de endereço via CEP.
- [x] **Importação via IA**: Extração automática de dados de clientes a partir de textos (WhatsApp) ou áudios.
- [x] **Histórico**: Visualização rápida de orçamentos anteriores por cliente.
- [x] **Fixar Clientes**: Opção para manter clientes importantes no topo da lista.

### 2. Orçamentos e Medidas 📏
- [x] **Cálculo Automático**: Área (m²) e preço final baseados nas medidas inseridas.
- [x] **Múltiplos Ambientes**: Organização de medidas por ambiente (ex: Sala, Quarto, Sacada).
- [x] **Tipos de Aplicação**: Diferenciação entre aplicação interna, externa, etc.
- [x] **Descontos Flexíveis**:
    - Desconto por item (medida específica).
    - Desconto geral no orçamento (porcentagem ou valor fixo).
- [x] **Opções de Proposta**: Criação de múltiplas opções de orçamento (ex: "Opção Econômica", "Opção Premium") para o mesmo cliente.
- [x] **Aplicação em Massa**: Aplicar uma película a todas as medidas de uma só vez.

### 3. Catálogo de Películas e Produtos 🎞️
- [x] **Cadastro Detalhado**: Nome, preço por m², preço por metro linear, mão de obra.
- [x] **Especificações Técnicas**: Cadastro de IR (Rejeição de Calor), UV (Proteção Ultravioleta), VLT (Transmissão Luminosa), TSER (Energia Solar Total Rejeitada) e Espessura.
- [x] **Galeria de Imagens**: Upload e visualização de fotos das películas aplicadas.
- [x] **Importação via IA**: Cadastro automático de películas a partir de fotos de catálogos ou descrições técnicas.

### 4. Inteligência Artificial (O Grande Diferencial) 🤖
- [x] **Leitura de Medidas**: A IA lê textos ou ouve áudios com as medidas e preenche a planilha automaticamente.
- [x] **Cadastro por Foto**: Tire uma foto de um cartão de visita ou catálogo e a IA cadastra os dados.
- [x] **Integração Flexível**: Suporte para Google Gemini e OpenAI (ChatGPT).

### 5. Geração de Propostas e Documentos 📄
- [x] **PDFs Profissionais**: Geração de orçamentos em PDF com layout limpo e moderno.
- [x] **Personalização**: Logotipo da empresa, cores da marca, dados de contato e rodapé personalizado.
- [x] **Assinatura Digital**: Coleta de assinatura do cliente diretamente na tela do dispositivo.
- [x] **Termos e Validade**: Configuração de validade da proposta e prazos de pagamento.
- [x] **Compartilhamento**: Envio fácil via WhatsApp ou E-mail.

### 6. Financeiro e Pagamentos 💰
- [x] **Formas de Pagamento**: Configuração de múltiplas formas (Pix, Boleto, Cartão, etc.).
- [x] **Parcelamento**: Definição de juros e número máximo de parcelas.
- [x] **Chaves Pix**: Cadastro de chaves Pix para facilitar o recebimento.

### 7. Agenda e Organização 📅
- [x] **Agendamento de Serviços**: Calendário integrado para marcar instalações.
- [x] **Vínculo com Orçamentos**: Agendamento direto a partir de um orçamento aprovado.
- [x] **Visualização Clara**: Agenda diária, semanal ou mensal.

### 8. Tecnologia e Experiência do Usuário 📱
- [x] **PWA (Progressive Web App)**: Funciona como um aplicativo nativo, instalável no celular ou computador.
- [x] **Modo Offline**: Funciona mesmo sem internet (sincroniza quando reconectar).
- [x] **Modo Escuro (Dark Mode)**: Interface elegante e confortável para uso noturno.
- [x] **Design Premium**: Interface moderna, com animações suaves e foco na usabilidade.

---

## 🎨 Identidade Visual e Design
Para o designer, destaque que a aplicação utiliza:
- **Estilo**: Minimalista e Profissional.
- **Cores**: Base neutra (Slate/Cinza) com cores de destaque personalizáveis pela empresa.
- **Tipografia**: Moderna e legível (Inter/Roboto).
- **Responsividade**: Perfeito em celulares, tablets e desktops.

## 🛠️ Diferenciais Técnicos
- **Segurança**: Dados armazenados localmente no dispositivo do usuário (maior privacidade).
- **Velocidade**: Carregamento instantâneo.
- **Atualizações**: Sistema de atualização automática (Service Workers).
