import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  score, seal, open, strip, isDiff, publicConfig,
  dailyWord, randomWord, makeHint, DIFFS, isWord, isLang,
} from './lib/game.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;
const VALIDAR_PALPITE = true;   // aceita só palavras reais (VALIDAS); false = qualquer 5 letras
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

/* ---------- helpers ---------- */
const send = (res, code, obj) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
};
function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e5) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };
async function serveStatic(req, res) {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel === '/') rel = '/index.html';
  const full = path.join(PUBLIC, path.normalize(rel));
  if (!full.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Forbidden'); }
  try {
    const buf = await readFile(full);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(full)] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
  }
}

/* ---------- API ---------- */
async function api(req, res) {
  const url = new URL(req.url, 'http://x').pathname;

  // Desafio DIÁRIO (palavra do dia por dificuldade + idioma)
  if (url === '/api/daily' && req.method === 'POST') {
    const { difficulty, lang } = await readBody(req);
    const d = isDiff(difficulty) ? difficulty : 'normal';
    const l = isLang(lang) ? lang : 'pt';
    const w = dailyWord(today(), d, l);
    return send(res, 200, { token: seal({ w, n: 0, d, mode: 'diario', date: today(), hints: 0, lang: l }), config: publicConfig(d), date: today(), lang: l });
  }

  // Modo LIVRE (palavra aleatória)
  if (url === '/api/new' && req.method === 'POST') {
    const { difficulty, lang } = await readBody(req);
    const d = isDiff(difficulty) ? difficulty : 'normal';
    const l = isLang(lang) ? lang : 'pt';
    const w = randomWord(l);
    return send(res, 200, { token: seal({ w, n: 0, d, mode: 'livre', hints: 0, lang: l }), config: publicConfig(d), lang: l });
  }

  // Confere um palpite
  if (url === '/api/guess' && req.method === 'POST') {
    const { token, guess } = await readBody(req);
    if (!token) return send(res, 400, { error: 'Sessão ausente', code: 'notoken' });
    const g = strip(guess);
    if (!/^[A-Z]{5}$/.test(g)) return send(res, 400, { error: 'Palpite inválido', code: 'badguess' });
    let st; try { st = open(token); } catch { return send(res, 400, { error: 'Sessão inválida', code: 'badtoken' }); }
    if (VALIDAR_PALPITE && !isWord(g, st.lang)) return send(res, 400, { error: 'Palavra não está na lista', code: 'notword' });
    const max = DIFFS[st.d].tentativas;
    if (st.n >= max) return send(res, 400, { error: 'Jogo já encerrado', code: 'gameover' });

    const result = score(g, st.w);
    const n = st.n + 1;
    const won = g === st.w;
    const over = won || n >= max;
    const payload = { result, attempt: n, won, gameOver: over };
    if (over) payload.answer = st.w;
    else payload.token = seal({ ...st, n });
    return send(res, 200, payload);
  }

  // Dica (se o nível permitir)
  if (url === '/api/hint' && req.method === 'POST') {
    const { token, type } = await readBody(req);
    if (!token) return send(res, 400, { error: 'Sessão ausente', code: 'notoken' });
    let st; try { st = open(token); } catch { return send(res, 400, { error: 'Sessão inválida', code: 'badtoken' }); }
    const max = DIFFS[st.d].dicasMax;
    if (max <= 0) return send(res, 403, { error: 'Dicas não disponíveis neste nível', code: 'nohints' });
    if ((st.hints || 0) >= max) return send(res, 403, { error: 'Você já usou todas as dicas', code: 'hintsmax' });
    const hint = makeHint(st.w, type);
    const hints = (st.hints || 0) + 1;
    return send(res, 200, { hint, hintsUsados: hints, dicasMax: max, token: seal({ ...st, hints }) });
  }

  return send(res, 404, { error: 'Rota não encontrada' });
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) return api(req, res).catch(e => send(res, 500, { error: e.message }));
  return serveStatic(req, res);
}).listen(PORT, () => console.log(`PENTA rodando em http://localhost:${PORT}`));
