import crypto from 'node:crypto';

/* ============================================================
   PENTA — núcleo do jogo (roda SÓ no servidor)
   ============================================================ */

/* ---- Pool de palavras (5 letras, sem acento) ---- */
const RAW = `AMIGO PRAIA BANCO CARRO LIVRO MUNDO TEMPO FESTA VERDE PRETO CAMPO NOITE PORTA GENTE CORPO
PONTE DENTE VERBO LETRA VALOR PEDRA FOLHA CANTO VIDRO PALCO FRUTA LEITE CARNE MASSA ARROZ
TORTA SALSA MOLHO ORDEM TURMA GRUPO ALUNO CURSO PROVA NOTAS AVIAO BARCO NAVIO MOTOR FREIO
FAROL PLACA FOGAO FORNO PRATO GARFO CINZA PRATA CHUVA VENTO NUVEM CALOR TERRA SERRA MONTE
AREIA GRAMA FLORA FAUNA GALHO SELVA ROCHA TIGRE ZEBRA POMBA GANSO PEIXE COBRA MOSCA VESPA
GRILO BURRO PORCO POTRO GARCA BRACO PERNA DEDOS ROSTO NARIZ OLHOS TESTA OMBRO UNHAS PELOS
BARBA FILHO FILHA IRMAO PRIMO PRIMA CHEFE PADRE NOBRE HEROI VILAO PULAR COMER BEBER ANDAR
SUBIR CAVAR PEGAR JOGAR REZAR VIVER MORAR FALAR OUVIR OLHAR FELIZ BRAVO CALMO FORTE FRACO
POBRE LINDO VELHO JOVEM BAIXO LARGO CURTO LONGO CLARO MORNO LIMPO MACIO CHAVE TELHA PREGO
CORDA LINHA TINTA PAPEL LAPIS REGUA RADIO DISCO FILME MUSEU PRACA HORTA CERCA RAIVA SORTE
SAUDE VIDAS MORTE SONHO IDEIA PLANO DADOS CAUSA PODER FORCA HONRA PAUSA CALMA RITMO VERSO
PROSA CONTO LENDA MITOS MAGIA FADAS BRUXA GNOMO PIZZA MANGA LIMAO FIGOS MELAO MILHO TRIGO
AVEIA GRAOS VINHO SUCOS AULAS TESTE TEXTO FRASE TERMO REGRA CONTA SOMAR MENOS ZEROS MAPAS
GLOBO DATAS HORAS MESES ONTEM TARDE MANHA ROUPA CALCA BLUSA TERNO GORRO LUVAS MEIAS BOTAS
TENIS CINTO BOLSA TOUCA CAPUZ MANTA VESTE OUTRO SABOR RAIOS REAIS CAULE NUNCA AINDA ASSIM
AONDE QUASE MUITO POUCO TODOS TANTO QUAIS QUERO POSSO FAZER DIZER SABER HAVER LUGAR COISA
PARTE JUNTO SOBRE ENTRE LONGE PERTO ANTES CAMPO ALEGRE`;

export const strip = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Ç/g, 'C').toUpperCase();
export const WORDS = [...new Set(RAW.split(/\s+/).map(strip).filter(w => /^[A-Z]{5}$/.test(w)))];
const VOGAIS = new Set(['A', 'E', 'I', 'O', 'U']);

/* ---- Níveis de dificuldade ----
   tentativas: nº de palpites | hard: letras reveladas viram obrigatórias
   teclado: teclado mostra cores das letras usadas | dicasMax: dicas permitidas
   tempo: segundos por palpite (0 = sem limite) | mult: multiplicador de pontos */
export const DIFFS = {
  facil:    { nome: 'Fácil',    tentativas: 6, hard: false, teclado: true,  dicasMax: 3, tempo: 0,  mult: 0.5, desc: 'Teclado colorido, dicas liberadas e mais folga. Pra relaxar.' },
  normal:   { nome: 'Normal',   tentativas: 6, hard: false, teclado: true,  dicasMax: 2, tempo: 0,  mult: 1,   desc: 'O Termo clássico: 6 tentativas, sem pegadinha.' },
  dificil:  { nome: 'Difícil',  tentativas: 5, hard: true,  teclado: true,  dicasMax: 0, tempo: 0,  mult: 2,   desc: 'Modo hard: letras reveladas são obrigatórias. 5 tentativas, sem dicas.' },
  lendario: { nome: 'Lendário', tentativas: 4, hard: true,  teclado: false, dicasMax: 0, tempo: 60, mult: 4,   desc: 'Sem cores no teclado, 4 tentativas, tempo por palpite. Só pra corajosos.' },
};
export const isDiff = d => Object.prototype.hasOwnProperty.call(DIFFS, d);
/* versão segura pra mandar ao cliente (sem nada sensível) */
export const publicConfig = d => {
  const c = DIFFS[d];
  return { chave: d, nome: c.nome, tentativas: c.tentativas, hard: c.hard, teclado: c.teclado, dicasMax: c.dicasMax, tempo: c.tempo, mult: c.mult, desc: c.desc };
};

/* ---- Regra de cores do Termo (trata letras repetidas) ---- */
export function score(guess, answer) {
  const res = Array(5).fill('absent');
  const cnt = {};
  for (const ch of answer) cnt[ch] = (cnt[ch] || 0) + 1;
  for (let i = 0; i < 5; i++) if (guess[i] === answer[i]) { res[i] = 'correct'; cnt[guess[i]]--; }
  for (let i = 0; i < 5; i++) {
    if (res[i] === 'correct') continue;
    const ch = guess[i];
    if (cnt[ch] > 0) { res[i] = 'present'; cnt[ch]--; }
  }
  return res;
}

/* ---- Token do estado (AES-256-GCM: cifrado + autenticado) ---- */
function key() {
  const s = process.env.PENTA_SECRET;
  if (!s) throw new Error('PENTA_SECRET não configurada no servidor');
  return crypto.createHash('sha256').update(s).digest();
}
export function seal(state) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(JSON.stringify(state), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64url');
}
export function open(token) {
  const buf = Buffer.from(String(token), 'base64url');
  const d = crypto.createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8'));
}

/* ---- Palavra do dia: determinística por (data + dificuldade + segredo) ----
   Igual para todos no mesmo dia; muda à meia-noite; imprevisível sem o segredo. */
export function dailyWord(dateStr, diff) {
  const h = crypto.createHash('sha256').update(`${process.env.PENTA_SECRET || ''}|${dateStr}|${diff}`).digest();
  return WORDS[h.readUInt32BE(0) % WORDS.length];
}
export const randomWord = () => WORDS[crypto.randomInt(WORDS.length)];

/* ---- Dicas (calculadas da palavra, sem revelar tudo) ---- */
export function makeHint(word, type) {
  if (type === 'vogais') {
    const n = [...word].filter(ch => VOGAIS.has(ch)).length;
    return { tipo: 'vogais', valor: n, texto: `A palavra tem ${n} ${n === 1 ? 'vogal' : 'vogais'}.` };
  }
  // 'letra' (padrão): revela uma letra numa posição aleatória
  const pos = crypto.randomInt(5);
  return { tipo: 'letra', pos, letra: word[pos], texto: `A ${pos + 1}ª letra é "${word[pos]}".` };
}
