/**
 * Seed completo: escolas, turmas, professores, alunos e jogos concluídos com histórico.
 * Cada aluno tem 365 dias simulados com escolhas reais e efeitos calculados.
 */

const postgres = require("postgres");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------

const TOTAL_DAYS = 365;
const STARTING_MONEY = 500;
const STARTING_KNOWLEDGE = 20;
const STARTING_HAPPINESS = 70;
const STARTING_ENERGY = 100;
const STARTING_HEALTH = 100;

const PROFESSIONS = [
  { id: "vendedor_ambulante", name: "Vendedor Ambulante", baseSalary: 1800 },
  { id: "cabeleireiro",       name: "Cabeleireiro(a)",   baseSalary: 2200 },
  { id: "tecnico_ti",         name: "Técnico em TI",     baseSalary: 2800 },
  { id: "contador",           name: "Contador(a)",        baseSalary: 3200 },
  { id: "enfermeiro",         name: "Enfermeiro(a)",      baseSalary: 3500 },
  { id: "engenheiro",         name: "Engenheiro(a)",      baseSalary: 4000 },
  { id: "advogado",           name: "Advogado(a)",        baseSalary: 3800 },
  { id: "medico",             name: "Médico(a)",          baseSalary: 4500 },
];

const WORK_STORIES = [
  "Dia cheio no trabalho",
  "Meta batida com sucesso",
  "Reunião de resultados",
  "Atendimento ao cliente",
  "Relatório entregue no prazo",
  "Novo projeto iniciado",
  "Capacitação interna da empresa",
  "Apresentação para a diretoria",
  "Plantão extraordinário",
  "Fechamento de contrato importante",
  "Treinamento de novos colegas",
  "Auditoria do departamento",
];

const STUDY_STORIES = [
  "Leitura sobre educação financeira",
  "Aula de investimentos",
  "Revisão de matemática financeira",
  "Pesquisa sobre reserva de emergência",
  "Estudo de juros compostos",
  "Leitura de livro de finanças",
  "Simulado de planejamento financeiro",
  "Videoaula sobre bolsa de valores",
  "Podcast sobre independência financeira",
  "Análise do extrato bancário",
  "Planilha de gastos pessoais",
  "Curso rápido sobre poupança",
];

const LEISURE_STORIES = [
  "Saída com amigos",
  "Cinema com a família",
  "Passeio no parque",
  "Jogo de futebol com colegas",
  "Churrasco em casa",
  "Visita a parentes",
  "Show de música no centro",
  "Tarde de jogos",
  "Caminhada e meditação",
  "Leitura de entretenimento",
  "Série no streaming",
  "Restaurante novo na cidade",
];

// Profile: cada perfil define as probabilidades de escolha por dia
const PROFILES = {
  trabalhador: {
    label: "Trabalhador dedicado",
    morning: (day, s) => {
      if (s.energy < 20) return "LAZER";
      return Math.random() < 0.80 ? "TRABALHAR" : "LAZER";
    },
    overtime: (morning, s) => morning === "TRABALHAR" && Math.random() < 0.65 && s.energy > 25,
    evening: (morning, s) => {
      if (s.energy < 15) return "DORMIR";
      return Math.random() < 0.70 ? "DORMIR" : (Math.random() < 0.5 ? "ESTUDAR" : "LAZER");
    },
  },
  estudioso: {
    label: "Estudante focado",
    morning: (day, s) => {
      if (s.energy < 15) return "LAZER";
      return Math.random() < 0.55 ? "ESTUDAR" : (Math.random() < 0.7 ? "TRABALHAR" : "LAZER");
    },
    overtime: () => false,
    evening: (morning, s) => {
      if (s.energy < 20) return "DORMIR";
      return Math.random() < 0.65 ? "ESTUDAR" : (Math.random() < 0.6 ? "DORMIR" : "LAZER");
    },
  },
  equilibrado: {
    label: "Perfil equilibrado",
    morning: (day, s) => {
      if (s.energy < 20) return "LAZER";
      const r = Math.random();
      if (r < 0.55) return "TRABALHAR";
      if (r < 0.75) return "ESTUDAR";
      return "LAZER";
    },
    overtime: (morning, s) => morning === "TRABALHAR" && Math.random() < 0.35 && s.energy > 30,
    evening: (morning, s) => {
      if (s.energy < 15) return "DORMIR";
      const r = Math.random();
      if (r < 0.40) return "DORMIR";
      if (r < 0.70) return "ESTUDAR";
      return "LAZER";
    },
  },
  festeiro: {
    label: "Festeiro",
    morning: (day, s) => {
      if (s.money < 300) return "TRABALHAR";
      const r = Math.random();
      if (r < 0.40) return "LAZER";
      if (r < 0.75) return "TRABALHAR";
      return "FALTAR";
    },
    overtime: () => false,
    evening: (morning, s) => {
      const r = Math.random();
      if (r < 0.50) return "LAZER";
      if (r < 0.75) return "DORMIR";
      return "ESTUDAR";
    },
  },
  ambicioso: {
    label: "Ambicioso",
    morning: (day, s) => {
      if (s.energy < 15) return "DORMIR_FORCA";
      return Math.random() < 0.85 ? "TRABALHAR" : "ESTUDAR";
    },
    overtime: (morning, s) => morning === "TRABALHAR" && Math.random() < 0.80 && s.energy > 20,
    evening: (morning, s) => {
      if (s.energy < 15) return "DORMIR";
      return Math.random() < 0.55 ? "ESTUDAR" : (Math.random() < 0.7 ? "DORMIR" : "LAZER");
    },
  },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function simulateDay(state, profile, day) {
  const morning = profile.morning(day, state);
  const actualMorning = morning === "DORMIR_FORCA" ? "LAZER" : morning;
  const hasOvertime = profile.overtime(actualMorning, state);
  const evening = profile.evening(actualMorning, state);

  const effects = { money: 0, knowledge: 0, happiness: -2, energy: -3, health: 0 };

  // Morning effects
  switch (actualMorning) {
    case "TRABALHAR":
      effects.money += Math.round(state.profession.baseSalary * 0.08);
      effects.energy -= 12;
      effects.happiness -= 4;
      break;
    case "LAZER":
      effects.money -= 20;
      effects.happiness += 10;
      effects.energy += 4;
      break;
    case "ESTUDAR":
      effects.knowledge += 10;
      effects.energy -= 9;
      effects.happiness -= 3;
      break;
    case "FALTAR":
      effects.money -= 65;
      effects.happiness += 6;
      effects.energy += 7;
      break;
  }

  // Overtime
  if (hasOvertime) {
    effects.money += 65;
    effects.energy -= 11;
    effects.happiness -= 5;
  }

  // Evening effects
  switch (evening) {
    case "ESTUDAR":
      effects.knowledge += 8;
      effects.energy -= 7;
      effects.happiness -= 2;
      break;
    case "LAZER":
      effects.money -= 25;
      effects.happiness += 12;
      effects.energy += 6;
      break;
    case "DORMIR":
      effects.energy += 14;
      effects.happiness += 2;
      break;
  }

  // Determine event type and story
  const hasLazer = actualMorning === "LAZER" || evening === "LAZER";
  let eventType, eventTitle;

  if (actualMorning === "TRABALHAR") {
    eventType = "TRABALHO_ROTINA";
    eventTitle = pick(WORK_STORIES) + (hasOvertime ? " (hora extra)" : "");
  } else if (actualMorning === "ESTUDAR" || evening === "ESTUDAR") {
    eventType = "ESTUDO_ROTINA";
    eventTitle = pick(STUDY_STORIES);
  } else if (hasLazer) {
    eventType = "LAZER_ROTINA";
    eventTitle = pick(LEISURE_STORIES);
  } else {
    eventType = "ROTINA_DIARIA";
    eventTitle = "Dia em casa descansando";
  }

  const choiceMade = [
    `Manha:${actualMorning}`,
    `Extra:${hasOvertime ? "SIM" : "NAO"}`,
    `Noite:${evening}`,
    `StressGain:0`,
    `HasLazer:${hasLazer ? "1" : "0"}`,
  ].join("|");

  // Apply and clamp new state
  const newState = {
    money: Math.max(0, state.money + effects.money),
    knowledge: clamp(state.knowledge + effects.knowledge, 0, 100),
    happiness: clamp(state.happiness + effects.happiness, 5, 100),
    energy: clamp(state.energy + effects.energy, 5, 100),
    health: clamp(state.health + (effects.health || 0), 5, 100),
    profession: state.profession,
  };

  return { newState, effects, eventType, eventTitle, choiceMade };
}

function simulateGame(profession, profileName) {
  const profile = PROFILES[profileName];
  let state = {
    money: STARTING_MONEY,
    knowledge: STARTING_KNOWLEDGE,
    happiness: STARTING_HAPPINESS,
    energy: STARTING_ENERGY,
    health: STARTING_HEALTH,
    profession,
  };

  const logs = [];
  for (let day = 1; day <= TOTAL_DAYS; day++) {
    const result = simulateDay(state, profile, day);
    logs.push({
      day,
      event_type: result.eventType,
      event_title: result.eventTitle,
      choice_made: result.choiceMade,
      effects: result.effects,
    });
    state = result.newState;
  }

  return { finalState: state, logs };
}

// ---------------------------------------------------------------------------
// SCHOOL / USER DATA
// ---------------------------------------------------------------------------

const SCHOOLS = [
  {
    name: "Escola Municipal João de Barro",
    admin: { name: "Carlos Mendes",  email: "carlos.mendes@joaodebarro.edu.br" },
    teachers: [
      { name: "Ana Lima",      email: "ana.lima@joaodebarro.edu.br" },
      { name: "Roberto Santos", email: "roberto.santos@joaodebarro.edu.br" },
    ],
    classrooms: [
      {
        name: "9° Ano A",
        teacherIndex: 0,
        students: [
          { name: "Lucas Ferreira",    email: "lucas.f@aluno.jb.br",    charName: "Lucas",    profId: "tecnico_ti",    profile: "trabalhador" },
          { name: "Mariana Costa",     email: "mariana.c@aluno.jb.br",  charName: "Mari",     profId: "contador",      profile: "estudioso" },
          { name: "Pedro Alves",       email: "pedro.a@aluno.jb.br",    charName: "Pedro",    profId: "vendedor_ambulante", profile: "festeiro" },
          { name: "Julia Sousa",       email: "julia.s@aluno.jb.br",    charName: "Ju",       profId: "engenheiro",    profile: "equilibrado" },
          { name: "Thiago Rocha",      email: "thiago.r@aluno.jb.br",   charName: "Thi",      profId: "cabeleireiro",  profile: "trabalhador" },
          { name: "Beatriz Nunes",     email: "beatriz.n@aluno.jb.br",  charName: "Bia",      profId: "enfermeiro",    profile: "estudioso" },
          { name: "Felipe Carvalho",   email: "felipe.c@aluno.jb.br",   charName: "Lipe",     profId: "advogado",      profile: "ambicioso" },
        ],
      },
      {
        name: "9° Ano B",
        teacherIndex: 1,
        students: [
          { name: "Gabriela Martins",  email: "gabriela.m@aluno.jb.br", charName: "Gabi",     profId: "medico",        profile: "estudioso" },
          { name: "Rafael Oliveira",   email: "rafael.o@aluno.jb.br",   charName: "Rafa",     profId: "tecnico_ti",    profile: "equilibrado" },
          { name: "Larissa Barbosa",   email: "larissa.b@aluno.jb.br",  charName: "Lari",     profId: "cabeleireiro",  profile: "festeiro" },
          { name: "Diego Pereira",     email: "diego.p@aluno.jb.br",    charName: "Diego",    profId: "vendedor_ambulante", profile: "ambicioso" },
          { name: "Camila Torres",     email: "camila.t@aluno.jb.br",   charName: "Cami",     profId: "engenheiro",    profile: "equilibrado" },
          { name: "Bruno Lima",        email: "bruno.l@aluno.jb.br",    charName: "Bruno",    profId: "contador",      profile: "trabalhador" },
          { name: "Amanda Ribeiro",    email: "amanda.r@aluno.jb.br",   charName: "Manda",    profId: "advogado",      profile: "estudioso" },
        ],
      },
    ],
  },
  {
    name: "Colégio Estadual Tiradentes",
    admin: { name: "Maria da Silva",  email: "maria.silva@tiradentes.edu.br" },
    teachers: [
      { name: "Julia Ferreira",   email: "julia.ferreira@tiradentes.edu.br" },
      { name: "Marcos Oliveira",  email: "marcos.oliveira@tiradentes.edu.br" },
    ],
    classrooms: [
      {
        name: "1° Ano A",
        teacherIndex: 0,
        students: [
          { name: "Victor Hugo",      email: "victor.h@aluno.tira.br",   charName: "Vic",      profId: "engenheiro",    profile: "ambicioso" },
          { name: "Fernanda Gomes",   email: "fernanda.g@aluno.tira.br", charName: "Fer",      profId: "medico",        profile: "estudioso" },
          { name: "Eduardo Santos",   email: "eduardo.s@aluno.tira.br",  charName: "Edu",      profId: "contador",      profile: "equilibrado" },
          { name: "Patricia Melo",    email: "patricia.m@aluno.tira.br", charName: "Pati",     profId: "cabeleireiro",  profile: "festeiro" },
          { name: "Gustavo Lima",     email: "gustavo.l@aluno.tira.br",  charName: "Gus",      profId: "tecnico_ti",    profile: "trabalhador" },
          { name: "Isabela Neves",    email: "isabela.n@aluno.tira.br",  charName: "Isa",      profId: "enfermeiro",    profile: "equilibrado" },
        ],
      },
      {
        name: "2° Ano B",
        teacherIndex: 1,
        students: [
          { name: "Leonardo Pinto",   email: "leo.p@aluno.tira.br",      charName: "Leo",      profId: "advogado",      profile: "ambicioso" },
          { name: "Vanessa Castro",   email: "vanessa.c@aluno.tira.br",  charName: "Vane",     profId: "engenheiro",    profile: "estudioso" },
          { name: "Ricardo Moura",    email: "ricardo.m@aluno.tira.br",  charName: "Rick",     profId: "vendedor_ambulante", profile: "festeiro" },
          { name: "Bianca Araujo",    email: "bianca.a@aluno.tira.br",   charName: "Bi",       profId: "medico",        profile: "equilibrado" },
          { name: "Henrique Dias",    email: "henrique.d@aluno.tira.br", charName: "Heri",     profId: "contador",      profile: "trabalhador" },
          { name: "Tatiane Campos",   email: "tatiane.c@aluno.tira.br",  charName: "Tati",     profId: "tecnico_ti",    profile: "estudioso" },
        ],
      },
    ],
  },
  {
    name: "Instituto Educacional Futuro",
    admin: { name: "Pedro Costa",  email: "pedro.costa@instfuturo.edu.br" },
    teachers: [
      { name: "Beatriz Souza",  email: "beatriz.souza@instfuturo.edu.br" },
    ],
    classrooms: [
      {
        name: "Turma Única",
        teacherIndex: 0,
        students: [
          { name: "Rodrigo Freitas",  email: "rodrigo.f@aluno.if.br",   charName: "Rodri",    profId: "engenheiro",    profile: "ambicioso" },
          { name: "Aline Vieira",     email: "aline.v@aluno.if.br",     charName: "Aline",    profId: "medico",        profile: "estudioso" },
          { name: "Samuel Correia",   email: "samuel.c@aluno.if.br",    charName: "Sam",      profId: "advogado",      profile: "trabalhador" },
          { name: "Natalia Cunha",    email: "natalia.c@aluno.if.br",   charName: "Nati",     profId: "contador",      profile: "equilibrado" },
          { name: "Caio Mendonca",    email: "caio.m@aluno.if.br",      charName: "Caio",     profId: "tecnico_ti",    profile: "festeiro" },
          { name: "Leticia Barros",   email: "leticia.b@aluno.if.br",   charName: "Leti",     profId: "enfermeiro",    profile: "estudioso" },
          { name: "Igor Nascimento",  email: "igor.n@aluno.if.br",      charName: "Igor",     profId: "vendedor_ambulante", profile: "ambicioso" },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const sql = postgres(process.env.DATABASE_URL, { ssl: "require", prepare: false });
  const hash = await bcrypt.hash("senha123", 10);

  console.log("🌱 Iniciando seed...\n");

  try {
    for (const schoolData of SCHOOLS) {
      console.log(`🏫 Escola: ${schoolData.name}`);

      // Create school
      const [school] = await sql`
        INSERT INTO schools (name, plan_type, plan_price)
        VALUES (${schoolData.name}, 'ESCOLAR', 399.00)
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      let schoolId;
      if (school) {
        schoolId = school.id;
      } else {
        const existing = await sql`SELECT id FROM schools WHERE name = ${schoolData.name}`;
        schoolId = existing[0].id;
      }

      // Create admin
      await sql`
        INSERT INTO users (email, password_hash, name, role, school_id, plan_type, plan_price, active)
        VALUES (${schoolData.admin.email}, ${hash}, ${schoolData.admin.name}, 'ADMIN', ${schoolId}, 'ESCOLAR', 399.00, true)
        ON CONFLICT (email) DO UPDATE SET school_id = ${schoolId}, role = 'ADMIN', plan_type = 'ESCOLAR'
      `;
      console.log(`  👤 Admin: ${schoolData.admin.name}`);

      // Create teachers
      const teacherIds = [];
      for (const t of schoolData.teachers) {
        const [teacher] = await sql`
          INSERT INTO users (email, password_hash, name, role, school_id, plan_type, plan_price, active)
          VALUES (${t.email}, ${hash}, ${t.name}, 'PROFESSOR', ${schoolId}, 'ESCOLAR', 399.00, true)
          ON CONFLICT (email) DO UPDATE SET school_id = ${schoolId}, role = 'PROFESSOR', plan_type = 'ESCOLAR'
          RETURNING id
        `;
        let tid = teacher?.id;
        if (!tid) {
          const existing = await sql`SELECT id FROM users WHERE email = ${t.email}`;
          tid = existing[0].id;
        }
        teacherIds.push(tid);
        console.log(`  👨‍🏫 Professor: ${t.name}`);
      }

      // Create classrooms and students
      for (const classData of schoolData.classrooms) {
        const [classroom] = await sql`
          INSERT INTO classrooms (name, school_id)
          VALUES (${classData.name}, ${schoolId})
          ON CONFLICT DO NOTHING
          RETURNING id
        `;
        let classroomId;
        if (classroom) {
          classroomId = classroom.id;
        } else {
          const existing = await sql`SELECT id FROM classrooms WHERE name = ${classData.name} AND school_id = ${schoolId}`;
          classroomId = existing[0].id;
        }

        // Link teacher to classroom
        const teacherId = teacherIds[classData.teacherIndex];
        await sql`
          INSERT INTO classroom_teachers (classroom_id, user_id)
          VALUES (${classroomId}, ${teacherId})
          ON CONFLICT DO NOTHING
        `;

        console.log(`\n  📚 Turma: ${classData.name}`);

        // Create students + game sessions
        for (const studentData of classData.students) {
          const [studentRow] = await sql`
            INSERT INTO users (email, password_hash, name, role, school_id, plan_type, plan_price, active)
            VALUES (${studentData.email}, ${hash}, ${studentData.name}, 'ALUNO', ${schoolId}, 'ESCOLAR', 399.00, true)
            ON CONFLICT (email) DO UPDATE SET school_id = ${schoolId}, role = 'ALUNO', plan_type = 'ESCOLAR'
            RETURNING id
          `;
          let studentId = studentRow?.id;
          if (!studentId) {
            const existing = await sql`SELECT id FROM users WHERE email = ${studentData.email}`;
            studentId = existing[0].id;
          }

          // Enroll student in classroom
          await sql`
            INSERT INTO classroom_students (classroom_id, user_id)
            VALUES (${classroomId}, ${studentId})
            ON CONFLICT DO NOTHING
          `;

          // Simulate game
          const profession = PROFESSIONS.find(p => p.id === studentData.profId);
          const { finalState, logs } = simulateGame(profession, studentData.profile);

          // Delete old sessions for this user to avoid duplicates
          await sql`DELETE FROM game_sessions WHERE user_id = ${studentId}`;

          // Insert completed session
          const [session] = await sql`
            INSERT INTO game_sessions (
              user_id, character_name, profession_id,
              current_day, money, knowledge, happiness, energy, health,
              status, started_at, updated_at
            ) VALUES (
              ${studentId}, ${studentData.charName}, ${studentData.profId},
              ${TOTAL_DAYS + 1},
              ${Math.round(finalState.money)},
              ${Math.round(finalState.knowledge)},
              ${Math.round(finalState.happiness)},
              ${Math.round(finalState.energy)},
              ${Math.round(finalState.health)},
              'COMPLETED',
              NOW() - INTERVAL '370 days',
              NOW() - INTERVAL '5 days'
            ) RETURNING id
          `;
          const sessionId = session.id;

          // Batch insert day logs (chunks of 50)
          const CHUNK = 50;
          for (let i = 0; i < logs.length; i += CHUNK) {
            const chunk = logs.slice(i, i + CHUNK);
            const values = chunk.map(log => ({
              game_session_id: sessionId,
              day: log.day,
              event_type: log.event_type,
              event_title: log.event_title,
              choice_made: log.choice_made,
              dice_result: null,
              effects_applied: JSON.stringify(log.effects),
            }));
            await sql`INSERT INTO game_day_logs ${sql(values)}`;
          }

          const score = Math.round(
            finalState.money / 100 +
            finalState.knowledge +
            finalState.happiness +
            TOTAL_DAYS * 10
          );

          console.log(
            `     🎮 ${studentData.name.padEnd(20)} | ${profession.name.padEnd(20)} | ` +
            `R$${String(Math.round(finalState.money)).padStart(7)} | ` +
            `Conhec:${Math.round(finalState.knowledge).toString().padStart(3)} | ` +
            `Feliz:${Math.round(finalState.happiness).toString().padStart(3)} | ` +
            `Score: ${score}`
          );
        }
      }
      console.log();
    }

    console.log("✅ Seed concluído com sucesso!");
    console.log("🔑 Senha de todos os usuários: senha123");
  } finally {
    await sql.end();
  }
}

seed().catch(err => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
