/* ===========================================================
   Sneaker Smash - script.js
   Jogo de "Acerte a Toupeira" com tema de tênis vintage,
   feito pensando num público de festa/vários jogadores:
   partidas curtas, ritmo que acelera e ranking competitivo.
   =========================================================== */

// ---- Configurações do jogo (aqui defino as regras pedidas na atividade) ----
const TAMANHO_GRID = 16; // grid 4x4: dá pra ser rápido sem virar bagunça visual
const DURACAO_PARTIDA = 30; // em segundos - partida curta, boa pra clima de festa
const PONTOS_NORMAL = 10;
const PONTOS_RARO = 30; // tênis raro vale mais, mas aparece com menos frequência
const PONTOS_FALSO = -15; // penalidade por clicar na falsificação
const CHAVE_RANKING = "sneakerSmashRanking";
const MULTIPLICADORES_COMBO = [1, 1.5, 2]; // sobe a cada 3 acertos seguidos

// Emojis usados como "tênis". Uso emoji em vez de imagens de marca
// pra não depender de arquivos externos e não usar nenhuma logo registrada.
const EMOJI_NORMAL = "👟";
const EMOJI_RARO = "✨";
const EMOJI_FALSO = "🚫";

// ---- Estado do jogo (guardo tudo aqui em vez de espalhar variáveis soltas) ----
let jogoAtivo = false;
let nomeJogador = "";
let pontuacao = 0;
let tempoRestante = DURACAO_PARTIDA;
let comboContagem = 0;
let multiplicadorAtual = 1;
let idIntervaloTempo = null;
let idProximoSpawn = null;
let timeoutsDeAlvo = []; // guardo os timeouts de "esconder alvo" pra poder limpar tudo no fim

// ---- Referências de elementos (pego tudo uma vez só) ----
const telaInicio = document.getElementById("tela-inicio");
const telaJogo = document.getElementById("tela-jogo");
const telaFim = document.getElementById("tela-fim");

const inputNome = document.getElementById("input-nome");
const btnJogar = document.getElementById("btn-jogar");
const btnJogarNovamente = document.getElementById("btn-jogar-novamente");

const gridJogo = document.getElementById("grid-jogo");
const hudNome = document.getElementById("hud-nome");
const hudPontos = document.getElementById("hud-pontos");
const hudCombo = document.getElementById("hud-combo");
const hudTempo = document.getElementById("hud-tempo");

const resultadoNome = document.getElementById("resultado-nome");
const resultadoPontos = document.getElementById("resultado-pontos");

const tabelaRanking = document.getElementById("tabela-ranking");


// =============================================================
// Controle de telas
// =============================================================

// troco qual seção fica visível - uso classList em vez de innerHTML
// pra não recriar os elementos toda hora
function mostrarTela(tela) {
  [telaInicio, telaJogo, telaFim].forEach((secao) => {
    secao.classList.add("oculta");
  });
  tela.classList.remove("oculta");
}


// =============================================================
// Criação do grid (feita 1x só, no carregamento da página)
// =============================================================

function criarGrid() {
  for (let i = 0; i < TAMANHO_GRID; i++) {
    const buraco = document.createElement("div");
    buraco.classList.add("buraco");
    buraco.dataset.index = i;
    buraco.dataset.ativo = "false"; // uso dataset aqui pra guardar o estado de cada buraco
    buraco.dataset.tipo = ""; // guarda se o alvo atual é normal, raro ou falso

    // crio o elemento do tênis dentro do buraco pelo DOM (nada de innerHTML)
    const tenis = document.createElement("span");
    tenis.classList.add("tenis");
    tenis.textContent = EMOJI_NORMAL;
    buraco.appendChild(tenis);

    buraco.addEventListener("click", () => registrarClique(buraco));

    gridJogo.appendChild(buraco);
  }
}


// =============================================================
// Dificuldade progressiva
// Calculo intervalo/duração dos alvos com base no tempo restante,
// assim o jogo começa calmo e fica frenético perto do fim -
// isso combina com o briefing de festa (clima competitivo cresce).
// =============================================================

function calcularProgresso() {
  return 1 - tempoRestante / DURACAO_PARTIDA; // 0 no início, ~1 perto do fim
}

function calcularIntervaloSpawn() {
  const progresso = calcularProgresso();
  const intervaloMax = 900; // ms - ritmo no começo da partida
  const intervaloMin = 350; // ms - ritmo no fim da partida
  return intervaloMax - progresso * (intervaloMax - intervaloMin);
}

function calcularDuracaoAlvo() {
  const progresso = calcularProgresso();
  const duracaoMax = 1050; // ms
  const duracaoMin = 550; // ms
  return duracaoMax - progresso * (duracaoMax - duracaoMin);
}


// =============================================================
// Sorteio e exibição dos alvos
// =============================================================

// sorteio o tipo de tênis: a maioria é normal, raro é raro de verdade,
// e o falso aparece o suficiente pra dar tensão sem ficar injusto
function sortearTipoTenis() {
  const sorteio = Math.random();
  if (sorteio < 0.12) return "raro";
  if (sorteio < 0.27) return "falso";
  return "normal";
}

function buscarBuracoLivre() {
  const buracos = Array.from(gridJogo.children).filter(
    (b) => b.dataset.ativo === "false"
  );
  if (buracos.length === 0) return null;
  const indiceSorteado = Math.floor(Math.random() * buracos.length);
  return buracos[indiceSorteado];
}

function exibirAlvo(buraco) {
  const tipo = sortearTipoTenis();
  const tenis = buraco.querySelector(".tenis");

  buraco.dataset.ativo = "true";
  buraco.dataset.tipo = tipo;

  // limpo classes visuais anteriores e aplico a do tipo sorteado
  tenis.classList.remove("raro", "falso");
  if (tipo === "raro") {
    tenis.textContent = EMOJI_RARO;
    tenis.classList.add("raro");
  } else if (tipo === "falso") {
    tenis.textContent = EMOJI_FALSO;
    tenis.classList.add("falso");
  } else {
    tenis.textContent = EMOJI_NORMAL;
  }

  // se ninguém clicar a tempo, o alvo some sozinho e isso quebra o combo
  const idTimeout = setTimeout(() => {
    if (buraco.dataset.ativo === "true") {
      esconderAlvo(buraco);
      resetarCombo();
    }
  }, calcularDuracaoAlvo());

  timeoutsDeAlvo.push(idTimeout);
}

function esconderAlvo(buraco) {
  buraco.dataset.ativo = "false";
  buraco.dataset.tipo = "";
}

// agendo o próximo spawn recursivamente (em vez de setInterval fixo)
// porque o intervalo muda com a dificuldade a cada chamada
function agendarProximoSpawn() {
  if (!jogoAtivo) return;

  idProximoSpawn = setTimeout(() => {
    const buracoLivre = buscarBuracoLivre();
    if (buracoLivre) {
      exibirAlvo(buracoLivre);
    }
    agendarProximoSpawn();
  }, calcularIntervaloSpawn());
}


// =============================================================
// Cliques, pontuação e combo (esse é o meu diferencial: sistema
// de combo + tênis falsificado como "alvo que engana")
// =============================================================

function registrarClique(buraco) {
  if (!jogoAtivo) return;
  if (buraco.dataset.ativo !== "true") return; // clicou no buraco vazio, ignoro

  const tipo = buraco.dataset.tipo;
  esconderAlvo(buraco); // some na hora, dá o feedback de "acertei"

  if (tipo === "falso") {
    // não deixo a pontuação ficar negativa pra não desanimar quem tá jogando na festa
    pontuacao = Math.max(0, pontuacao + PONTOS_FALSO);
    resetarCombo();
  } else {
    const pontosBase = tipo === "raro" ? PONTOS_RARO : PONTOS_NORMAL;
    comboContagem++;
    atualizarMultiplicador();
    pontuacao += Math.round(pontosBase * multiplicadorAtual);
  }

  atualizarHudPontuacao();
}

function atualizarMultiplicador() {
  // a cada 3 acertos seguidos, subo um degrau no multiplicador (até x2)
  const grau = Math.min(
    Math.floor(comboContagem / 3),
    MULTIPLICADORES_COMBO.length - 1
  );
  multiplicadorAtual = MULTIPLICADORES_COMBO[grau];
  hudCombo.textContent = "x" + multiplicadorAtual;
}

function resetarCombo() {
  comboContagem = 0;
  multiplicadorAtual = 1;
  hudCombo.textContent = "x1";
}

function atualizarHudPontuacao() {
  hudPontos.textContent = pontuacao;
}


// =============================================================
// Timer da partida
// =============================================================

function iniciarTimer() {
  hudTempo.textContent = tempoRestante;
  idIntervaloTempo = setInterval(() => {
    tempoRestante--;
    hudTempo.textContent = tempoRestante;
    if (tempoRestante <= 0) {
      finalizarJogo();
    }
  }, 1000);
}


// =============================================================
// Início, fim e reinício da partida
// =============================================================

function iniciarJogo() {
  const nomeDigitado = inputNome.value.trim();
  nomeJogador = nomeDigitado.length > 0 ? nomeDigitado : "Jogador";

  pontuacao = 0;
  tempoRestante = DURACAO_PARTIDA;
  comboContagem = 0;
  multiplicadorAtual = 1;
  jogoAtivo = true;

  hudNome.textContent = nomeJogador;
  atualizarHudPontuacao();
  hudCombo.textContent = "x1";

  // garanto que nenhum buraco fique "travado" ativo de uma partida anterior
  Array.from(gridJogo.children).forEach((buraco) => esconderAlvo(buraco));

  mostrarTela(telaJogo);
  iniciarTimer();
  agendarProximoSpawn();
}

function finalizarJogo() {
  jogoAtivo = false;

  clearInterval(idIntervaloTempo);
  clearTimeout(idProximoSpawn);
  timeoutsDeAlvo.forEach((id) => clearTimeout(id));
  timeoutsDeAlvo = [];

  Array.from(gridJogo.children).forEach((buraco) => esconderAlvo(buraco));

  salvarRanking(nomeJogador, pontuacao);

  resultadoNome.textContent = "Jogador: " + nomeJogador;
  resultadoPontos.textContent = "Pontuação: " + pontuacao;

  mostrarTela(telaFim);
}

function reiniciarJogo() {
  exibirRanking();
  mostrarTela(telaInicio);
}


// =============================================================
// Ranking (bônus) - guardo no localStorage pra sobreviver
// ao fechar a página, já que é isso que dá o clima de "recorde da festa"
// =============================================================

function carregarRanking() {
  const dados = localStorage.getItem(CHAVE_RANKING);
  if (!dados) return [];
  try {
    return JSON.parse(dados);
  } catch (erro) {
    // se o dado salvo tiver corrompido por algum motivo, prefiro
    // recomeçar o ranking a quebrar o jogo inteiro
    return [];
  }
}

function salvarRanking(nome, pontos) {
  const ranking = carregarRanking();
  ranking.push({ nome: nome, pontos: pontos, data: new Date().toLocaleDateString("pt-BR") });
  ranking.sort((a, b) => b.pontos - a.pontos);
  const top10 = ranking.slice(0, 10);
  localStorage.setItem(CHAVE_RANKING, JSON.stringify(top10));
}

function limparTabela(tabela) {
  while (tabela.firstChild) {
    tabela.removeChild(tabela.firstChild);
  }
}

function exibirRanking() {
  const ranking = carregarRanking();
  limparTabela(tabelaRanking);

  const cabecalho = document.createElement("tr");
  ["#", "Nome", "Pontos"].forEach((texto) => {
    const th = document.createElement("th");
    th.textContent = texto;
    cabecalho.appendChild(th);
  });
  tabelaRanking.appendChild(cabecalho);

  if (ranking.length === 0) {
    const linha = document.createElement("tr");
    const celula = document.createElement("td");
    celula.textContent = "Ninguém jogou ainda. Seja o primeiro!";
    celula.colSpan = 3;
    linha.appendChild(celula);
    tabelaRanking.appendChild(linha);
    return;
  }

  ranking.forEach((registro, indice) => {
    const linha = document.createElement("tr");

    const celulaPosicao = document.createElement("td");
    celulaPosicao.textContent = indice + 1;

    const celulaNome = document.createElement("td");
    celulaNome.textContent = registro.nome;

    const celulaPontos = document.createElement("td");
    celulaPontos.textContent = registro.pontos;

    linha.appendChild(celulaPosicao);
    linha.appendChild(celulaNome);
    linha.appendChild(celulaPontos);
    tabelaRanking.appendChild(linha);
  });
}


// =============================================================
// Eventos e inicialização
// =============================================================

btnJogar.addEventListener("click", iniciarJogo);
btnJogarNovamente.addEventListener("click", reiniciarJogo);

// permito iniciar apertando Enter no campo de nome, ajuda no ritmo de festa
inputNome.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    iniciarJogo();
  }
});

criarGrid();
exibirRanking();