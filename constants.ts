import { User, Job, Candidate, Talent, Resume, CandidateStatus, CandidateInterview, Message } from './types';

// FIX: Added 'role' and 'specialty' to all users for data consistency and to enable new features.
export const USERS: User[] = [
  { id: 1, username: 'Pedro', password: 'Pedro', role: 'admin', specialty: 'Generalista' },
  { id: 2, username: 'Marcos', password: 'Marcos', role: 'admin', specialty: 'Cozinha' },
  { id: 3, username: 'ruan@lacoste.com', password: 'Ruan', role: 'admin', specialty: 'Marketing' },
  { id: 4, username: 'Luan', password: 'Luan', role: 'admin', specialty: 'Financeiro' },
  { id: 5, username: 'samuel@lacoste.com', password: 'Samuel', role: 'admin', specialty: 'Administrativo' },
];

export const INITIAL_JOBS: Job[] = [
  {
    id: 'sg-01',
    title: 'Auxiliar de Serviços Gerais',
    department: 'Operações',
    location: 'Campinas, SP',
    description: 'Esta é uma vaga versátil com foco em limpeza, organização e suporte geral às operações do restaurante, ideal para quem tem vontade de aprender e busca crescimento.',
    responsibilities: [
      'Auxiliar a equipe de cozinha no preparo dos pedidos quando houver demanda',
      'Prestar auxílio na recepção dos clientes',
      'Realizar a limpeza e manutenção do salão e áreas comuns',
      'Auxiliar no fechamento de caixa e organização final do expediente',
    ],
    benefits: [
      'Salário de R$1840,00',
      'Vale Refeição/Alimentação de R$130,00/mês',
      'Day off no aniversário (folga no dia do seu aniversário)',
      'Refeição no local',
      'Bônus de R$100,00 por assiduidade (prêmio por não ter faltas ou atrasos)',
      'Plano TotalPass',
      'Horas extras remuneradas'
    ],
    requirements: [
      'Possuir idade acima de 18 anos',
      'Possuir Ensino Médio completo ou cursando',
      'Possuir disponibilidade de horário (escala 5x2)',
      'Vontade de aprender e crescer profissionalmente',
      'Ter boa relação com trabalho em grupo',
      'Boa comunicação (Desejável)',
      'Ter tido experiência na área (Desejável)'
    ],
    sources: [
        { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs' },
        { name: 'Website da Empresa', url: 'https://www.lacosteburger.com/carreiras' }
    ],
    status: 'active',
  },
  {
    id: 'ch-01',
    title: 'Chapeiro',
    department: 'Cozinha',
    location: 'Campinas, SP',
    description: 'Preparar e montar os hambúrgueres e lanches do cardápio na chapa, seguindo os padrões de qualidade e tempo da casa.',
    responsibilities: [
        'Operar a chapa para grelhar carnes e outros ingredientes',
        'Montar os lanches conforme a comanda e o padrão de qualidade',
        'Manter a limpeza e organização da sua estação de trabalho',
        'Controlar o estoque de insumos da sua praça',
    ],
    benefits: ['Salário competitivo', 'Vale Transporte', 'Refeição no Local', 'Adicional Noturno (se aplicável)'],
    requirements: ['Ensino Médio completo', 'Experiência como chapeiro ou cozinheiro', 'Agilidade e habilidade para trabalhar sob pressão', 'Conhecimento de boas práticas de manipulação de alimentos'],
    sources: [
        { name: 'Google Forms', url: 'https://forms.gle/exemplo' },
    ],
    status: 'active',
  },
  {
    id: 'mkt-01',
    title: 'Analista de Marketing',
    department: 'Marketing',
    location: 'Campinas, SP',
    description: 'Criar e gerenciar campanhas de marketing digital, gerir redes sociais (Instagram, Facebook), criar conteúdo visual e escrito para engajamento do público e analisar métricas de performance.',
    responsibilities: [
        'Gerenciar o calendário de postagens nas redes sociais',
        'Criar artes e textos para posts e anúncios',
        'Interagir com o público online e gerenciar a comunidade',
        'Analisar métricas e gerar relatórios de desempenho das campanhas'
    ],
    benefits: ['Salário compatível com o mercado', 'Vale Refeição', 'Plano de Saúde', 'Trabalho Híbrido'],
    requirements: ['Superior em Marketing, Publicidade ou áreas correlatas', 'Experiência com gestão de redes sociais para negócios', 'Conhecimento em ferramentas de design (Canva, Photoshop)', 'Boa comunicação e criatividade'],
    sources: [
        { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs' },
        { name: 'Catho', url: 'https://www.catho.com.br' }
    ],
    status: 'active',
  },
  {
    id: 'rh-01',
    title: 'Analista de Recursos Humanos',
    department: 'RH',
    location: 'Campinas, SP',
    description: 'Conduzir processos de recrutamento e seleção, realizar integração de novos colaboradores, gerenciar benefícios e apoiar em rotinas de departamento pessoal e desenvolvimento de equipes.',
     responsibilities: [
        'Divulgar vagas e triar currículos',
        'Conduzir entrevistas e dinâmicas de grupo',
        'Realizar o processo de onboarding de novos funcionários',
        'Apoiar na organização de treinamentos e eventos internos'
    ],
    benefits: ['Salário compatível com o mercado', 'Pacote de benefícios completo (VR, VT, Plano de Saúde e Odontológico)', 'Oportunidade de crescimento'],
    requirements: ['Superior em Recursos Humanos, Psicologia ou Administração', 'Experiência generalista em RH', 'Conhecimento em legislação trabalhista', 'Excelentes habilidades de comunicação interpessoal'],
    sources: [
        { name: 'Vagas.com.br', url: 'https://www.vagas.com.br' },
        { name: 'InfoJobs', url: 'https://www.infojobs.com.br' }
    ],
    status: 'active',
  },
  {
    id: 'gf-01',
    title: 'Coordenador Financeiro',
    department: 'Financeiro',
    location: 'Campinas, SP',
    description: 'Responsável por toda a gestão financeira do restaurante, incluindo fluxo de caixa, contas a pagar e receber, conciliação bancária, elaboração de relatórios gerenciais e planejamento orçamentário.',
    responsibilities: [
        'Gerenciar o fluxo de caixa diário',
        'Elaborar e acompanhar o orçamento anual',
        'Realizar a conciliação bancária e o controle de contas',
        'Apresentar relatórios financeiros para a diretoria'
    ],
    benefits: ['Salário Executivo', 'Bônus por resultados', 'Plano de Saúde Premium', 'Ajuda de custo'],
    requirements: ['Superior completo em Administração, Ciências Contábeis ou Economia', 'Sólida experiência em gestão financeira, preferencialmente no setor de A&B', 'Conhecimento avançado em Excel e sistemas ERP', 'Perfil analítico e estratégico'],
    sources: [
        { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs' },
        { name: 'Glassdoor', url: 'https://www.glassdoor.com.br' }
    ],
    status: 'active',
  },
  {
    id: 'ga-01',
    title: 'Coordenador Administrativo',
    department: 'Administrativo',
    location: 'Campinas, SP',
    description: 'Supervisionar as operações diárias do restaurante, gerenciar a equipe, controlar estoques, negociar com fornecedores e garantir a satisfação do cliente e o cumprimento das metas.',
    responsibilities: [
        'Liderar e treinar a equipe do salão e cozinha',
        'Realizar o controle de CMV e gestão de estoque',
        'Garantir a excelência no atendimento ao cliente',
        'Resolver conflitos e garantir o bom funcionamento da loja'
    ],
    benefits: ['Salário de Gerência', 'Participação nos Lucros e Resultados (PLR)', 'Plano de Carreira', 'Benefícios completos'],
    requirements: ['Superior completo em Administração ou áreas afins', 'Experiência comprovada em gestão de restaurantes ou negócios similares', 'Liderança, habilidade de negociação e resolução de problemas', 'Visão sistêmica do negócio'],
    sources: [
        { name: 'Indeed', url: 'https://www.indeed.com.br' },
        { name: 'Website da Empresa', url: 'https://www.lacosteburger.com/carreiras' }
    ],
    status: 'active',
  },
];

const names = {
  male: ["Miguel", "Arthur", "Gael", "Heitor", "Theo", "Davi", "Gabriel", "Bernardo", "Samuel", "João", "Carlos", "Pedro", "Lucas", "Mateus", "Guilherme", "Rafael", "Felipe", "Bruno", "Eduardo", "Leonardo"],
  female: ["Helena", "Alice", "Laura", "Maria", "Valentina", "Heloísa", "Maitê", "Júlia", "Isabella", "Lívia", "Ana", "Juliana", "Fernanda", "Beatriz", "Camila", "Letícia", "Mariana", "Patrícia", "Amanda", "Carolina"]
};
const surnames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida"];
const maritalStatusOptions = {
    male: ["Solteiro", "Casado", "Divorciado"],
    female: ["Solteira", "Casada", "Divorciada"],
};
const sourcesOptions = ['LinkedIn', 'Website', 'Indicação', 'Google Forms', 'Redes Sociais'];

const nearbyNeighborhoods = ['Jardim Santa Genebra', 'Mansões Santo Antônio', 'Parque das Universidades', 'Jardim Santa Cândida', 'Barão Geraldo', 'Vila Costa e Silva', 'Jardim Santana'];
const farLocations = ['Ouro Verde, Campinas, SP', 'Sumaré, SP', 'Hortolândia, SP', 'Indaiatuba, SP', 'Valinhos, SP'];

const universities = ['UNICAMP', 'PUC-Campinas', 'UNIP', 'FACAMP'];
const motivationQuotes = {
    compatible: [
        "Acredito que minha agilidade e experiência podem contribuir muito para a eficiência do Lacoste Burger.",
        "Sou apaixonado pela dinâmica de restaurantes e quero crescer em uma rede que valoriza a qualidade.",
        "Admiro o padrão Lacoste Burger e quero fazer parte de uma equipe que se orgulha do que serve.",
        "Quero aplicar minhas habilidades em um ambiente reconhecido pelo atendimento e limpeza exemplar.",
        "Procuro estabilidade e admiro a cultura de excelência que a marca representa.",
    ],
    incompatible: [
        "Estou buscando qualquer oportunidade de trabalho no momento.",
        "Preciso de um emprego e vi a vaga aberta.",
        "Um amigo me indicou, então resolvi me candidatar.",
        "Parece ser um lugar legal para trabalhar.",
    ]
};

const screeningRejectionReasons = [
    "Baixa compatibilidade com os requisitos técnicos da vaga.",
    "Não possui as palavras-chave essenciais mencionadas na descrição.",
    "Experiência profissional insuficiente para a senioridade do cargo.",
    "Perfil mais alinhado a outras áreas de atuação.",
];
const interviewRejectionReasons = [
    "Perfil comportamental não alinhado com a cultura da empresa.",
    "Demonstrou baixa comunicação e clareza durante a conversa.",
    "As expectativas salariais estavam acima do orçamento para a vaga.",
    "Candidato demonstrou pouco interesse na posição durante a entrevista.",
];

const educationLevels = {
  fundamentalIncompleto: 'Ensino Fundamental Incompleto',
  fundamentalCompleto: 'Ensino Fundamental Completo',
  medioIncompleto: 'Ensino Médio Incompleto',
  medioCompleto: 'Ensino Médio Completo',
  tecnicoCozinha: 'Técnico em Cozinha (Senai São Paulo)',
  tecnicoMarketing: 'Técnico em Marketing (Senai São Paulo)',
  tecnicoRH: 'Técnico em Recursos Humanos (Senai São Paulo)',
  superiorIncompleto: (curso: string) => `Superior Incompleto - ${curso}`,
  superiorCompleto: (curso: string, uni: string) => `Superior Completo - ${curso} (${uni})`,
};

const educationHierarchy = [
    educationLevels.fundamentalIncompleto,
    educationLevels.fundamentalCompleto,
    educationLevels.medioIncompleto,
    educationLevels.medioCompleto,
    educationLevels.tecnicoCozinha,
    educationLevels.tecnicoMarketing,
    educationLevels.tecnicoRH,
    educationLevels.superiorIncompleto(''), // Placeholder
    educationLevels.superiorCompleto('', ''), // Placeholder
];

const jobRequirements = {
  'ch-01': educationHierarchy.indexOf(educationLevels.fundamentalCompleto),
  'mkt-01': educationHierarchy.indexOf(educationLevels.tecnicoMarketing),
  'rh-01': educationHierarchy.indexOf(educationLevels.tecnicoRH),
  'gf-01': educationHierarchy.indexOf(educationLevels.superiorCompleto('', '')),
  'ga-01': educationHierarchy.indexOf(educationLevels.superiorCompleto('', '')),
};


let candidateIdCounter = 1000;
let talentIdCounter = 10000;

const generateJobPopulation = (jobId: string, count: number) => {
    const candidates: Candidate[] = [];
    const pastTalents: Talent[] = [];
    const job = INITIAL_JOBS.find(j => j.id === jobId);
    if (!job) return { candidates, pastTalents };

    const minEducationIndex = (jobRequirements as any)[jobId] ?? 0;

    for (let i = 0; i < count; i++) {
        const gender: 'male' | 'female' = Math.random() > 0.5 ? 'male' : 'female';
        const nameList = gender === 'male' ? names.male : names.female;
        const isCompatible = Math.random() > 0.4;
        
        const name = `${nameList[Math.floor(Math.random() * nameList.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
        const age = Math.floor(Math.random() * 25) + 18;
        const experienceYears = Math.floor(Math.random() * 5) + 1;
        
        let education = '';
        if (isCompatible) {
            const eligibleLevels = educationHierarchy.slice(minEducationIndex);
            education = eligibleLevels[Math.floor(Math.random() * eligibleLevels.length)];
        } else {
            const ineligibleLevels = educationHierarchy.slice(0, minEducationIndex);
            education = ineligibleLevels.length > 0 ? ineligibleLevels[Math.floor(Math.random() * ineligibleLevels.length)] : 'Não informado';
        }

        if (education.includes('Técnico')) {
            if (jobId === 'mkt-01') education = educationLevels.tecnicoMarketing;
            else if (jobId === 'rh-01') education = educationLevels.tecnicoRH;
            else education = educationLevels.tecnicoCozinha;
        } else if (education.includes('Superior')) {
            const uni = universities[Math.floor(Math.random() * universities.length)];
            const curso = jobId === 'gf-01' ? 'Ciências Contábeis' : jobId === 'ga-01' ? 'Administração' : 'Gastronomia';
            if (education.includes('Incompleto')) education = educationLevels.superiorIncompleto(curso);
            else education = educationLevels.superiorCompleto(curso, uni);
        }

        const candidateData = {
            id: candidateIdCounter++,
            name,
            age,
            gender,
            maritalStatus: maritalStatusOptions[gender][Math.floor(Math.random() * maritalStatusOptions[gender].length)],
            location: isCompatible 
                ? `${nearbyNeighborhoods[Math.floor(Math.random() * nearbyNeighborhoods.length)]} - Campinas, SP (${(Math.random() * 5 + 1.5).toFixed(1)} km)`
                : farLocations[Math.floor(Math.random() * farLocations.length)],
            experience: `${experienceYears} anos de experiência em áreas ${isCompatible ? 'correlatas' : 'diversas'}.`,
            education,
            skills: isCompatible ? ['Proatividade', 'Comunicação', 'Trabalho em Equipe'] : ['Pacote Office', 'Digitação'],
            summary: `Profissional com ${experienceYears} anos de experiência, buscando novos desafios.`,
            jobId,
            fitScore: parseFloat((isCompatible ? Math.random() * 3 + 7 : Math.random() * 5 + 1).toFixed(1)),
            applicationDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
            source: sourcesOptions[Math.floor(Math.random() * sourcesOptions.length)],
            isArchived: false,
            resume: {
              professionalExperience: [{ company: `Empresa ${i+1}`, role: isCompatible ? 'Assistente' : 'Vendedor', duration: `${experienceYears} anos`, description: 'Descrição genérica.' }],
              courses: [],
              availability: isCompatible ? 'Período integral' : 'Apenas meio período',
              contact: {
                  phone: `(19) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
                  email: `${name.split(' ')[0].toLowerCase()}@example.com`
              },
              personalSummary: `Profissional com ${experienceYears} anos de experiência, buscando novos desafios.`,
              conducaoPropria: Math.random() > 0.5 ? 'Sim' : 'Não',
              motivo: isCompatible 
                ? motivationQuotes.compatible[Math.floor(Math.random() * motivationQuotes.compatible.length)]
                : motivationQuotes.incompatible[Math.floor(Math.random() * motivationQuotes.incompatible.length)],
            }
        };

        const historicalChance = Math.random();
        if (historicalChance > 0.7) { 
            const talent: Talent = {
                id: talentIdCounter++,
                originalCandidateId: candidateData.id,
                name: candidateData.name,
                age: candidateData.age,
                city: candidateData.location.split('(')[0].trim(),
                education: candidateData.education,
                experience: candidateData.experience,
                skills: candidateData.skills,
                potential: candidateData.fitScore,
                status: isCompatible ? 'Rejeitado (Entrevista)' : 'Rejeitado (Triagem)',
                desiredPosition: job.title,
                gender: candidateData.gender,
                rejectionReason: isCompatible
                    ? interviewRejectionReasons[Math.floor(Math.random() * interviewRejectionReasons.length)]
                    : screeningRejectionReasons[Math.floor(Math.random() * screeningRejectionReasons.length)],
            };
            pastTalents.push(talent);
        } else {
            const appDate = new Date(candidateData.applicationDate);
            const now = new Date();
            const daysSinceApplication = (now.getTime() - appDate.getTime()) / (1000 * 3600 * 24);

            let status: CandidateStatus = 'applied';
            let interview: CandidateInterview | undefined = undefined;
            let hireDate: string | undefined = undefined;

            if (daysSinceApplication > 7) {
                if (isCompatible) {
                    const interviewDate = new Date(appDate);
                    interviewDate.setDate(appDate.getDate() + Math.floor(Math.random() * 5) + 2);

                    interview = {
                        date: interviewDate.toISOString().split('T')[0],
                        time: `${String(Math.floor(Math.random() * 9) + 8).padStart(2, '0')}:00`,
                        location: 'Online (Google Meet)',
                        interviewers: [USERS[Math.floor(Math.random() * USERS.length)].username],
                        notes: 'Entrevista de triagem.',
                        noShow: Math.random() > 0.9 
                    };

                    if (interviewDate < now) {
                        if (interview.noShow) {
                            status = 'rejected';
                        } else if (Math.random() > 0.5) {
                            status = 'hired';
                            const hireDateObj = new Date(interviewDate);
                            hireDateObj.setDate(interviewDate.getDate() + 3);
                            hireDate = hireDateObj.toISOString();
                        } else {
                            status = 'rejected';
                        }
                    } else {
                        status = 'approved';
                    }
                } else {
                    status = 'rejected';
                }
            }

            const candidate: Candidate = {
                ...candidateData,
                status,
                interview,
                hireDate,
            };
            candidates.push(candidate);
        }
    }
    return { candidates, pastTalents };
};


const approvedSg01Candidates: Candidate[] = [
    {
        id: 201, name: 'Maria Eduarda Santos', age: 23, maritalStatus: 'Solteira', education: 'Ensino Médio Completo',
        experience: '3 anos em fast-food (Atendente e Auxiliar de Limpeza)', skills: ['Limpeza', 'Organização', 'Atendimento ao Cliente', 'Trabalho em Equipe', 'Agilidade'],
        summary: 'Profissional ágil e responsável, com experiência consolidada em fast-food.', location: 'Jardim Santa Genebra – Campinas, SP (3,2 km do Shopping Dom Pedro)',
        jobId: 'sg-01', fitScore: 9.8, status: 'approved', applicationDate: new Date().toISOString(), source: 'LinkedIn', isArchived: false, gender: 'female',
        resume: {
            professionalExperience: [{ company: 'McDonald’s', role: 'Atendente', duration: '2 anos', description: '' }, { company: 'Giraffas', role: 'Auxiliar de Limpeza', duration: '1 ano', description: '' }],
            courses: [{ name: 'Boas Práticas de Higiene', institution: 'N/A' }, { name: 'Atendimento ao Cliente', institution: 'N/A' }],
            availability: 'Período integral', contact: { phone: '(19) 98877-1298', email: 'maria.santos@example.com' }, personalSummary: 'Profissional ágil e responsável, com experiência consolidada em fast-food.',
            conducaoPropria: 'Sim (moto)', motivo: 'Quero crescer em uma rede que valoriza a qualidade e o ritmo de quem realmente veste a camisa.'
        }
    },
    {
        id: 202, name: 'Rafael Almeida', age: 25, maritalStatus: 'Casado', education: 'Ensino Médio Completo',
        experience: '2.5 anos em fast-food (Atendente e Cozinheiro)', skills: ['Limpeza', 'Organização', 'Suporte Geral', 'Trabalho em Equipe', 'Proatividade'],
        summary: 'Experiência sólida em redes de alimentação, proativo e ágil.', location: 'Parque das Universidades – Campinas, SP (4,8 km)',
        jobId: 'sg-01', fitScore: 9.5, status: 'approved', applicationDate: new Date().toISOString(), source: 'Indicação', isArchived: false, gender: 'male',
        resume: {
            professionalExperience: [{ company: 'Burger King', role: 'Atendente', duration: '1 ano e 6 meses', description: '' }, { company: 'Bob’s', role: 'Cozinheiro', duration: '1 ano', description: '' }],
            courses: [{ name: 'Manipulação de Alimentos', institution: 'N/A' }, { name: 'Segurança no Trabalho', institution: 'N/A' }],
            availability: 'Período integral', contact: { phone: '(19) 97764-3421', email: 'rafael.almeida@example.com' }, personalSummary: 'Experiência sólida em redes de alimentação, proativo e ágil.',
            conducaoPropria: 'Sim (carro)', motivo: 'Admiro o padrão do Lacoste Burger e quero contribuir para manter o nome da marca forte no atendimento.'
        }
    },
    {
        id: 203, name: 'Fernanda Souza', age: 28, maritalStatus: 'Solteira', education: 'Ensino Médio Completo',
        experience: '3 anos em fast-food e restaurante (Serviços Gerais e Auxiliar de Cozinha)', skills: ['Limpeza Profissional', 'Organização', 'Atendimento ao Cliente', 'Trabalho em Equipe', 'Pontualidade'],
        summary: 'Comprometida e pontual, com boa vivência no setor alimentício.', location: 'Jardim Santa Cândida – Campinas, SP (2,6 km)',
        jobId: 'sg-01', fitScore: 9.6, status: 'applied', applicationDate: new Date().toISOString(), source: 'Website', isArchived: false, gender: 'female',
        resume: {
            professionalExperience: [{ company: 'Habib’s', role: 'Serviços Gerais', duration: '2 anos', description: '' }, { company: 'Restaurante Popular', role: 'Auxiliar de Cozinha', duration: '1 ano', description: '' }],
            courses: [{ name: 'Limpeza Profissional', institution: 'N/A' }, { name: 'Organização e Rotina', institution: 'N/A' }],
            availability: 'Período integral', contact: { phone: '(19) 99488-3345', email: 'fernanda.souza@example.com' }, personalSummary: 'Comprometida e pontual, com boa vivência no setor alimentício.',
            conducaoPropria: 'Não', motivo: 'Quero fazer parte de uma equipe que valoriza o esforço e oferece oportunidade de crescimento.'
        }
    },
    {
        id: 204, name: 'João Victor Ferreira', age: 22, maritalStatus: 'Solteiro', education: 'Ensino Médio Completo',
        experience: '2.3 anos em fast-food (Auxiliar de Limpeza e Ajudante de Cozinha)', skills: ['Limpeza', 'Organização', 'Atendimento ao Cliente', 'Trabalho em Equipe', 'Comunicação'],
        summary: 'Jovem dedicado, comunicativo e com experiência em cozinha rápida.', location: 'Barão Geraldo – Campinas, SP (5,5 km)',
        jobId: 'sg-01', fitScore: 9.2, status: 'applied', applicationDate: new Date().toISOString(), source: 'Google Forms', isArchived: false, gender: 'male',
        resume: {
            professionalExperience: [{ company: 'Subway', role: 'Auxiliar de Limpeza', duration: '1 ano e 3 meses', description: '' }, { company: 'Giraffas', role: 'Ajudante de Cozinha', duration: '1 ano', description: '' }],
            courses: [{ name: 'Atendimento e Boas Práticas de Cozinha', institution: 'N/A' }],
            availability: 'Período integral', contact: { phone: '(19) 98801-6723', email: 'joao.ferreira@example.com' }, personalSummary: 'Jovem dedicado, comunicativo e com experiência em cozinha rápida.',
            conducaoPropria: 'Não', motivo: 'Gosto da dinâmica do ambiente de fast-food e quero crescer dentro da área de cozinha.'
        }
    },
    {
        id: 205, name: 'Camila Ribeiro', age: 24, maritalStatus: 'Solteira', education: 'Ensino Médio Completo',
        experience: '3 anos em restaurante (Serviços Gerais e Copeira)', skills: ['Limpeza', 'Organização', 'Suporte Geral', 'Trabalho em Equipe', 'Atenção aos Detalhes'],
        summary: 'Profissional organizada, atenta aos detalhes e com experiência em limpeza de cozinha industrial.', location: 'Jardim Santana – Campinas, SP (4,2 km)',
        jobId: 'sg-01', fitScore: 9.4, status: 'applied', applicationDate: new Date().toISOString(), source: 'LinkedIn', isArchived: false, gender: 'female',
        resume: {
            professionalExperience: [{ company: 'Ragazzo', role: 'Serviços Gerais', duration: '2 anos', description: '' }, { company: 'Restaurante Universitário', role: 'Copeira', duration: '1 ano', description: '' }],
            courses: [{ name: 'Higienização de Superfícies', institution: 'N/A' }, { name: 'Atendimento Interno', institution: 'N/A' }],
            availability: 'Período integral', contact: { phone: '(19) 98111-4382', email: 'camila.ribeiro@example.com' }, personalSummary: 'Profissional organizada, atenta aos detalhes e com experiência em limpeza de cozinha industrial.',
            conducaoPropria: 'Não', motivo: 'Sempre quis trabalhar em um restaurante com padrão moderno e boa equipe como o Lacoste Burger.'
        }
    },
    {
        id: 206, name: 'Bruno Cardoso', age: 26, maritalStatus: 'Casado', education: 'Ensino Médio Completo',
        experience: '2.8 anos em fast-food (Serviços Gerais e Ajudante de Cozinha)', skills: ['Limpeza', 'Organização', 'Atendimento ao Cliente', 'Trabalho em Equipe', 'Responsabilidade'],
        summary: 'Responsável e habituado ao ritmo de restaurantes.', location: 'Jardim Pauliceia – Campinas, SP (6,1 km)',
        jobId: 'sg-01', fitScore: 8.8, status: 'applied', applicationDate: new Date().toISOString(), source: 'Indeed', isArchived: false, gender: 'male',
        resume: {
            professionalExperience: [{ company: 'McDonald’s', role: 'Auxiliar de Serviços Gerais', duration: '2 anos', description: '' }, { company: 'Habib’s', role: 'Ajudante de Cozinha', duration: '8 meses', description: '' }],
            courses: [{ name: 'Segurança Alimentar', institution: 'N/A' }, { name: 'Organização e Limpeza', institution: 'N/A' }],
            availability: 'Período integral', contact: { phone: '(19) 98711-3298', email: 'bruno.cardoso@example.com' }, personalSummary: 'Responsável e habituado ao ritmo de restaurantes.',
            conducaoPropria: 'Sim (carro)', motivo: 'Procuro estabilidade e admiro o padrão de qualidade do Lacoste Burger.'
        }
    },
    {
        id: 207, name: 'Larissa Pires', age: 21, maritalStatus: 'Solteira', education: 'Ensino Médio Completo',
        experience: '2.5 anos (Atendente e Auxiliar de Limpeza)', skills: ['Limpeza de Cozinha', 'Organização', 'Atendimento ao Cliente', 'Suporte Geral', 'Trabalho em Equipe'],
        summary: 'Comunicativa e disposta a aprender.', location: 'Jardim Aurélia – Campinas, SP (7,0 km)',
        jobId: 'sg-01', fitScore: 8.5, status: 'applied', applicationDate: new Date().toISOString(), source: 'Website', isArchived: false, gender: 'female',
        resume: {
            professionalExperience: [{ company: 'Bob’s', role: 'Atendente', duration: '1 ano e 5 meses', description: '' }, { company: 'Escola Particular', role: 'Auxiliar de Limpeza', duration: '1 ano', description: '' }],
            courses: [{ name: 'Atendimento ao Cliente', institution: 'N/A' }, { name: 'Limpeza de Cozinha', institution: 'N/A' }],
            availability: 'Período integral', contact: { phone: '(19) 98900-2435', email: 'larissa.pires@example.com' }, personalSummary: 'Comunicativa e disposta a aprender.',
            conducaoPropria: 'Não', motivo: 'Quero fazer parte de um time jovem e dinâmico, com oportunidades reais de crescimento.'
        }
    },
    {
        id: 208, name: 'Diego Monteiro', age: 27, maritalStatus: 'Casado', education: 'Ensino Médio Completo',
        experience: '3 anos em fast-food (Limpeza e Auxiliar de Cozinha)', skills: ['Limpeza', 'Organização', 'Atendimento ao Cliente', 'Trabalho em Equipe', 'Agilidade'],
        summary: 'Experiência em redes de fast-food, ágil e comprometido.', location: 'Jardim Santa Genebra II – Campinas, SP (3,9 km)',
        jobId: 'sg-01', fitScore: 9.7, status: 'applied', applicationDate: new Date().toISOString(), source: 'LinkedIn', isArchived: false, gender: 'male',
        resume: {
            professionalExperience: [{ company: 'Burger King', role: 'Limpeza', duration: '2 anos', description: '' }, { company: 'Bob’s', role: 'Auxiliar de Cozinha', duration: '1 ano', description: '' }],
            courses: [{ name: 'Boas Práticas em Manipulação de Alimentos', institution: 'N/A' }],
            availability: 'Período integral', contact: { phone: '(19) 99100-5508', email: 'diego.monteiro@example.com' }, personalSummary: 'Experiência em redes de fast-food, ágil e comprometido.',
            conducaoPropria: 'Sim (moto)', motivo: 'Gosto do ritmo intenso e quero contribuir com minha experiência em limpeza e cozinha rápida.'
        }
    },
    {
        id: 209, name: 'Juliana Martins', age: 30, maritalStatus: 'Casada', education: 'Ensino Médio Completo',
        experience: '2.4 anos em fast-food (Serviços Gerais)', skills: ['Limpeza Industrial', 'Organização', 'Atendimento ao Cliente', 'Suporte Geral', 'Trabalho em Equipe'],
        summary: 'Dedicada, pontual e com boa comunicação.', location: 'Cidade Universitária – Campinas, SP (4,5 km)',
        jobId: 'sg-01', fitScore: 9.3, status: 'applied', applicationDate: new Date().toISOString(), source: 'Indicação', isArchived: false, gender: 'female',
        resume: {
            professionalExperience: [{ company: 'Giraffas', role: 'Serviços Gerais', duration: '2 anos e 4 meses', description: '' }],
            courses: [{ name: 'Organização de Estoque', institution: 'N/A' }, { name: 'Limpeza Industrial', institution: 'N/A' }],
            availability: 'Período integral', contact: { phone: '(19) 99510-9844', email: 'juliana.martins@example.com' }, personalSummary: 'Dedicada, pontual e com boa comunicação.',
            conducaoPropria: 'Não', motivo: 'Procuro um lugar onde meu esforço diário seja reconhecido e recompensado.'
        }
    },
    {
        id: 210, name: 'Felipe Barbosa', age: 24, maritalStatus: 'Solteiro', education: 'Ensino Médio Completo',
        experience: '3 anos em fast-food e restaurante (Ajudante de Cozinha e Serviços Gerais)', skills: ['Limpeza', 'Organização', 'Atendimento ao Cliente', 'Trabalho em Equipe', 'Disciplina'],
        summary: 'Disciplinado e acostumado ao ambiente de alta demanda.', location: 'Jardim Chapadão – Campinas, SP (6,3 km)',
        jobId: 'sg-01', fitScore: 8.9, status: 'applied', applicationDate: new Date().toISOString(), source: 'Google Forms', isArchived: false, gender: 'male',
        resume: {
            professionalExperience: [{ company: 'Habib’s', role: 'Ajudante de Cozinha', duration: '2 anos', description: '' }, { company: 'Restaurante Popular', role: 'Serviços Gerais', duration: '1 ano', description: '' }],
            courses: [{ name: 'Segurança do Trabalho', institution: 'N/A' }, { name: 'Boas Práticas em Alimentação', institution: 'N/A' }],
            availability: 'Período integral', contact: { phone: '(19) 99288-1177', email: 'felipe.barbosa@example.com' }, personalSummary: 'Disciplinado e acostumado ao ambiente de alta demanda.',
            conducaoPropria: 'Sim (moto)', motivo: 'Quero aplicar minha experiência em um restaurante reconhecido por seu atendimento e limpeza exemplar.'
        }
    },
    {
        id: 211, name: 'Ana Paula Freitas', age: 29, maritalStatus: 'Solteira', education: 'Ensino Médio Completo',
        experience: '3 anos em fast-food (Copeira e Auxiliar de Limpeza)', skills: ['Limpeza', 'Organização', 'Suporte Geral', 'Trabalho em Equipe', 'Eficiência'],
        summary: 'Eficiente e detalhista, com foco em limpeza e agilidade.', location: 'Vila Costa e Silva – Campinas, SP (3,5 km)',
        jobId: 'sg-01', fitScore: 9.5, status: 'applied', applicationDate: new Date().toISOString(), source: 'LinkedIn', isArchived: false, gender: 'female',
        resume: {
            professionalExperience: [{ company: 'Bob’s', role: 'Copeira', duration: '1 ano', description: '' }, { company: 'Habib’s', role: 'Auxiliar de Limpeza', duration: '2 anos', description: '' }],
            courses: [{ name: 'Higiene Alimentar', institution: 'N/A' }, { name: 'Atendimento Interno', institution: 'N/A' }],
            availability: 'Período integral', contact: { phone: '(19) 98145-3379', email: 'anapaula.freitas@example.com' }, personalSummary: 'Eficiente e detalhista, com foco em limpeza e agilidade.',
            conducaoPropria: 'Não', motivo: 'Quero crescer profissionalmente em um ambiente de trabalho organizado e moderno.'
        }
    },
    {
        id: 212, name: 'Leandro Nascimento', age: 31, maritalStatus: 'Casado', education: 'Ensino Médio Completo',
        experience: '4 anos em limpeza e manutenção (Fast-food e Shopping)', skills: ['Limpeza', 'Organização', 'Atendimento ao Cliente', 'Suporte Geral', 'Trabalho em Equipe'],
        summary: 'Experiência em limpeza comercial e manutenção.', location: 'Jardim Santa Marcelina – Campinas, SP (2,9 km)',
        jobId: 'sg-01', fitScore: 9.8, status: 'applied', applicationDate: new Date().toISOString(), source: 'Indicação', isArchived: false, gender: 'male',
        resume: {
            professionalExperience: [{ company: 'Burger King', role: 'Limpeza', duration: '3 anos', description: '' }, { company: 'Shopping Dom Pedro', role: 'Auxiliar de Manutenção', duration: '1 ano', description: '' }],
            courses: [{ name: 'NR-35', institution: 'N/A' }, { name: 'Higiene Profissional', institution: 'N/A' }],
            availability: 'Período integral', contact: { phone: '(19) 98980-6652', email: 'leandro.nascimento@example.com' }, personalSummary: 'Experiência em limpeza comercial e manutenção.',
            conducaoPropria: 'Sim (carro)', motivo: 'Conheço o ambiente do shopping e quero contribuir com meu trabalho para manter o padrão do restaurante.'
        }
    }
];

const generateRejectedSg01Candidates = (): Candidate[] => {
    const rejectedCandidates: Candidate[] = [];
    
    for (let i = 0; i < 38; i++) {
        const gender: 'male' | 'female' = Math.random() > 0.5 ? 'male' : 'female';
        const nameList = gender === 'male' ? names.male : names.female;
        const name = `${nameList[Math.floor(Math.random() * nameList.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;

        const candidate: Candidate = {
            id: candidateIdCounter++,
            name: name,
            age: Math.floor(Math.random() * 25) + 18,
            gender: gender,
            maritalStatus: maritalStatusOptions[gender][Math.floor(Math.random() * maritalStatusOptions[gender].length)],
            location: farLocations[Math.floor(Math.random() * farLocations.length)],
            experience: 'Experiência em áreas não relacionadas.',
            education: Math.random() > 0.5 ? 'Ensino Médio Incompleto' : 'Ensino Fundamental Completo',
            skills: ['Vendas', 'Marketing Digital'],
            summary: 'Perfil com pouca clareza ou sem aderência à vaga.',
            jobId: 'sg-01',
            fitScore: parseFloat((Math.random() * 3.5 + 1).toFixed(1)), // Score between 1.0 and 4.5
            status: 'applied',
            applicationDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
            source: sourcesOptions[Math.floor(Math.random() * sourcesOptions.length)],
            isArchived: false,
            resume: {
                professionalExperience: [{ company: 'Loja de Varejo', role: 'Vendedor', duration: '1 ano', description: '' }],
                courses: [],
                availability: 'Apenas meio período',
                contact: { phone: `(19) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`, email: `rejeitado${i}@example.com` },
                personalSummary: 'Busco qualquer oportunidade de trabalho.',
                conducaoPropria: Math.random() > 0.5 ? 'Sim' : 'Não',
                motivo: motivationQuotes.incompatible[Math.floor(Math.random() * motivationQuotes.incompatible.length)],
            }
        };
        rejectedCandidates.push(candidate);
    }
    return rejectedCandidates;
}

const sg01Candidates = [...approvedSg01Candidates, ...generateRejectedSg01Candidates()];


// --- New Data Generation ---
const otherJobsPopulation = INITIAL_JOBS
    .filter(j => j.id !== 'sg-01')
    .map(job => {
        // Adjust population count for specific jobs to get fewer hires
        const count = (job.id === 'gf-01' || job.id === 'ga-01') ? 8 : 40;
        return generateJobPopulation(job.id, count);
    });

const otherJobsCandidates = otherJobsPopulation.map(p => p.candidates).flat();
const otherJobsTalents = otherJobsPopulation.map(p => p.pastTalents).flat();

export const INITIAL_CANDIDATES: Candidate[] = [
    ...sg01Candidates,
    ...otherJobsCandidates,
];

export const INITIAL_TALENT_POOL: Talent[] = [
  {
    id: 9001,
    name: 'Ana Beatriz Moreira',
    age: 26,
    gender: 'female',
    city: 'Campinas',
    education: 'Graduação em Administração - UNIP',
    experience: '4 anos em franquias alimentícias (McDonalds e Habib’s)',
    skills: ['Gestão de equipe', 'Atendimento', 'Comunicação', 'Liderança'],
    potential: 9.2,
    status: 'Disponível',
    desiredPosition: 'Supervisora de Operações',
  },
  {
    id: 9002,
    name: 'Carlos Eduardo Silva',
    age: 29,
    gender: 'male',
    city: 'Campinas',
    education: 'Graduação em Marketing - PUC-Campinas',
    experience: '5 anos em marketing digital e gestão de marca para restaurantes',
    skills: ['Branding', 'Mídias Sociais', 'Campanhas', 'Gestão de tráfego'],
    potential: 9.5,
    status: 'Disponível',
    desiredPosition: 'Coordenador de Marketing',
  },
  {
    id: 9003,
    name: 'Luiza Fernandes',
    age: 32,
    gender: 'female',
    city: 'Campinas',
    education: 'Graduação em Administração + MBA em Gestão de Negócios - UNICAMP',
    experience: '7 anos em gestão administrativa e financeira de franquias alimentícias',
    skills: ['Gestão Financeira', 'Planejamento Estratégico', 'Liderança', 'Treinamento de Equipe'],
    potential: 9.8,
    status: 'Disponível',
    desiredPosition: 'Gerente Geral',
  },
  ...otherJobsTalents
];

// Mock data for KPIs that are outside the scope of a recruitment system
export const HIRE_METRICS = {
  totalEmployees: 50,
  departuresLastMonth: 2, // for turnover
  absenteeismHoursLastMonth: 120, // for absenteeism
  totalWorkHoursLastMonth: 50 * 8 * 22, // 50 employees, 8h/day, 22 work days
};

export const INITIAL_MESSAGES: Message[] = [];
