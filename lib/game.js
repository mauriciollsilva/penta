import crypto from 'node:crypto';
import { RESPOSTAS as RESP_PT, VALIDAS as VAL_PT } from './palavras.js';
import { RESPOSTAS as RESP_EN, VALIDAS as VAL_EN } from './palavras-en.js';

/* ============================================================
   PENTA — núcleo do jogo (roda SÓ no servidor)
   Bilíngue: cada idioma tem suas listas (respostas + palpites válidos).
   ============================================================ */

export const strip = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Ç/g, 'C').toUpperCase();

const LEXICO = {
  pt: { WORDS: RESP_PT, VALID: VAL_PT },
  en: { WORDS: RESP_EN, VALID: VAL_EN },
};
export const IDIOMAS = Object.keys(LEXICO);
export const isLang = l => Object.prototype.hasOwnProperty.call(LEXICO, l);
const lex = l => LEXICO[isLang(l) ? l : 'pt'];
export const isWord = (g, lang) => lex(lang).VALID.has(g);

const VOGAIS = new Set(['A', 'E', 'I', 'O', 'U']);

/* ---- Níveis de dificuldade ---- */
export const DIFFS = {
  facil:    { nome: 'Fácil',    tentativas: 6, hard: false, teclado: true,  dicasMax: 3, tempo: 0,  mult: 0.5, desc: 'Teclado colorido, dicas liberadas e mais folga. Pra relaxar.' },
  normal:   { nome: 'Normal',   tentativas: 6, hard: false, teclado: true,  dicasMax: 2, tempo: 0,  mult: 1,   desc: 'O Termo clássico: 6 tentativas, sem pegadinha.' },
  dificil:  { nome: 'Difícil',  tentativas: 5, hard: true,  teclado: true,  dicasMax: 0, tempo: 0,  mult: 2,   desc: 'Modo hard: letras reveladas são obrigatórias. 5 tentativas, sem dicas.' },
  lendario: { nome: 'Lendário', tentativas: 4, hard: true,  teclado: false, dicasMax: 0, tempo: 60, mult: 4,   desc: 'Sem cores no teclado, 4 tentativas, tempo por palpite. Só pra corajosos.' },
};
export const isDiff = d => Object.prototype.hasOwnProperty.call(DIFFS, d);
export const publicConfig = d => {
  const c = DIFFS[d];
  return { chave: d, nome: c.nome, tentativas: c.tentativas, hard: c.hard, teclado: c.teclado, dicasMax: c.dicasMax, tempo: c.tempo, mult: c.mult };
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

/* ---- Palavra do dia: determinística por (data + dificuldade + idioma + segredo) ---- */
export function dailyWord(dateStr, diff, lang) {
  const w = lex(lang).WORDS;
  const h = crypto.createHash('sha256').update(`${process.env.PENTA_SECRET || ''}|${dateStr}|${diff}|${isLang(lang) ? lang : 'pt'}`).digest();
  return w[h.readUInt32BE(0) % w.length];
}
export const randomWord = lang => { const w = lex(lang).WORDS; return w[crypto.randomInt(w.length)]; };

/* ---- Dicas (calculadas da palavra; o cliente formata o texto no idioma) ---- */
export function makeHint(word, type) {
  if (type === 'vogais') {
    const n = [...word].filter(ch => VOGAIS.has(ch)).length;
    return { tipo: 'vogais', valor: n };
  }
  const pos = crypto.randomInt(5);
  return { tipo: 'letra', pos, letra: word[pos] };
}
