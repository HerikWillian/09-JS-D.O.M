# Sneaker Smash 👟

**Nome completo:** _Herik Willian Nogueira Soares_

## Mecânica e tema

- **Mecânica escolhida:** Acerte a Toupeira (Whac-a-Mole)
- **Tema visual:** Tênis vintage/raros — inspirado no meu interesse por sneakers vintage. Os "alvos" são representados por emojis (👟 normal, ✨ raro/dourado, 🚫 falsificado) para não depender de imagens de marcas registradas.

## Briefing do cliente

**Público-alvo:** Festa / vários jogadores.

Isso guiou decisões como:
- Partida curta (30s) para caber várias rodadas na festa, passando o dispositivo entre jogadores.
- Ritmo que **acelera com o tempo**: começa calmo e fica frenético perto do fim, criando clima competitivo.
- **Ranking persistente** (localStorage) para gerar disputa entre quem jogou.
- Combo de pontuação para recompensar sequências de acerto e aumentar a adrenalina.

## Regras do jogo

1. Digite seu nome e clique em **Jogar**.
2. Tênis aparecem aleatoriamente nos 16 buracos da grade (4×4).
3. Clique no tênis antes que ele suma:
   - 👟 Tênis normal: **+10 pontos**
   - ✨ Tênis raro (dourado): **+30 pontos** (aparece com menos frequência)
   - 🚫 Falsificação: **-15 pontos** (evite clicar!)
4. A cada 3 acertos seguidos (sem clicar no falso e sem deixar um sumir), seu multiplicador de combo sobe: x1 → x1.5 → x2.
5. A partida dura 30 segundos. Ao final, sua pontuação entra no ranking.

**Variações da minha versão (Restrições da atividade):**
- Grid 4×4 = 16 buracos.
- 3 tipos de elemento (não só cor): normal, raro e falso — pensado também para não depender só de cor (acessibilidade a daltonismo, já que os tipos têm ícones e tamanhos/efeitos diferentes, não só a cor).
- Fórmula de pontuação com base + multiplicador de combo.
- Critério de tempo: partida fixa de 30s, com dificuldade progressiva (spawn e duração do alvo diminuem conforme o tempo passa).
- Fim de jogo: quando o tempo acaba.

## Meu diferencial

Implementei **dois** elementos originais que não estavam descritos na atividade:

1. **Sistema de combo com multiplicador dinâmico**: a cada 3 acertos consecutivos (sem errar ou deixar um tênis sumir), o multiplicador de pontos sobe (x1 → x1.5 → x2). Isso é controlado pelas funções `atualizarMultiplicador()` e `resetarCombo()` em `script.js`, usando a variável `comboContagem`.
2. **Tênis falsificado (alvo que engana)**: um tipo de alvo (🚫) que subtrai pontos se clicado, sorteado junto com os outros tipos em `sortearTipoTenis()`. Isso obriga o jogador a olhar com atenção antes de clicar, em vez de só reagir por reflexo.

## Como jogar

1. Abra `index.html` no navegador (ou acesse o link publicado abaixo).
2. Digite seu nome (ou deixe em branco para jogar como "Jogador").
3. Clique em **Jogar** e comece a clicar nos tênis que aparecem.
4. Ao final da partida, veja sua pontuação e o ranking, e clique em **Jogar novamente** se quiser tentar de novo.

## Como executar

Não há dependências além de um navegador moderno.

- **Localmente:** basta abrir o arquivo `index.html` diretamente no navegador, ou servir a pasta com qualquer servidor estático (ex.: extensão "Live Server" do VS Code).
- **Publicado:** [https://github.com/HerikWillian/09-JS-D.O.M] **Vercel:** [https://09-js-d-o-m-fawn.vercel.app/]

## Minhas Decisões

1. **Tamanho e formato do grid:** 4×4 (16 buracos). Escolhi esse tamanho porque, para um público de festa, um grid muito grande deixaria os alvos espalhados demais para o ritmo rápido que eu queria; 16 buracos mantêm a ação concentrada e visível mesmo em telas de celular.
2. **Quantidade de cores/elementos:** 3 tipos de tênis (normal, raro, falso), diferenciados por ícone e efeito visual (brilho dourado no raro, tom acinzentado no falso), não só por cor.
3. **Fórmula de pontuação:** base de +10 (normal) e +30 (raro), com multiplicador de combo que cresce a cada 3 acertos seguidos (até x2); erro (clicar no falso ou deixar um alvo sumir) reseta o combo, e o falso também tira -15 pontos. Isso recompensa consistência, que é o clima competitivo que o briefing de festa pede.
4. **Critérios de tempo:** partida fixa de 30 segundos. Escolhi um tempo curto de propósito, pra caber várias rodadas numa festa sem cansar quem está esperando a vez.
5. **Curva de dificuldade:** o intervalo entre o aparecimento dos tênis e o tempo que cada um fica visível diminuem progressivamente conforme a partida avança (calculado em `calcularIntervaloSpawn()` e `calcularDuracaoAlvo()`), deixando o final de cada rodada mais frenético.
6. **Condição de término:** o cronômetro chega a zero.

## Reflexão obrigatória

**1. Qual foi o bug mais chato e como resolveu?**
O mais chato foi um bug de "alvo fantasma": às vezes o tênis sumia da tela, mas o `dataset.ativo` do buraco continuava marcado como `"true"`, então clicar ali ainda contava ponto mesmo sem nada aparecendo. Isso acontecia porque o `setTimeout` que esconde o alvo e o clique do jogador podiam disputar o mesmo buraco quase ao mesmo tempo. Resolvi garantindo que qualquer função que mexe no alvo (seja o clique, seja o timeout de sumir) sempre atualiza `dataset.ativo` e `dataset.tipo` juntos, na mesma chamada, em vez de deixar esse controle espalhado pelo código.

**2. Por que escolheu essa fórmula de pontuação?**
Queria que o tênis raro (30 pontos) compensasse ele aparecer bem menos que o normal, e o sistema de combo (multiplicador que sobe a cada 3 acertos seguidos) recompensa quem consegue manter uma sequência sem errar. O tênis falso tirando pontos e resetando o combo foi pensado justamente pra criar tensão — sem essa penalidade, o jogador só clicaria em tudo sem prestar atenção.

**3. Como o briefing do cliente mudou suas decisões?**
Se o público fosse criança de 6 anos, o jogo seria bem mais lento e sem penalidade nenhuma. Como o briefing era festa/vários jogadores, priorizei ritmo rápido (partidas de só 30 segundos, pra passar o celular entre as pessoas), dificuldade que sobe durante a própria rodada, e principalmente o ranking salvo no `localStorage`, sem ranking não teria a disputa que uma festa pede.

**4. Se tivesse mais uma semana, o que mudaria?**
Adicionaria efeitos sonoros curtos pra cada tipo de acerto (ajuda muito no clima de festa) e um modo de 2 jogadores na mesma tela, cada um numa metade da grade, competindo ao vivo em vez de revezar o aparelho.

**5. Aponte uma função sua que ficou boa e explique o que ela faz.**
A `agendarProximoSpawn()`. Em vez de usar um `setInterval` fixo, ela se chama de novo recursivamente dentro do próprio `setTimeout`, e a cada chamada recalcula o intervalo com `calcularIntervaloSpawn()`. É isso que faz o jogo acelerar de verdade ao longo da partida, sem precisar de um segundo `setInterval` só pra controlar a dificuldade.

## Declaração de uso de IA

Usei o Claude como apoio para estruturar o projeto: pedi ajuda para montar a base do jogo (grid, timer, sistema de spawn dos alvos) e para pensar na mecânica de combo e no tênis falsificado como diferencial. Revisei o código função por função para entender a lógica antes de entregar, principalmente a parte de dificuldade progressiva e o controle de estado de cada buraco via `dataset`. Aprendi a usar `dataset` corretamente (em vez de variáveis globais soltas) e a diferença entre `setInterval` fixo e `setTimeout` recursivo, quando o tempo entre execuções precisa mudar dinamicamente ao longo do jogo.

## Créditos

- MDN Web Docs — consultado para entender `localStorage` e `dataset` em elementos HTML.
- [Montserrat, via Google Fonts](https://fonts.google.com/specimen/Montserrat) — fonte utilizada em todo o projeto.

## Licença

MIT License — livre para uso, cópia e modificação, mantendo os devidos créditos.