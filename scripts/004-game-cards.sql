-- ============================================================
-- Fase 3: Tabela de cartas do jogo
-- ============================================================

DO $$ BEGIN
  CREATE TYPE card_category AS ENUM ('BOM', 'RUIM', 'DECISAO', 'COMPRA_IMPULSIVA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS game_cards (
  id                        SERIAL PRIMARY KEY,
  category                  card_category NOT NULL,
  emoji                     TEXT NOT NULL,
  title                     TEXT NOT NULL,
  description               TEXT NOT NULL,
  -- Efeito imediato (cartas BOM/RUIM simples)
  money_effect              INTEGER NOT NULL DEFAULT 0,
  happiness_effect          INTEGER NOT NULL DEFAULT 0,
  knowledge_effect          INTEGER NOT NULL DEFAULT 0,
  score_effect              INTEGER NOT NULL DEFAULT 0,
  -- Opções para DECISAO e COMPRA_IMPULSIVA (JSONB array)
  -- Formato: [{ "label": "...", "money_now": 0, "happiness_now": 0, "knowledge_now": 0,
  --             "money_later": 0, "happiness_later": 0, "is_deferred": false }]
  options                   JSONB,
  -- Efeito atrasado para cartas COMPRA_IMPULSIVA sem opções (automático)
  deferred_money_effect     INTEGER NOT NULL DEFAULT 0,
  deferred_happiness_effect INTEGER NOT NULL DEFAULT 0,
  active                    BOOLEAN NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_cards_category ON game_cards(category);
CREATE INDEX IF NOT EXISTS idx_game_cards_active   ON game_cards(active);

-- ============================================================
-- SEED: CARTAS BOAS
-- ============================================================
INSERT INTO game_cards (category, emoji, title, description, money_effect, happiness_effect, knowledge_effect, score_effect) VALUES
('BOM', '💰', 'Bolsa de estudos',    'Você recebeu R$500 para ajudar nos estudos!',                    500,  5,  10,  50),
('BOM', '🎁', 'Presente inesperado', 'Um parente te deu dinheiro de presente! Recebeu R$200.',          200,  8,   0,  20),
('BOM', '💼', 'Freelance rápido',    'Você fez um trabalho extra no fim de semana!',                   300,  5,   5,  30),
('BOM', '🎓', 'Curso gratuito',      'Você conseguiu um curso sem custo!',                               0,  5,  15,  20),
('BOM', '🧾', 'Dinheiro esquecido',  'Você encontrou dinheiro guardado!',                               150,  6,   0,  15),
('BOM', '💡', 'Economia de energia', 'Foi identificado um erro na sua última fatura e você recebeu dinheiro de volta.', 80, 3, 0, 10),
('BOM', '📚', 'Venda de usado',      'Você vendeu algo que não usava mais!',                            120,  4,   0,  12),
('BOM', '🧑‍💼', 'Reconhecimento',   'Você foi elogiado pelo seu esforço!',                               50, 10,   5,  25),
('BOM', '🍳', 'Cozinhar virou hábito', 'Você economizou várias vezes na semana cozinhando em casa!',   90,  5,   3,  15),
('BOM', '🎟', 'Evento gratuito',     'Você encontrou lazer sem gastar nada!',                             0, 10,   2,  10),
('BOM', '💸', 'Cashback',            'Você recebeu dinheiro de volta de uma compra!',                   60,  4,   0,   8),
('BOM', '📊', 'Planejamento deu certo', 'Seu planejamento evitou gastos extras! Felicidade aumentou.', 100,  8,   5,  20),
('BOM', '🚀', 'Oportunidade de renda', 'Surgiu uma nova chance de ganhar dinheiro!',                   250,  6,   0,  25);

-- ============================================================
-- SEED: CARTAS RUINS
-- ============================================================
INSERT INTO game_cards (category, emoji, title, description, money_effect, happiness_effect, knowledge_effect, score_effect) VALUES
('RUIM', '📱', 'Celular quebrou',       'Seu celular caiu no chão e parou de funcionar.',              -350, -6,  0, -30),
('RUIM', '💳', 'Fatura esquecida',      'Você esqueceu de pagar o cartão. Juros e multa.',             -120, -5,  0, -50),
('RUIM', '🚑', 'Emergência médica',     'Você precisou de atendimento inesperado.',                    -200, -4,  0, -20),
('RUIM', '🍔', 'Gastos impulsivos',     'Você pediu comida várias vezes na semana.',                   -180, -3,  0, -15),
('RUIM', '🛍', 'Compra por impulso',    'Você comprou algo que não precisava.',                        -220, -5,  0, -20),
('RUIM', '🚗', 'Transporte caro',       'Você usou transporte caro sem planejamento.',                  -90, -2,  0, -10),
('RUIM', '🎮', 'Parcelamento perigoso', 'Você parcelou uma compra desnecessária. -R$60/mês.',           -60, -4,  0, -25),
('RUIM', '💡', 'Conta alta',            'Sua conta de energia veio mais cara do que o esperado.',      -130, -3,  0, -10),
('RUIM', '📦', 'Compra online ruim',    'Você se arrependeu de uma compra online.',                    -140, -6,  0, -15),
('RUIM', '😬', 'Multa inesperada',      'Você levou uma multa ou taxa inesperada.',                    -100, -3,  0, -15),
('RUIM', '🧾', 'Assinatura esquecida',  'Você está pagando algo que nem usa mais.',                     -50, -2,  0,  -8),
('RUIM', '🥶', 'Geladeira vazia',       'Você não se planejou e gastou mais com comida.',              -120, -3,  0, -10),
('RUIM', '🎉', 'Festa cara',            'Você gastou mais do que deveria em um evento.',               -200,  3,  0, -10),
('RUIM', '🧠', 'Decisão ruim',          'Você ignorou seu planejamento financeiro.',                   -100, -4,  0, -20),
('RUIM', '🛠', 'Conserto inesperado',   'Algo em casa quebrou e precisou de reparo.',                  -170, -4,  0, -15),
('RUIM', '📚', 'Falta de planejamento', 'Você esqueceu um gasto importante do mês.',                   -110, -3,  0, -15),
('RUIM', '😴', 'Procrastinação',        'Você evitou organizar suas finanças. Risco de erros futuros.', 0,  -3,  0, -20),
('RUIM', '🍕', 'Delivery exagerado',    'Você gastou demais com delivery esta semana.',                -160, -4,  0, -12),
('RUIM', '🧍', 'Isolamento social',     'Você economizou demais e deixou de viver momentos importantes.', 0, -7, 0, -15),
('RUIM', '😡', 'Compra emocional',      'Você gastou para se sentir melhor, mas o arrependimento veio.', -130, -3, 0, -20),
('RUIM', '🧨', 'Efeito bola de neve',   'Pequenos erros viraram um grande problema financeiro.',       -250, -8,  0, -40);

-- ============================================================
-- SEED: CARTAS DE DECISÃO
-- ============================================================
INSERT INTO game_cards (category, emoji, title, description, options) VALUES

('DECISAO', '🍔', 'Comer fora ou economizar?',
 'Você está com preguiça de cozinhar. O que fazer?',
 '[
   {"label": "Pedir delivery",     "money_now": -50, "happiness_now":  6, "knowledge_now": 0, "money_later": 0, "happiness_later": 0, "is_deferred": false},
   {"label": "Cozinhar em casa",   "money_now":   0, "happiness_now":  2, "knowledge_now": 2, "money_later": 0, "happiness_later": 0, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '🚗', 'Transporte',
 'Você precisa se locomover até o trabalho.',
 '[
   {"label": "Uber",  "money_now": -30, "happiness_now":  4, "knowledge_now": 0, "money_later": 0, "happiness_later": 0, "is_deferred": false},
   {"label": "Ônibus","money_now":  -8, "happiness_now":  1, "knowledge_now": 0, "money_later": 0, "happiness_later": 0, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '📱', 'Celular novo',
 'Seu celular ainda funciona, mas tem um modelo melhor no mercado.',
 '[
   {"label": "Trocar agora",     "money_now": -900, "happiness_now":  8, "knowledge_now": 0, "money_later":    0, "happiness_later": 0, "is_deferred": false},
   {"label": "Esperar mais",     "money_now":    0, "happiness_now": -2, "knowledge_now": 0, "money_later":    0, "happiness_later": 3, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '🎓', 'Curso pago',
 'Apareceu um curso interessante que pode ajudar na carreira.',
 '[
   {"label": "Comprar o curso",  "money_now": -200, "happiness_now":  5, "knowledge_now": 8, "money_later":  50, "happiness_later": 0, "is_deferred": false},
   {"label": "Não fazer agora",  "money_now":    0, "happiness_now": -1, "knowledge_now": 0, "money_later":   0, "happiness_later": 0, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '🛍', 'Promoção relâmpago',
 'Uma loja está com desconto por tempo limitado.',
 '[
   {"label": "Comprar",  "money_now": -150, "happiness_now":  7, "knowledge_now": 0, "money_later":    0, "happiness_later": -3, "is_deferred": true},
   {"label": "Ignorar",  "money_now":    0, "happiness_now":  2, "knowledge_now": 0, "money_later":    0, "happiness_later":  0, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '💳', 'Parcelamento',
 'Você quer comprar algo mais caro, mas não tem o valor todo.',
 '[
   {"label": "Parcelar (-R$60/mês)",        "money_now": -60, "happiness_now":  6, "knowledge_now": 0, "money_later": -60, "happiness_later": -2, "is_deferred": true},
   {"label": "Esperar e pagar à vista",     "money_now":   0, "happiness_now": -1, "knowledge_now": 3,  "money_later":   0, "happiness_later":  5, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '🎉', 'Festa com amigos',
 'Seus amigos vão sair e te convidam.',
 '[
   {"label": "Ir e gastar à vontade",  "money_now": -120, "happiness_now": 10, "knowledge_now": 0, "money_later":    0, "happiness_later":  0, "is_deferred": false},
   {"label": "Ir com limite de gasto", "money_now":  -60, "happiness_now":  7, "knowledge_now": 0, "money_later":    0, "happiness_later":  0, "is_deferred": false},
   {"label": "Não ir",                 "money_now":    0, "happiness_now": -5, "knowledge_now": 0, "money_later":    0, "happiness_later":  0, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '📈', 'Investimento',
 'Você recebeu um dinheiro extra e pode investir.',
 '[
   {"label": "Investir",  "money_now": -200, "happiness_now":  2, "knowledge_now": 5, "money_later": 240, "happiness_later": 5, "is_deferred": true},
   {"label": "Gastar",    "money_now": -150, "happiness_now":  8, "knowledge_now": 0, "money_later":   0, "happiness_later":-3, "is_deferred": true}
 ]'::jsonb),

('DECISAO', '🧾', 'Pagar ou adiar',
 'Uma conta venceu hoje.',
 '[
   {"label": "Pagar agora",         "money_now": -100, "happiness_now":  3, "knowledge_now": 0, "money_later":    0, "happiness_later":  0, "is_deferred": false},
   {"label": "Adiar (juros depois)","money_now":    0, "happiness_now":  0, "knowledge_now": 0, "money_later": -120, "happiness_later": -5, "is_deferred": true}
 ]'::jsonb),

('DECISAO', '🎮', 'Assinatura',
 'Um serviço mensal de streaming te interessa.',
 '[
   {"label": "Assinar (-R$25/mês)", "money_now": -25, "happiness_now":  5, "knowledge_now": 0, "money_later": -25, "happiness_later":  0, "is_deferred": false},
   {"label": "Não assinar",         "money_now":   0, "happiness_now": -1, "knowledge_now": 0, "money_later":   0, "happiness_later":  0, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '🛍', 'Roupa nova',
 'Você quer renovar o guarda-roupa.',
 '[
   {"label": "Comprar várias peças", "money_now": -250, "happiness_now":  9, "knowledge_now": 0, "money_later":   0, "happiness_later": -4, "is_deferred": true},
   {"label": "Comprar uma só",       "money_now": -100, "happiness_now":  6, "knowledge_now": 0, "money_later":   0, "happiness_later":  0, "is_deferred": false},
   {"label": "Não comprar",          "money_now":    0, "happiness_now": -2, "knowledge_now": 0, "money_later":   0, "happiness_later":  2, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '🍕', 'Delivery em grupo',
 'Amigos querem pedir comida juntos.',
 '[
   {"label": "Participar",      "money_now": -40, "happiness_now":  6, "knowledge_now": 0, "money_later": 0, "happiness_later": 0, "is_deferred": false},
   {"label": "Comer em casa",   "money_now":   0, "happiness_now": -2, "knowledge_now": 0, "money_later": 0, "happiness_later": 0, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '🎁', 'Presente',
 'Aniversário de um amigo próximo.',
 '[
   {"label": "Presente caro",   "money_now": -120, "happiness_now":  8, "knowledge_now": 0, "money_later": 0, "happiness_later": 0, "is_deferred": false},
   {"label": "Presente simples","money_now":  -50, "happiness_now":  6, "knowledge_now": 0, "money_later": 0, "happiness_later": 0, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '🚑', 'Saúde',
 'Você não está se sentindo bem.',
 '[
   {"label": "Ir ao médico",   "money_now": -100, "happiness_now":  5, "knowledge_now": 0, "money_later": 0, "happiness_later": 5, "is_deferred": false},
   {"label": "Ignorar",        "money_now":     0, "happiness_now": -3, "knowledge_now": 0, "money_later": 0, "happiness_later":-5, "is_deferred": true}
 ]'::jsonb),

('DECISAO', '🎮', 'Promoção de jogo',
 'Um jogo está com desconto por tempo limitado.',
 '[
   {"label": "Comprar",     "money_now": -80, "happiness_now":  7, "knowledge_now": 0, "money_later": 0, "happiness_later": -2, "is_deferred": true},
   {"label": "Não comprar", "money_now":   0, "happiness_now":  1, "knowledge_now": 0, "money_later": 0, "happiness_later":  0, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '🧾', 'Dívida pequena',
 'Você tem uma dívida pequena pendente.',
 '[
   {"label": "Pagar agora",     "money_now": -100, "happiness_now":  6, "knowledge_now": 0, "money_later":    0, "happiness_later": 0, "is_deferred": false},
   {"label": "Deixar pra depois","money_now":   0, "happiness_now": -2, "knowledge_now": 0, "money_later": -140,"happiness_later":-5, "is_deferred": true}
 ]'::jsonb),

('DECISAO', '⚖️', 'Equilíbrio de vida',
 'Você trabalhou muito essa semana.',
 '[
   {"label": "Se recompensar",        "money_now": -80, "happiness_now": 10, "knowledge_now": 0, "money_later": 0, "happiness_later": 0, "is_deferred": false},
   {"label": "Continuar trabalhando", "money_now": 100, "happiness_now": -5, "knowledge_now": 2, "money_later": 0, "happiness_later":-3, "is_deferred": true}
 ]'::jsonb),

('DECISAO', '🚲', 'Alternativa barata',
 'Você pode usar bicicleta ao invés de transporte pago.',
 '[
   {"label": "Usar bike",             "money_now":   0, "happiness_now":  3, "knowledge_now": 0, "money_later": 0, "happiness_later": 0, "is_deferred": false},
   {"label": "Usar transporte pago",  "money_now": -20, "happiness_now":  2, "knowledge_now": 0, "money_later": 0, "happiness_later": 0, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '🎉', 'Viagem com amigos',
 'Seus amigos planejam uma viagem de fim de semana.',
 '[
   {"label": "Ir",      "money_now": -400, "happiness_now": 15, "knowledge_now": 2, "money_later": 0, "happiness_later": 0, "is_deferred": false},
   {"label": "Não ir",  "money_now":    0, "happiness_now": -7, "knowledge_now": 0, "money_later": 0, "happiness_later": 0, "is_deferred": false}
 ]'::jsonb),

('DECISAO', '🛍', 'Compra coletiva',
 'Amigos querem dividir a compra de algo juntos.',
 '[
   {"label": "Participar",       "money_now": -70, "happiness_now":  6, "knowledge_now": 0, "money_later": 0, "happiness_later": 0, "is_deferred": false},
   {"label": "Não participar",   "money_now":   0, "happiness_now": -3, "knowledge_now": 0, "money_later": 0, "happiness_later": 0, "is_deferred": false}
 ]'::jsonb);

-- ============================================================
-- SEED: CARTAS DE COMPRA IMPULSIVA
-- ============================================================
INSERT INTO game_cards (category, emoji, title, description, money_effect, happiness_effect, deferred_money_effect, deferred_happiness_effect) VALUES
('COMPRA_IMPULSIVA', '🎮', 'Oferta imperdível!',
 '🔥 "Últimas unidades! Só hoje!" Você comprou sem pensar.',
 -200, 10, 0, -8),

('COMPRA_IMPULSIVA', '👟', 'Tênis da moda',
 '🔥 Todo mundo está usando! Você cedeu à pressão.',
 -350, 12, 0, -10),

('COMPRA_IMPULSIVA', '📱', 'Upgrade desnecessário',
 '🔥 "Seu celular já está ultrapassado!" Você trocou sem necessidade.',
 -900, 10, -100, -12),

('COMPRA_IMPULSIVA', '🍔', 'Sequência de delivery',
 '🔥 "Você merece hoje…" Pediu delivery vários dias seguidos.',
 -120, 8, 0, -6),

('COMPRA_IMPULSIVA', '🛍', 'Compras online à noite',
 '🔥 Você navegou e comprou várias coisas sem planejamento.',
 -280, 9, 0, -9),

('COMPRA_IMPULSIVA', '🎮', 'Microtransações',
 '🔥 "Só mais um item no jogo!" Pequenas compras que somam.',
 -90, 7, 0, -7),

('COMPRA_IMPULSIVA', '💄', 'Produto que não precisava',
 '🔥 Influência de redes sociais. Comprou por impulso.',
 -150, 8, 0, -8),

('COMPRA_IMPULSIVA', '🧢', 'Acessório por impulso',
 '🔥 Estava "barato demais pra perder".',
 -70, 6, 0, -5),

('COMPRA_IMPULSIVA', '🎧', 'Fone novo',
 '🔥 Promoção relâmpago. Comprou na hora.',
 -220, 9, 0, -7),

('COMPRA_IMPULSIVA', '📦', 'Frete grátis (armadilha)',
 '🔥 "Faltam R$30 pra frete grátis!" Comprou mais pra economizar.',
 -130, 6, 0, -6),

('COMPRA_IMPULSIVA', '🍕', 'Pedido exagerado',
 '🔥 Você pediu mais do que precisava.',
 -80, 7, 0, -5),

('COMPRA_IMPULSIVA', '🎉', 'Festa sem controle',
 '🔥 "Só hoje!" Foi e gastou muito mais do que planejava.',
 -250, 12, 0, -12),

('COMPRA_IMPULSIVA', '🧾', 'Assinatura por impulso',
 '🔥 Você assinou sem pensar. -R$30/mês.',
 -30, 5, -30, -6),

('COMPRA_IMPULSIVA', '👕', 'Roupa repetida',
 '🔥 Você comprou algo parecido com o que já tem.',
 -180, 7, 0, -8),

('COMPRA_IMPULSIVA', '📱', 'Acessórios desnecessários',
 '🔥 "Vai melhorar sua experiência!"',
 -120, 6, 0, -6),

('COMPRA_IMPULSIVA', '🎮', 'Jogo que nem jogou',
 '🔥 Você comprou, mas perdeu o interesse em dois dias.',
 -200, 8, 0, -9),

('COMPRA_IMPULSIVA', '🛒', 'Carrinho cheio',
 '🔥 Você não revisou o carrinho e confirmou tudo.',
 -300, 9, 0, -10),

('COMPRA_IMPULSIVA', '🚗', 'Corrida desnecessária',
 '🔥 Preguiça falou mais alto. Tomou um Uber pra ir perto.',
 -40, 5, 0, -4),

('COMPRA_IMPULSIVA', '🍩', 'Doces impulsivos',
 '🔥 Comprou por vontade momentânea.',
 -35, 5, 0, -3),

('COMPRA_IMPULSIVA', '🎧', 'Marca famosa',
 '🔥 Você pagou mais pela marca sem necessidade.',
 -400, 9, 0, -10),

('COMPRA_IMPULSIVA', '📦', 'Compra duplicada',
 '🔥 Você nem percebeu que já tinha.',
 -160, 6, 0, -8),

('COMPRA_IMPULSIVA', '🧴', 'Produto "milagroso"',
 '🔥 Promessa exagerada. Você caiu na propaganda.',
 -140, 7, 0, -9),

('COMPRA_IMPULSIVA', '🎟', 'Evento caro',
 '🔥 Você não quis ficar de fora.',
 -300, 12, 0, -10),

('COMPRA_IMPULSIVA', '🍔', 'Combo gigante',
 '🔥 Você exagerou no pedido.',
 -60, 6, 0, -5),

('COMPRA_IMPULSIVA', '📱', 'Compra parcelada impulsiva',
 '🔥 "Cabe no mês!" -R$80/mês.',
 -80, 8, -80, -10),

('COMPRA_IMPULSIVA', '🛍', 'Influência de amigos',
 '🔥 Você comprou para se encaixar no grupo.',
 -220, 9, 0, -9),

('COMPRA_IMPULSIVA', '🧠', 'Compra emocional',
 '🔥 Você estava estressado e comprou para se sentir melhor.',
 -180, 10, 0, -12),

('COMPRA_IMPULSIVA', '🛒', 'Promoção falsa',
 '🔥 Desconto não era tão bom assim.',
 -200, 7, 0, -9),

('COMPRA_IMPULSIVA', '📦', 'Entrega demorada',
 '🔥 A expectativa foi maior que a realidade.',
 -150, 6, 0, -7),

('COMPRA_IMPULSIVA', '🧨', 'Efeito dominó',
 '🔥 Uma compra levou a várias outras.',
 -350, 11, 0, -13);
