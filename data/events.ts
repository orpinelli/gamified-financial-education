import type { GameEvent, PlayerStats } from "@/types/game";

export const GAME_EVENTS: GameEvent[] = [
  // --- TRABALHO ---
  {
    id: "hora_extra",
    title: "Oferta de Hora Extra",
    description:
      "Seu chefe perguntou se voce pode ficar ate mais tarde hoje. Paga bem, mas voce vai cansar.",
    category: "TRABALHO",
    icon: "Briefcase",
    options: [
      {
        id: "aceitar",
        label: "Aceitar",
        description: "Trabalhar mais e ganhar dinheiro extra",
        requiresDice: false,
        effects: { money: 150, energy: -20, happiness: -5 },
      },
      {
        id: "recusar",
        label: "Recusar",
        description: "Ir para casa descansar",
        requiresDice: false,
        effects: { energy: 10, happiness: 5 },
      },
    ],
  },
  {
    id: "freelance",
    title: "Proposta de Freelance",
    description:
      "Um conhecido ofereceu um trabalho por fora. Pode ser lucrativo, mas nao e garantido.",
    category: "TRABALHO",
    icon: "Laptop",
    options: [
      {
        id: "aceitar",
        label: "Tentar o freelance",
        description: "Rolar o dado para ver se o trabalho da certo",
        requiresDice: 1,
        effects: {},
        diceThreshold: 4,
        successEffects: { money: 300, energy: -15 },
        failureEffects: { energy: -20, happiness: -10 },
      },
      {
        id: "recusar",
        label: "Recusar educadamente",
        description: "Focar no seu trabalho atual",
        requiresDice: false,
        effects: { happiness: 3 },
      },
    ],
  },
  {
    id: "promocao_chance",
    title: "Chance de Promocao",
    description:
      "Ha uma vaga aberta para promocao no seu trabalho. Voce precisa se destacar!",
    category: "TRABALHO",
    icon: "TrendingUp",
    options: [
      {
        id: "competir",
        label: "Competir pela vaga",
        description: "Rolar dois dados - precisa de 8 ou mais para conseguir",
        requiresDice: 2,
        effects: {},
        diceThreshold: 8,
        successEffects: { money: 500, happiness: 20, knowledge: 5 },
        failureEffects: { happiness: -15, energy: -10 },
      },
      {
        id: "ficar",
        label: "Ficar na posicao atual",
        description: "Continuar como esta, sem riscos",
        requiresDice: false,
        effects: { happiness: -5 },
      },
    ],
  },

  // --- ESTUDO ---
  {
    id: "curso_online",
    title: "Curso Online Gratuito",
    description:
      "Voce encontrou um curso online gratuito na sua area. Requer tempo e dedicacao.",
    category: "ESTUDO",
    icon: "BookOpen",
    options: [
      {
        id: "estudar",
        label: "Fazer o curso",
        description: "Dedicar tempo ao estudo",
        requiresDice: false,
        effects: { knowledge: 12, energy: -15, happiness: -5 },
      },
      {
        id: "ignorar",
        label: "Ignorar",
        description: "Fazer outra coisa",
        requiresDice: false,
        effects: { happiness: 5 },
      },
    ],
  },
  {
    id: "palestra",
    title: "Palestra sobre Financas",
    description:
      "Uma palestra sobre educacao financeira esta acontecendo perto de voce. Entrada gratuita!",
    category: "ESTUDO",
    icon: "GraduationCap",
    options: [
      {
        id: "assistir",
        label: "Assistir a palestra",
        description: "Aprender sobre financas pessoais",
        requiresDice: false,
        effects: { knowledge: 8, energy: -5, happiness: 3 },
      },
      {
        id: "pular",
        label: "Pular",
        description: "Voce tem outras prioridades",
        requiresDice: false,
        effects: {},
      },
    ],
  },
  {
    id: "prova_certificacao",
    title: "Prova de Certificacao",
    description:
      "Existe uma prova de certificacao disponivel. Se passar, vai ajudar muito na carreira!",
    category: "ESTUDO",
    icon: "Award",
    options: [
      {
        id: "fazer_prova",
        label: "Fazer a prova",
        description: "Rolar dois dados - precisa de 7+ para passar",
        requiresDice: 2,
        effects: { money: -50 },
        diceThreshold: 7,
        successEffects: { knowledge: 20, happiness: 15 },
        failureEffects: { happiness: -15, knowledge: 3 },
      },
      {
        id: "adiar",
        label: "Adiar para depois",
        description: "Estudar mais antes de tentar",
        requiresDice: false,
        effects: { knowledge: 2 },
      },
    ],
  },

  // --- LAZER ---
  {
    id: "cinema_amigo",
    title: "Convite para o Cinema",
    description:
      "Um amigo te convidou para ir ao cinema. Vai ser divertido, mas custa um pouco.",
    category: "LAZER",
    icon: "Film",
    options: [
      {
        id: "ir",
        label: "Ir ao cinema",
        description: "Diversao e socializacao",
        requiresDice: false,
        effects: { money: -40, happiness: 15, energy: 5 },
      },
      {
        id: "ficar",
        label: "Ficar em casa",
        description: "Economizar o dinheiro",
        requiresDice: false,
        effects: { happiness: -5, energy: 10 },
      },
    ],
  },
  {
    id: "viagem_fim_semana",
    title: "Viagem de Fim de Semana",
    description:
      "Seus amigos estao planejando uma viagem rapida. E tentador!",
    category: "LAZER",
    icon: "MapPin",
    options: [
      {
        id: "viajar",
        label: "Viajar com amigos",
        description: "Gastar um pouco mais mas recuperar muito a felicidade",
        requiresDice: false,
        effects: { money: -200, happiness: 30, energy: 15, health: 5 },
      },
      {
        id: "ficar",
        label: "Ficar e economizar",
        description: "Guardar dinheiro para algo melhor",
        requiresDice: false,
        effects: { happiness: -10, money: 0 },
      },
    ],
  },
  {
    id: "academia",
    title: "Inscricao na Academia",
    description:
      "Voce viu uma promocao para se inscrever na academia. Bom para a saude!",
    category: "LAZER",
    icon: "Dumbbell",
    options: [
      {
        id: "inscrever",
        label: "Se inscrever",
        description: "Investir na sua saude",
        requiresDice: false,
        effects: { money: -80, health: 15, energy: 10, happiness: 5 },
      },
      {
        id: "passar",
        label: "Passar",
        description: "Nao gastar agora",
        requiresDice: false,
        effects: {},
      },
    ],
  },
  {
    id: "jogo_video_game",
    title: "Noite de Video Game",
    description:
      "Voce esta com vontade de jogar a noite toda. Relaxante mas pode afetar seu descanso.",
    category: "LAZER",
    icon: "Gamepad2",
    options: [
      {
        id: "jogar",
        label: "Jogar a noite toda",
        description: "Diversao maxima, energia minima amanha",
        requiresDice: false,
        effects: { happiness: 20, energy: -25 },
      },
      {
        id: "moderado",
        label: "Jogar so um pouco",
        description: "Equilibrar diversao e descanso",
        requiresDice: false,
        effects: { happiness: 8, energy: -5 },
      },
    ],
  },

  // --- INVESTIMENTO ---
  {
    id: "acao_empresa",
    title: "Acao de Empresa em Alta",
    description:
      "Uma empresa esta com acoes em alta. Pode ser uma boa hora para investir, mas e arriscado.",
    category: "INVESTIMENTO",
    icon: "TrendingUp",
    options: [
      {
        id: "investir",
        label: "Investir R$200",
        description: "Rolar dois dados - 7+ para lucrar, senao perde",
        requiresDice: 2,
        effects: { money: -200 },
        diceThreshold: 7,
        successEffects: { money: 400 },
        failureEffects: { money: -100, happiness: -10 },
      },
      {
        id: "observar",
        label: "Apenas observar",
        description: "Nao arriscar seu dinheiro",
        requiresDice: false,
        effects: { knowledge: 2 },
      },
    ],
  },
  {
    id: "poupanca",
    title: "Depositar na Poupanca",
    description:
      "Voce pensou em guardar um pouco de dinheiro na poupanca. Seguro mas rende pouco.",
    category: "INVESTIMENTO",
    icon: "PiggyBank",
    options: [
      {
        id: "depositar",
        label: "Depositar R$100",
        description: "Guardar com seguranca",
        requiresDice: false,
        effects: { money: -100, knowledge: 3 },
      },
      {
        id: "gastar",
        label: "Gastar em algo legal",
        description: "Aproveitar o dinheiro agora",
        requiresDice: false,
        effects: { happiness: 10 },
      },
    ],
  },
  {
    id: "crypto",
    title: "Oportunidade de Criptomoeda",
    description:
      "Alguem comentou sobre uma criptomoeda que pode subir muito. Altissimo risco!",
    category: "INVESTIMENTO",
    icon: "Coins",
    options: [
      {
        id: "investir",
        label: "Arriscar R$150",
        description: "Rolar dois dados - precisa de 9+ para lucrar grande",
        requiresDice: 2,
        effects: { money: -150 },
        diceThreshold: 9,
        successEffects: { money: 600 },
        failureEffects: { money: -150, happiness: -15 },
      },
      {
        id: "ignorar",
        label: "Ignorar a dica",
        description: "Muito arriscado para o seu gosto",
        requiresDice: false,
        effects: { knowledge: 1 },
      },
    ],
  },

  // --- ALEATORIO ---
  {
    id: "conta_luz",
    title: "Conta de Luz Chegou",
    description:
      "A conta de luz deste mes chegou. E preciso pagar para nao ter problemas.",
    category: "ALEATORIO",
    icon: "Zap",
    options: [
      {
        id: "pagar",
        label: "Pagar a conta",
        description: "R$120 - obrigacao mensal",
        requiresDice: false,
        effects: { money: -120 },
      },
      {
        id: "adiar",
        label: "Adiar o pagamento",
        description: "Pagar depois com multa (nao recomendado)",
        requiresDice: false,
        effects: { money: -50, happiness: -10 },
      },
    ],
  },
  {
    id: "doenca",
    title: "Voce Nao Esta se Sentindo Bem",
    description:
      "Voce acordou com dor de cabeca e mal estar. Pode ser algo simples ou nao.",
    category: "ALEATORIO",
    icon: "Thermometer",
    options: [
      {
        id: "medico",
        label: "Ir ao medico",
        description: "Gastar para cuidar da saude",
        requiresDice: false,
        effects: { money: -80, health: 20, energy: -5 },
      },
      {
        id: "ignorar",
        label: "Ignorar os sintomas",
        description: "Economizar mas arriscar a saude",
        requiresDice: 1,
        effects: {},
        diceThreshold: 4,
        successEffects: { health: 5 },
        failureEffects: { health: -25, energy: -15 },
      },
    ],
  },
  {
    id: "achado_rua",
    title: "Voce Encontrou Algo na Rua",
    description:
      "Andando pela rua, voce encontrou uma carteira no chao com dinheiro dentro.",
    category: "ALEATORIO",
    icon: "Search",
    options: [
      {
        id: "devolver",
        label: "Devolver ao dono",
        description: "Fazer a coisa certa",
        requiresDice: 1,
        effects: {},
        diceThreshold: 3,
        successEffects: { money: 50, happiness: 20 },
        failureEffects: { happiness: 15 },
      },
      {
        id: "ficar",
        label: "Ficar com o dinheiro",
        description: "R$80 a mais no bolso, mas com peso na consciencia",
        requiresDice: false,
        effects: { money: 80, happiness: -15 },
      },
    ],
  },
  {
    id: "conserto_urgente",
    title: "Conserto Urgente em Casa",
    description:
      "Algo quebrou na sua casa e precisa de reparo urgente. Nao da para adiar muito.",
    category: "ALEATORIO",
    icon: "Hammer",
    options: [
      {
        id: "consertar",
        label: "Chamar um profissional",
        description: "Resolver logo, mas custa caro",
        requiresDice: false,
        effects: { money: -200, happiness: 5 },
      },
      {
        id: "improviso",
        label: "Tentar consertar sozinho",
        description: "Rolar um dado para ver se consegue",
        requiresDice: 1,
        effects: {},
        diceThreshold: 3,
        successEffects: { money: -30, happiness: 10, knowledge: 3 },
        failureEffects: { money: -250, happiness: -10 },
      },
    ],
  },
  {
    id: "presente_inesperado",
    title: "Presente Inesperado",
    description:
      "Um parente distante te enviou um presente. Que surpresa boa!",
    category: "ALEATORIO",
    icon: "Gift",
    options: [
      {
        id: "aceitar",
        label: "Aceitar com alegria",
        description: "Um dia de sorte!",
        requiresDice: false,
        effects: { money: 100, happiness: 15 },
      },
    ],
  },
  {
    id: "multa_transito",
    title: "Multa de Transito",
    description:
      "Voce recebeu uma multa de transito que nem lembrava. Precisa resolver.",
    category: "ALEATORIO",
    icon: "AlertTriangle",
    options: [
      {
        id: "pagar",
        label: "Pagar a multa",
        description: "Pagar o valor integral de R$150",
        requiresDice: false,
        effects: { money: -150, happiness: -10 },
      },
      {
        id: "recorrer",
        label: "Recorrer da multa",
        description: "Rolar um dado - 5+ para cancelar",
        requiresDice: 1,
        effects: {},
        diceThreshold: 5,
        successEffects: { happiness: 20 },
        failureEffects: { money: -200, happiness: -15 },
      },
    ],
  },
];

export function getRandomEvent(day: number, stats: PlayerStats): GameEvent {
  const eligibleEvents = GAME_EVENTS.filter((event) => {
    if (event.triggerCondition) {
      return event.triggerCondition(day, stats);
    }
    return true;
  });

  const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
  return eligibleEvents[randomIndex];
}

export function isSalaryDay(day: number): boolean {
  return day > 0 && day % 30 === 0;
}

export const SALARY_EVENT: GameEvent = {
  id: "pagamento_salario",
  title: "Dia de Pagamento!",
  description: "Hoje e dia de receber seu salario. O dinheiro ja caiu na conta!",
  category: "PAGAMENTO",
  icon: "DollarSign",
  options: [
    {
      id: "receber",
      label: "Receber salario",
      description: "Seu salario foi depositado",
      requiresDice: false,
      effects: { happiness: 10 },
    },
  ],
};
