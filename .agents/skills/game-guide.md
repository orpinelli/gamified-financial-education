# Guia do Jogo — Educação Financeira Gamificada

## Visão Geral

O jogo simula **um ano de decisões financeiras** (365 dias = 12 meses de ~30 dias cada). O jogador assume o papel de um trabalhador recém-empregado e toma decisões do dia a dia que impactam seu patrimônio, bem-estar e conhecimento financeiro.

**Objetivo:** Chegar ao dia 365 com o maior score possível, equilibrando dinheiro, felicidade e conhecimento.

---

## Variáveis do Jogo

| Variável | Faixa | Descrição |
|---|---|---|
| 💰 Dinheiro | R$0 – sem limite | Saldo atual. Recebe R$2.000 todo 1º do mês |
| 😊 Felicidade | 0 – 100 | Qualidade de vida. Baixa felicidade envolve penalidades |
| 📚 Conhecimento | 0 – 100 | Acúmulo de educação financeira |
| 💳 Score de Crédito | 0 – 1000 | Análogo ao Serasa/SPC. Afeta reputação financeira |
| 🎯 Impulso | 0 – sem limite | Contador de compras impulsivas. Usado no perfil mensal |

---

## Fluxo de um Turno

```
1. AGUARDANDO_ROLETA
   → Tabuleiro + Roleta visíveis. Botão [RODAR] habilitado.

2. ROLANDO
   → Animação da roleta girando (~2s). Botão desabilitado.

3. MOVENDO
   → Avatar se desloca N casas no tabuleiro (animação 400ms/casa).

4. CARTA (se houver evento no dia de parada)
   → CardReveal abre com flip 3D.
   → Para BOM/RUIM: mostra efeitos, botão Continuar.
   → Para DECISÃO/COMPRA_IMPULSIVA: mostra opções, jogador escolhe.

5. ATUALIZANDO
   → FloatingEffects aparecem (+R$X, -😊Y etc.)
   → Stats atualizam com transição suave.

6. Verificações:
   → Cruzou início de mês? → MonthStartModal
   → Chegou dia 365? → GameOver

7. Volta ao passo 1.
```

---

## Profissão

**Escritório** — Salário fixo de **R$ 2.000** creditado todo dia 1 de cada mês.

---

## Avatar

O jogador personaliza antes de começar:
- **Cabelo:** curto, longo, cacheado, careca, trança
- **Pele:** claro, medio, moreno, escuro
- **Roupa:** casual, formal, esportivo, artistico, universitario

---

## Tipos de Cartas

### BOM
Eventos positivos com efeito imediato. Exemplos: receber bônus, promoção, herança, retorno de investimento.
- Aplicam: `money_effect`, `happiness_effect`, `knowledge_effect`, `score_effect`

### RUIM
Eventos negativos com efeito imediato. Exemplos: carro quebrado, multa, demissão parcial, emergência médica.
- Aplicam: mesmos campos, geralmente negativos

### DECISÃO
O jogador escolhe entre 2 opções com consequências diferentes (imediatas e/ou futuras).
- Options JSONB: `[{label, money_now, happiness_now, knowledge_now, money_later, happiness_later, is_deferred}]`
- Exemplos: aceitar empréstimo ou não, fazer curso ou sair com amigos

### COMPRA IMPULSIVA
Visual destacado (laranja/vermelho). O jogador confirma ou recusa.
- Se confirmar (`is_deferred: true`): gasta agora, arrependimento chega no próximo turno
- Incrementa `impulse_score` e penaliza levemente o `credit_score` (-5)
- Exemplos: viagem de última hora, iPhone novo, aposta esportiva

---

## Roleta

A roleta tem **6 setores** rotulados 1 a 6 (dois de cada: 1, 1, 2, 2, 3, 3 — ou variação).
- Girar → resultado 1-6 → avatar avança esse número de casas
- Não há probabilidade especial por setor nesta versão

---

## Tabuleiro (GameBoard)

- Representa o **calendário anual** (365 casas = dias)
- Avatar se move casa a casa com animação
- Cores das casas:
  - Cinza: dias futuros
  - Verde: carta BOM (passado)
  - Vermelho: carta RUIM (passado)
  - Amarelo: carta DECISÃO (passado)
  - Laranja: COMPRA_IMPULSIVA (passado)
  - Azul: dia sem carta (roleta pura)
  - Destaque pulsante: dia atual

---

## Início de Mês (MonthStartModal)

Aparece quando o jogador cruza o dia 1 de um novo mês. Duas etapas:

**Etapa 1 — Padrão de Vida (1-7):**
1. Econômico extremo — -30% gastos, -20 😊
2. Bem simples — -15% gastos, -10 😊
3. Básico — padrão
4. Confortável — +15% gastos, +5 😊
5. Bem confortável — +30% gastos, +10 😊
6. Luxo — +60% gastos, +15 😊, -20 crédito
7. Ostentação — +100% gastos, +20 😊, -50 crédito

**Etapa 2 — Orçamento Doméstico (4 campos):**
- Expectativa de receitas
- Gastos fixos esperados
- Reserva para imprevistos
- Meta de poupança

---

## Fim de Mês (MonthEndSummary)

Resumo exibido após completar os 30 dias do mês:

```
💳 Financeiro
  Receitas: R$X   |   Gastos: R$X

🎯 Meta de Poupança
  Meta: R$X   Realizado: R$X   [barra de progresso]

📊 Score de Crédito: XXX

💛 Qualidade de Vida
  Felicidade média do mês: XX%

🧠 Perfil do mês:
  "Planejador Emocional" (0 compras impulsivas)
  "Equilibrado" (1-2 compras impulsivas)
  "Gastador Impulsivo" (3+ compras impulsivas)
```

---

## Tutorial (TutorialModal)

Aparece na primeira sessão (`tutorial_shown = false`). 6 slides:
1. Objetivo do jogo
2. O Tabuleiro
3. A Roleta
4. As Variáveis (💰 😊 📚 💳)
5. O Salário (R$2.000/mês)
6. Pronto — Bora começar!

---

## Efeitos Visuais

### FloatingEffect
Animações temporárias sobre a tela quando stats mudam:
- `+R$500 💰` (verde, sobe)
- `-R$200 💰` (vermelho, cai)
- `+10 😊` / `-8 😊`
- `⭐ +50`

### Tonalidade de felicidade
- `happiness >= 70`: fundo normal (verde claro)
- `happiness 40-69`: leve tom amarelado
- `happiness < 40`: leve tom acinzentado

### Expressão do Avatar
- `happiness >= 70`: 😄
- `happiness 40-69`: 😐
- `happiness < 40`: 😞

---

## Sistema de Score e Ranking

O score final é calculado como:
```
score = money / 100 + knowledge * 10 + credit_score / 10
```

Ranking da turma exibe os top jogadores ordenados por score.

---

## Banco de Dados — Estrutura Resumida

```sql
game_sessions
  id, user_id, character_name, profession_id
  current_day, money, knowledge, happiness, energy, health
  avatar_hair, avatar_skin, avatar_outfit
  lifestyle_level, credit_score, impulse_score
  budget_income_expected, budget_fixed_expenses
  budget_emergency_reserve, budget_savings_goal
  tutorial_shown, pending_deferred_card_id
  status (ACTIVE | COMPLETED), started_at, updated_at

game_cards
  id, category (BOM|RUIM|DECISAO|COMPRA_IMPULSIVA)
  emoji, title, description
  money_effect, happiness_effect, knowledge_effect, score_effect
  options (JSONB), deferred_money_effect, deferred_happiness_effect
  active

game_day_logs
  id, game_session_id, day
  event_type, event_title, card_id, roulette_result
  choice_index, effects_applied (JSONB), created_at
```

---

## Fluxo Completo de uma Partida

```
Novo Jogo
  → AvatarCreator (nome + cabelo + pele + roupa)
  → POST /api/game/session
  → TutorialModal (se tutorial_shown = false)
  → PATCH /api/game/session {tutorialShown: true}
  → MonthStartModal (mês 1: padrão de vida + orçamento)
  → PATCH /api/game/session {lifestyleLevel, budget*}

Loop de Turno (até dia 365)
  → Usuário clica RODAR
  → Frontend sorteia rouletteResult (1-6)
  → Frontend sorteia carta aleatória do deck
  → POST /api/game/advance {sessionId, rouletteResult, cardId, choiceIndex}
  → Atualiza UI com nova posição + stats
  → Se monthStart: MonthStartModal
  → Se gameOver: tela de parabéns com score final

Fim do Mês
  → GET /api/game/month-summary?sessionId=X&month=Y
  → MonthEndSummary modal
```
