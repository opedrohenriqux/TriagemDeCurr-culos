import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Candidate, AIAnalysis, Job, User, Message } from '../types';

let ai: GoogleGenAI | null = null;
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("VITE_GEMINI_API_KEY não foi encontrada. As funcionalidades de IA serão desativadas.");
}

export const analyzeCandidateWithAI = async (candidate: Candidate, jobTitle: string): Promise<AIAnalysis | null> => {
  if (!ai) return null;

  const prompt = `
    Análise de Candidato para a vaga de ${jobTitle} no restaurante Lacoste Burger.

    Dados do Candidato:
    - Nome: ${candidate.name}
    - Idade: ${candidate.age}
    - Experiência: ${candidate.experience}
    - Educação: ${candidate.education}
    - Habilidades: ${candidate.skills.join(', ')}
    - Resumo: ${candidate.summary}

    Com base nos dados fornecidos, realize a seguinte análise aprofundada e retorne um JSON:
    1.  **summary**: Um resumo conciso e detalhado do perfil do candidato, destacando sua adequação para a vaga e mencionando potenciais pontos de atenção.
    2.  **strengths**: Uma lista (array de strings) com os 3 principais pontos fortes do candidato para esta vaga.
    3.  **weaknesses**: Uma lista (array de strings) com os 2 principais pontos a serem desenvolvidos ou que representam menor aderência à vaga.
    4.  **fitScore**: Um score de 0 a 10, onde 10 é o ajuste perfeito, representando a compatibilidade do candidato com a vaga de ${jobTitle}.
    5.  **interviewQuestions**: Uma lista (array de strings) com 3 perguntas de entrevista inteligentes e personalizadas, baseadas especificamente nas habilidades e na experiência (ou falta dela) do candidato, para aprofundar a avaliação.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            fitScore: { type: Type.NUMBER },
            interviewQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['summary', 'strengths', 'weaknesses', 'fitScore', 'interviewQuestions']
        }
      }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    // Limpa a formatação de asteriscos dos campos de texto
    const cleanedResult: AIAnalysis = {
      ...result,
      summary: result.summary.replace(/\*\*/g, ''),
      strengths: result.strengths.map((s: string) => s.replace(/\*\*/g, '')),
      weaknesses: result.weaknesses.map((w: string) => w.replace(/\*\*/g, '')),
      interviewQuestions: result.interviewQuestions.map((q: string) => q.replace(/\*\*/g, '')),
    };

    return cleanedResult;

  } catch (error) {
    console.error("Erro ao analisar candidato com IA:", error);
    return null;
  }
};

export const getDecisionSupportSummary = async (candidate: Candidate, job: Job, feedbackNotes: string, dynamicNotes?: string): Promise<string | null> => {
  if (!ai) return null;

  const dynamicNotesSection = dynamicNotes ? `
    **Anotações da Dinâmica de Grupo sobre o Candidato:**
    ---
    ${dynamicNotes}
    ---
  ` : '';
  
  const prompt = `
    **Contexto:** Você é um co-piloto de RH, um especialista em análise de talentos. Sua função é ajudar um recrutador a tomar a melhor decisão de contratação para a vaga de "${job.title}" no restaurante Lacoste Burger.
    **Candidato:** ${candidate.name}

    **Anotações do Recrutador sobre a Entrevista:**
    ---
    ${feedbackNotes}
    ---
    ${dynamicNotesSection}
    **Sua Tarefa:**
    Com base em **todas as anotações fornecidas** (entrevista e dinâmica de grupo, se houver), gere uma análise objetiva em um único parágrafo para auxiliá-lo na decisão. Sua análise deve:
    1.  Ponderar os pontos fortes e os pontos a desenvolver que foram mencionados em ambas as fontes.
    2.  Conectar essas observações com as possíveis demandas da vaga de "${job.title}".
    3.  Finalizar com uma síntese sobre o alinhamento geral do candidato, sem tomar a decisão final por ele. Aponte se o perfil parece mais alinhado, se há riscos a considerar, ou se é um candidato promissor com ressalvas.
    
    O objetivo é fornecer uma "segunda opinião" clara e imparcial. Não adicione informações que não estejam nas anotações.
    O resultado deve ser apenas o parágrafo de análise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Erro ao gerar resumo de apoio à decisão com IA:", error);
    return null;
  }
};


export const summarizeInterviewFeedback = async (candidate: Candidate, job: Job, decision: 'offer' | 'rejected' | 'waitlist', feedbackNotes?: string, dynamicNotes?: string): Promise<string | null> => {
  if (!ai) return null;

  const decisionText = decision === 'offer' ? 'aprovado para a próxima fase (oferta)' : decision === 'rejected' ? 'rejeitado' : 'colocado em lista de espera';
  
  const dynamicNotesSection = dynamicNotes ? `
    **Contexto da Dinâmica de Grupo:**
    ---
    ${dynamicNotes}
    ---
  ` : '';

  const prompt = `
    **Contexto:** Análise de feedback de entrevista para a vaga de "${job.title}" no restaurante Lacoste Burger.
    **Candidato:** ${candidate.name}
    **Decisão do Recrutador:** O candidato foi **${decisionText}**.

    **Anotações do Recrutador sobre a Entrevista Individual:**
    ---
    ${feedbackNotes || 'Nenhuma anotação fornecida.'}
    ---
    ${dynamicNotesSection}
    **Sua Tarefa:**
    Atuando como um especialista em RH, gere um parágrafo conciso e profissional que resuma a razão principal para a decisão de ${decisionText} este candidato, considerando tanto a entrevista quanto a dinâmica (se houver anotações). 
    - Se **aprovado**, destaque os pontos fortes e o fit cultural que justificaram a decisão.
    - Se **rejeitado**, aponte de forma construtiva as principais lacunas ou desalinhamentos (técnicos, comportamentais ou culturais) que levaram à rejeição.
    - Se **em lista de espera**, explique por que o candidato é uma boa opção de backup (pontos fortes), mas o que o impediu de ser a primeira escolha no momento (pontos a desenvolver).
    - A linguagem deve ser objetiva e focada nos fatos apresentados nas anotações.
    - O resultado deve ser apenas o parágrafo de resumo, sem introduções como "Aqui está o resumo:".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Erro ao gerar resumo de feedback com IA:", error);
    return null;
  }
};

export const generateApprovalEmail = async (candidate: Candidate, job: Job): Promise<string | null> => {
  if (!ai) return null;

  const prompt = `
    Escreva um e-mail profissional e amigável para o candidato "${candidate.name}" parabenizando-o por ter sido aprovado na fase de triagem inicial para a vaga de "${job.title}" no restaurante Lacoste Burger.

    O e-mail deve:
    1.  Começar com uma saudação calorosa (Ex: "Olá, ${candidate.name},").
    2.  Informar claramente que seu perfil foi analisado e aprovado para a próxima etapa do processo seletivo.
    3.  Mencionar que a equipe de RH entrará em contato em breve para agendar os próximos passos (como uma entrevista).
    4.  Agradecer novamente pelo interesse no Lacoste Burger.
    5.  Terminar com uma despedida profissional (Ex: "Atenciosamente, Equipe de Recrutamento Lacoste Burger").

    O tom deve ser encorajador e positivo. O resultado deve ser apenas o texto do e-mail.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Erro ao gerar e-mail de aprovação com IA:", error);
    return null;
  }
};

export const getAIResponseForChat = async (prompt: string, jobs: Job[], candidates: Candidate[]): Promise<string | null> => {
  if (!ai) return "A funcionalidade de IA está temporariamente indisponível. A chave de API não foi configurada corretamente.";

  try {
    const simplifiedJobs = jobs.map(j => ({ id: j.id, title: j.title, department: j.department, status: j.status }));
    const simplifiedCandidates = candidates.map(c => ({ id: c.id, name: c.name, jobId: c.jobId, status: c.status, fitScore: c.fitScore?.toFixed(1) }));
    const contextData = {
        jobs: simplifiedJobs,
        candidates: simplifiedCandidates,
        totalJobs: simplifiedJobs.length,
        totalCandidates: simplifiedCandidates.length,
    };
    const dataContextString = JSON.stringify(contextData, null, 2);

    const fullPrompt = `
      **Dados da Plataforma (em formato JSON):**
      ${dataContextString}

      ---

      **Pergunta do Usuário:**
      ${prompt}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: `
          **Persona:** Você é a "CrocoIA", a assistente de recrutamento virtual do restaurante Lacoste Burger. Sua missão é ser uma ferramenta indispensável para o recrutador, fornecendo insights, automatizando tarefas e oferecendo conselhos estratégicos. Você é profissional, prestativa, e expert em RH.

          **Formato da Resposta:** SEMPRE use Markdown para formatar suas respostas. Utilize listas (com '*' ou '-'), negrito ('**texto**') e parágrafos bem estruturados para garantir a máxima clareza. Não retorne texto puro.

          **Principais Capacidades e Exemplos de Comandos:**

          **1. Análise de Candidatos:**
          - **Resumir Perfil:** "Resuma o perfil do candidato [nome]."
          - **Comparar Candidatos:** "Compare os candidatos [Nome A] e [Nome B] para a vaga de [Cargo]." -> Você deve criar uma tabela ou lista comparativa dos pontos fortes e fracos de cada um para a vaga.
          - **Gerar Perguntas de Entrevista:** "Crie 5 perguntas de entrevista comportamentais para um [Cargo] focadas em [habilidade, ex: liderança]."
          - **Analisar Compatibilidade:** "Qual a compatibilidade do candidato [Nome] com a vaga de [Cargo]?"

          **2. Gestão de Vagas:**
          - **Otimizar Descrição:** "Analise a descrição da vaga de [Cargo] e sugira melhorias para atrair mais talentos."
          - **Sugerir Palavras-chave:** "Quais as melhores palavras-chave para anunciar uma vaga de [Cargo] no LinkedIn?"
          - **Análise de Requisitos:** "Os requisitos para a vaga de [Cargo] são realistas para o mercado de Campinas?"

          **3. Comunicação com Candidatos:**
          - **Escrever E-mails:** "Escreva um e-mail de rejeição humanizado para um candidato que chegou à fase final." ou "Crie um template de e-mail convidando um candidato para la segunda entrevista."
          - **Elaborar Propostas:** "Ajude-me a estruturar um e-mail de proposta de emprego para um [Cargo]."

          **4. Estratégia e Métricas:**
          - **Explicar Métricas:** "O que significa uma 'Taxa de Conversão' de 10% no meu dashboard e como posso melhorá-la?"
          - **Sugerir Fontes de Talentos:** "Onde posso encontrar bons candidatos para a vaga de [Cargo] além do LinkedIn?"
          - **Melhorar Processo:** "Dê-me 3 dicas para tornar nosso processo de triagem mais eficiente."

          **5. Análise de Dados da Plataforma:**
          - **Você tem acesso aos dados ao vivo da plataforma (lista de vagas e candidatos) em formato JSON, fornecidos no início do prompt.**
          - **Use esses dados para responder perguntas.** Por exemplo:
              - "Quantos candidatos temos para a vaga de auxiliar de serviços gerais?" -> Você deve encontrar o ID da vaga pelo título e contar os candidatos com esse \`jobId\`.
              - "Qual a distribuição de status dos candidatos atualmente?" -> Você deve contar os candidatos por cada \`status\`.
              - "Liste as vagas abertas no departamento de Operações."
          - **SEMPRE baseie suas respostas sobre os dados da plataforma nos dados fornecidos no prompt. Não invente números.**

          **6. MODO ESPECIAL: EXPORTAÇÃO PARA EXCEL (FORMATO TSV OBRIGATÓRIO)**
          - **REGRA DE OURO CRÍTICA E INQUEBRÁVEL:** Se o usuário pedir para "exportar para Excel", "criar uma tabela para Excel", "listar dados para colar no Excel", ou qualquer comando similar, você DEVE entrar neste modo especial.
          - **FORMATO DE SAÍDA OBRIGATÓRIO:** A sua resposta DEVE SER EXCLUSIVamente um bloco de código contendo dados em formato **TSV (Valores Separados por Tabulação)**.
          - **ESTRUTURA DA RESPOSTA:**
              - **APENAS O BLOCO DE CÓDIGO:** Sua resposta DEVE começar com \`\`\` e terminar com \`\`\`. NÃO PODE HAVER NENHUM TEXTO, saudação, explicação ou qualquer caractere fora deste bloco. A resposta inteira deve ser o bloco de código.
              - **SEPARADOR:** As colunas DEVEM SER SEPARADAS POR UM CARACTERE DE TABULAÇÃO ('\t'). NÃO use vírgulas, ponto e vírgula, ou múltiplos espaços. Use a tabulação literal.
              - **QUEBRA DE LINHA:** Cada registro (linha da tabela) DEVE estar em uma nova linha.
          - **O QUE NÃO FAZER (PROIBIDO):**
              - **NÃO use formatação Markdown:** É proibido usar '|', '-', ou qualquer outro caractere de formatação de tabela.
              - **NÃO use espaços para alinhar colunas:** A aparência no chat não importa, o que importa é a estrutura para o Excel. O alinhamento é feito pela tabulação.
              - **NÃO adicione texto extra:** A resposta não pode conter "Aqui estão os dados:" ou "Espero que ajude!". Apenas o bloco de código.

          - **EXEMPLO DE RESPOSTA PERFEITA E OBRIGATÓRIA:**
          \`\`\`
          Nome	Status	Pontuação
          Candidato A	approved	9.5
          Candidato B	screening	8.2
          Candidato C	rejected	4.1
          \`\`\`

          - **EXEMPLO DE RESPOSTA ERRADA (NUNCA FAÇA ISTO):**
          *Formato Markdown (PROIBIDO):*
          \`\`\`
          | Nome        | Status   | Pontuação |
          |-------------|----------|-----------|
          | Candidato A | approved | 9.5       |
          \`\`\`
          *Espaços em vez de TAB (PROIBIDO):*
          \`\`\`
          Nome          Status      Pontuação
          Candidato A   approved    9.5
          \`\`\`
          *Texto extra fora do bloco (PROIBIDO):*
          Claro, aqui está a tabela:
          \`\`\`
          Nome	Status	Pontuação
          Candidato A	approved	9.5
          \`\`\`

          Seja proativa. Se um usuário fizer uma pergunta vaga, peça mais contexto. Por exemplo, se ele pedir "faça perguntas de entrevista", pergunte "Ótimo! Para qual vaga e quais habilidades você gostaria de avaliar?".
        `,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao obter resposta da IA:", error);
    return null;
  }
};

export const getSuggestedReplies = async (
  conversationHistory: Message[],
  candidate: Candidate,
  job: Job,
  currentUser: User
): Promise<string[] | null> => {
  if (!ai) return null;

  const lastFiveMessages = conversationHistory.slice(-5).map(m =>
    `${m.senderId.startsWith('user') ? currentUser.username : candidate.name}: ${m.text}`
  ).join('\n');

  const prompt = `
    Contexto: Você é um assistente de RH para o recrutador "${currentUser.username}" do Lacoste Burger. Ele está conversando com o candidato "${candidate.name}" para a vaga de "${job.title}".

    Últimas mensagens da conversa:
    ---
    ${lastFiveMessages || "Nenhuma mensagem anterior."}
    ---

    Sua Tarefa:
    Com base no contexto, sugira 3 respostas curtas e profissionais que o recrutador poderia enviar agora. As sugestões devem ser úteis para avançar no processo de contratação (ex: agendar entrevista, tirar dúvidas, etc.).
    Retorne as sugestões como um array de strings em formato JSON.

    Exemplo de Resposta:
    { "replies": ["Que ótimo! Qual dia e horário ficaria bom para você?", "Entendido. Você tem mais alguma dúvida sobre a vaga?", "Perfeito. Vamos agendar uma conversa para a próxima semana."] }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replies: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['replies']
        }
      }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.replies as string[];
  } catch (error) {
    console.error("Erro ao gerar sugestões de resposta com IA:", error);
    return null;
  }
};

export const generateInterviewInvitationMessage = async (candidateName: string): Promise<string | null> => {
    if (!ai) return null;

    const prompt = `
        Gere uma mensagem curta, amigável e profissional para ser enviada via chat para o candidato "${candidateName}".
        A mensagem deve parabenizá-lo por ter sido aprovado na triagem inicial e convidá-lo para agendar uma entrevista, perguntando sobre sua disponibilidade de dias e horários.
        O resultado deve ser apenas o texto da mensagem.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Erro ao gerar mensagem de convite com IA:", error);
        return null;
    }
};

export const analyzeResumeWithAI = async (resumeDataUrl: string): Promise<string | null> => {
    if (!ai) return "A funcionalidade de IA está desativada.";

    try {
        const pdfjsLib = await import('pdfjs-dist');

        // Construct the worker URL in a way that Vite can handle
        const workerUrl = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
        );
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.toString();

        // Convert data URL to ArrayBuffer
        const base64 = resumeDataUrl.split(',')[1];
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;

        // Load PDF and extract text
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ') + '\n';
        }

        if (!fullText.trim()) {
            return "Não foi possível extrair texto do currículo. O arquivo pode estar em branco ou ser uma imagem.";
        }

        // Send text to Gemini for analysis
        const prompt = `
            Analise o seguinte texto extraído de um currículo e forneça um resumo conciso e bem estruturado em Markdown.

            **Instruções de Formatação:**
            - Use títulos em negrito (ex: **Experiência Profissional**).
            - Use listas com marcadores (-) para detalhar itens.
            - Seja objetivo e claro.

            **O resumo deve destacar:**
            1.  **Experiência Profissional**: Liste as experiências mais relevantes com cargo, empresa e período.
            2.  **Competências e Habilidades**: Liste as habilidades técnicas e comportamentais mais importantes.
            3.  **Formação Acadêmica**: Descreva a formação do candidato.
            4.  **Observações Gerais**: Mencione qualquer outra informação crucial para um recrutador.

            Texto do Currículo:
            ---
            ${fullText}
            ---
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim();

    } catch (error) {
        console.error("Erro ao analisar o currículo com IA:", error);
        if (error instanceof Error && error.message.includes('Invalid PDF structure')) {
            return "Erro: O arquivo fornecido não parece ser um PDF válido.";
        }
        return "Ocorreu um erro inesperado durante a análise do currículo.";
    }
};
