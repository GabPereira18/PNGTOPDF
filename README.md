# Bença, Pai - Conversor de Prints para PDF e E-mail

Uma aplicação web simples e eficiente para converter múltiplas imagens (como prints de tela) em um único arquivo PDF e enviá-lo por e-mail de forma prática. Ideal para quem precisa organizar e compartilhar documentos rapidamente, especialmente a partir de dispositivos móveis. 

Criado especialmente em função do Sr. João Pereira (Pai do desenvolvedor) o qual sempre necessita de suporte nesta demanda.

** Acesse a aplicação em: https://paipngtopdf.vercel.app/ **

## Funcionalidades Principais

*   **Seleção Múltipla de Imagens:** Carregue arquivos JPG e PNG do seu dispositivo.
*   **Pré-visualização e Ordenação:** Visualize as imagens selecionadas, remova as indesejadas e reordene-as facilmente para definir a sequência no PDF.
*   **Geração de PDF no Cliente:** Crie o arquivo PDF diretamente no seu navegador, sem necessidade de upload para um servidor para processamento.
*   **Nomeação Personalizada:** Defina um nome para o seu arquivo PDF.
*   **Opções Pós-Geração:**
    *   **Download:** Baixe o PDF gerado.
    *   **Visualizar:** Abra o PDF em uma nova guia para revisão.
    *   **Enviar por E-mail:** Preencha os detalhes do destinatário, assunto e corpo da mensagem. O PDF é automaticamente anexado e enviado através de um endpoint seguro no backend.
*   **Design Responsivo:** Interface otimizada para uso em desktops e dispositivos móveis.
*   **Notificações:** Feedback visual para ações como geração de PDF, envio de e-mail e erros.
*   **Tema Moderno:** Interface com um tema escuro e degradê.

## Tecnologias Utilizadas

*   **Frontend:**
    *   [Next.js](https://nextjs.org/) (App Router)
    *   [React](https://reactjs.org/)
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [ShadCN UI](https://ui.shadcn.com/) (para componentes de interface)
    *   [Tailwind CSS](https://tailwindcss.com/) (para estilização)
    *   [Lucide React](https://lucide.dev/) (para ícones)
*   **Geração de PDF:**
    *   [jsPDF](https://github.com/parallax/jsPDF)
*   **Envio de E-mail (Backend):**
    *   API Routes do Next.js
    *   [Nodemailer](https://nodemailer.com/)

## Configuração e Desenvolvimento Local

Siga os passos abaixo para executar o projeto localmente:

1.  **Pré-requisitos:**
    *   [Node.js](https://nodejs.org/) (versão 18.x ou superior recomendada)
    *   `npm`, `yarn` ou `pnpm` como gerenciador de pacotes.

2.  **Clone o Repositório:**
    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio
    ```
    (Substitua `seu-usuario/seu-repositorio` pelo caminho do seu repositório no GitHub)

3.  **Instale as Dependências:**
    ```bash
    npm install
    # ou
    # yarn install
    # ou
    # pnpm install
    ```

4.  **Configure as Variáveis de Ambiente (para envio de e-mail):**
    *   Crie um arquivo chamado `.env.local` na raiz do projeto.
    *   Copie o conteúdo do arquivo `.env.example` para o `.env.local`.
    *   Preencha as variáveis no `.env.local` com suas credenciais reais do servidor de e-mail (ex: Gmail com Senha de App, Outlook, etc.). **Não adicione o arquivo `.env.local` ao Git.**
        ```env
        # Exemplo para Gmail
        EMAIL_SERVER_HOST=smtp.gmail.com
        EMAIL_SERVER_PORT=465
        EMAIL_SERVER_SECURE=true
        EMAIL_SERVER_USER=seu-email@gmail.com
        EMAIL_SERVER_PASSWORD=sua-senha-de-app-do-gmail
        EMAIL_FROM=seu-email@gmail.com
        ```

5.  **Execute o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    # ou
    # yarn dev
    # ou
    # pnpm dev
    ```
    Abra [http://localhost:9002](http://localhost:9002) (ou a porta que for indicada no seu terminal) no seu navegador.

## Deploy

Este projeto está configurado para deploy fácil na [Vercel](https://vercel.com/).

*   Conecte seu repositório GitHub à Vercel.
*   Configure as mesmas variáveis de ambiente (listadas no `.env.example`) no painel do seu projeto na Vercel (em Settings > Environment Variables).
*   A Vercel cuidará do build e do deploy, incluindo a API Route para envio de e-mails como uma Serverless Function.

## Autor

Desenvolvido por **Gabriel Pereira**.

---

© 2025. Todos os direitos reservados.
