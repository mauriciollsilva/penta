/* ================= PENTA — cliente (bilíngue PT/EN) ================= */
const $ = id => document.getElementById(id);
const mem = {};
const load = (k, def) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch { return k in mem ? mem[k] : def; } };
const save = (k, v) => { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const msToMidnight = () => { const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0); return m - n; };
const fmtHMS = ms => { const s = Math.max(0, Math.floor(ms / 1000)); const p = n => String(n).padStart(2, '0'); return `${p(Math.floor(s / 3600))}:${p(Math.floor(s % 3600 / 60))}:${p(s % 60)}`; };

/* ================= TRADUÇÕES ================= */
const T = {
  pt: {
    tagline: 'descubra a palavra de 5 letras',
    play: 'Jogar o desafio de hoje', free: 'Jogar no modo livre →',
    lbl_streak: 'Sequência', lbl_wins: 'Vitórias', lbl_points: 'Pontos', lbl_tries: 'Tentativas',
    howto_title: 'Como jogar',
    howto_lead: 'Descubra a <b>palavra secreta de 5 letras</b>. A cada tentativa, as cores mostram o quão perto você está.',
    lg_correct: '<b>Verde:</b> letra certa, no lugar certo.',
    lg_present: '<b>Amarelo:</b> a letra existe, mas em outro lugar.',
    lg_absent: '<b>Cinza:</b> a letra não está na palavra.',
    howto_modes_h: 'Dois jeitos de jogar',
    howto_daily: '<b>Diário:</b> uma palavra por dia, igual para todo mundo. Vale para a sua sequência.',
    howto_free: '<b>Livre:</b> jogue quantas vezes quiser, com palavras aleatórias. Ótimo pra treinar.',
    howto_levels_h: 'Níveis',
    howto_levels: 'De <b>Fácil</b> (com dicas e folga) até <b>Lendário</b> (sem cores no teclado, menos tentativas e tempo por palpite). Escolha em <b>Configurações</b>.',
    howto_hints_h: 'Dicas',
    howto_hints: 'Se ativar nas configurações, um botão de <b>dica</b> aparece nos níveis mais fáceis para revelar uma letra quando você travar.',
    howto_ok: 'Entendi!',
    settings_title: 'Configurações', name_label: 'Seu nome (opcional)', name_ph: 'Como quer ser chamado?',
    lang_label: 'Idioma', diff_label: 'Nível de dificuldade',
    hints_title: 'Ativar dicas', hints_desc: 'Mostra um botão de dica nos níveis que permitem (Fácil e Normal).',
    theme_label: 'Tema', ct_base: 'Base', ct_dark: 'Escuro', ct_light: 'Claro', ct_accent: 'Cor de destaque',
    save_back: 'Salvar e voltar',
    hint_btn: '💡 Dica', cd_label: 'Próxima palavra em', home: 'Início',
    daily_label: 'Diário', free_label: 'Livre', key_enter: 'Enviar',
    loading: 'Carregando…', already: 'Você já jogou o desafio de hoje', missing: 'Faltam letras',
    again_daily: 'Treinar no modo livre', again_free: 'Jogar de novo',
    lvl_pill: nome => `Nível: ${nome}`,
    lk_done: nome => `Desafio de hoje (<b>${nome}</b>) concluído.`,
    lk_won: tries => `Você acertou em ${tries}! 🎉`, lk_lost: 'Não foi dessa vez.', lk_next: 'até a próxima palavra',
    win_default: 'Parabéns!',
    win_msgs: { 1: 'Genial!', 2: 'Impressionante!', 3: 'Muito bem!', 4: 'Boa!', 5: 'Ufa!', 6: 'No limite!' },
    win_sub: a => `Você descobriu em ${a} ${a === 1 ? 'tentativa' : 'tentativas'}.`,
    timeout_title: 'Tempo esgotado!', timeout_name: nome => `Tempo esgotado, ${nome}!`, timeout_sub: 'A palavra fica em segredo dessa vez.',
    lose_title: 'Quase!', lose_name: nome => `Quase, ${nome}!`, lose_sub: 'A palavra era:',
    hint_letter: (pos, letra) => `A ${pos}ª letra é "${letra}".`,
    hint_vowels: n => `A palavra tem ${n} ${n === 1 ? 'vogal' : 'vogais'}.`,
    hints_counter: (u, m) => `Dicas: ${u}/${m}`,
    hard_pos: (letra, pos) => `Use "${letra}" na ${pos}ª posição.`,
    hard_has: letra => `A palavra tem a letra "${letra}".`,
    err_notword: 'Palavra não está na lista', err_nohints: 'Dicas não disponíveis neste nível',
    err_hintsmax: 'Você já usou todas as dicas', err_badtoken: 'Sessão inválida', err_gameover: 'Jogo já encerrado',
    niveis: {
      facil:    { nome: 'Fácil',    desc: 'Teclado colorido, dicas liberadas e mais folga.' },
      normal:   { nome: 'Normal',   desc: 'O Termo clássico: 6 tentativas, sem pegadinha.' },
      dificil:  { nome: 'Difícil',  desc: 'Letras reveladas viram obrigatórias. 5 tentativas.' },
      lendario: { nome: 'Lendário', desc: 'Sem cores no teclado, 4 tentativas e tempo por palpite.' },
    },
  },
  en: {
    tagline: 'guess the 5-letter word',
    play: "Play today's challenge", free: 'Play free mode →',
    lbl_streak: 'Streak', lbl_wins: 'Wins', lbl_points: 'Points', lbl_tries: 'Tries',
    howto_title: 'How to play',
    howto_lead: 'Find the <b>secret 5-letter word</b>. After each guess, the colors show how close you are.',
    lg_correct: '<b>Green:</b> right letter, right spot.',
    lg_present: '<b>Yellow:</b> the letter is in the word, wrong spot.',
    lg_absent: '<b>Gray:</b> the letter is not in the word.',
    howto_modes_h: 'Two ways to play',
    howto_daily: '<b>Daily:</b> one word a day, the same for everyone. Counts toward your streak.',
    howto_free: '<b>Free:</b> play as much as you like, with random words. Great for practice.',
    howto_levels_h: 'Levels',
    howto_levels: 'From <b>Easy</b> (with hints and slack) to <b>Legendary</b> (no keyboard colors, fewer tries and a timer per guess). Choose in <b>Settings</b>.',
    howto_hints_h: 'Hints',
    howto_hints: 'If enabled in settings, a <b>hint</b> button appears on the easier levels to reveal a letter when you get stuck.',
    howto_ok: 'Got it!',
    settings_title: 'Settings', name_label: 'Your name (optional)', name_ph: 'What should we call you?',
    lang_label: 'Language', diff_label: 'Difficulty level',
    hints_title: 'Enable hints', hints_desc: 'Shows a hint button on levels that allow it (Easy and Normal).',
    theme_label: 'Theme', ct_base: 'Base', ct_dark: 'Dark', ct_light: 'Light', ct_accent: 'Accent color',
    save_back: 'Save and go back',
    hint_btn: '💡 Hint', cd_label: 'Next word in', home: 'Home',
    daily_label: 'Daily', free_label: 'Free', key_enter: 'Enter',
    loading: 'Loading…', already: "You've already played today's challenge", missing: 'Not enough letters',
    again_daily: 'Practice in free mode', again_free: 'Play again',
    lvl_pill: nome => `Level: ${nome}`,
    lk_done: nome => `Today's challenge (<b>${nome}</b>) done.`,
    lk_won: tries => `You solved it in ${tries}! 🎉`, lk_lost: 'Not this time.', lk_next: 'until the next word',
    win_default: 'Congrats!',
    win_msgs: { 1: 'Genius!', 2: 'Impressive!', 3: 'Well done!', 4: 'Nice!', 5: 'Phew!', 6: 'Just in time!' },
    win_sub: a => `You solved it in ${a} ${a === 1 ? 'try' : 'tries'}.`,
    timeout_title: "Time's up!", timeout_name: nome => `Time's up, ${nome}!`, timeout_sub: 'The word stays secret this time.',
    lose_title: 'So close!', lose_name: nome => `So close, ${nome}!`, lose_sub: 'The word was:',
    hint_letter: (pos, letra) => `Letter ${pos} is "${letra}".`,
    hint_vowels: n => `The word has ${n} ${n === 1 ? 'vowel' : 'vowels'}.`,
    hints_counter: (u, m) => `Hints: ${u}/${m}`,
    hard_pos: (letra, pos) => `Use "${letra}" in position ${pos}.`,
    hard_has: letra => `The word has the letter "${letra}".`,
    err_notword: 'Not in word list', err_nohints: 'Hints not available on this level',
    err_hintsmax: "You've used all your hints", err_badtoken: 'Invalid session', err_gameover: 'Game already over',
    niveis: {
      facil:    { nome: 'Easy',      desc: 'Colored keyboard, hints on, and more slack.' },
      normal:   { nome: 'Normal',    desc: 'Classic mode: 6 tries, no tricks.' },
      dificil:  { nome: 'Hard',      desc: 'Revealed letters become required. 5 tries.' },
      lendario: { nome: 'Legendary', desc: 'No keyboard colors, 4 tries and a timer per guess.' },
    },
  },
};
const L = () => T[S.lang] || T.pt;
function applyLang() {
  const d = L();
  document.documentElement.lang = S.lang === 'en' ? 'en' : 'pt-BR';
  document.querySelectorAll('[data-i18n]').forEach(el => { const v = d[el.dataset.i18n]; if (typeof v === 'string') el.textContent = v; });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { const v = d[el.getAttribute('data-i18n-html')]; if (typeof v === 'string') el.innerHTML = v; });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { const v = d[el.getAttribute('data-i18n-ph')]; if (typeof v === 'string') el.placeholder = v; });
}
function toastErr(e) { const m = e.code && L()['err_' + e.code] ? L()['err_' + e.code] : (e.message || 'Erro'); toast(m); }

/* níveis: cor/multiplicador fixos; nome/descrição vêm da tradução */
const NIVEIS = {
  facil:    { cor: '#34d399', mult: 0.5 },
  normal:   { cor: '#a78bfa', mult: 1 },
  dificil:  { cor: '#f7b83a', mult: 2 },
  lendario: { cor: '#f472b6', mult: 4 },
};
const ORDEM = ['facil', 'normal', 'dificil', 'lendario'];
const niv = k => ({ cor: NIVEIS[k].cor, mult: NIVEIS[k].mult, ...L().niveis[k] });

/* ================= TEMAS ================= */
const _hx = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const _toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = _hx(a), B = _hx(b); return _toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]); };
const rgba = (h, a) => { const [r, g, b] = _hx(h); return `rgba(${r},${g},${b},${a})`; };
const SEMANTIC = { '--correct': '#34d399', '--correct-ink': '#04231a', '--present': '#f7b83a', '--present-ink': '#3a2600' };
function genTheme(accent, base = 'dark', neutral = false) {
  const a2 = mix(accent, '#000000', 0.14);
  if (base === 'light') {
    return { ...SEMANTIC,
      '--bg-1': mix('#ffffff', accent, 0.05), '--bg-2': mix('#efeafa', accent, 0.05), '--bg-3': mix('#f6f4fc', accent, 0.05),
      '--surface': mix('#ffffff', accent, 0.02), '--surface-2': mix('#f1ecfb', accent, 0.05), '--card': '#ffffff',
      '--border': mix('#e4def2', accent, 0.10), '--border-soft': mix('#ece7f6', accent, 0.08),
      '--text': '#241b3c', '--muted': '#6b6390', '--muted-2': '#948cb2',
      '--absent': mix('#d7d1e8', accent, 0.10), '--absent-ink': '#4a4270',
      '--accent': accent, '--accent-2': a2, '--accent-glow': rgba(accent, 0.35), '--pink': accent,
      '--key-bg': mix('#c9c2de', accent, 0.14), '--key-wide-bg': mix('#bdb6d4', accent, 0.16), '--key-absent-bg': mix('#e2ddee', accent, 0.08), '--key-absent-ink': '#8a82a8',
      '--glow-1': rgba(accent, 0.14), '--glow-2': rgba(accent, 0.08) };
  }
  const tint = (baseHex, amt) => neutral ? baseHex : mix(baseHex, accent, amt);
  return { ...SEMANTIC,
    '--bg-1': tint('#14141b', 0.15), '--bg-2': tint('#1c1c28', 0.20), '--bg-3': tint('#0a0a10', 0.09),
    '--surface': tint('#1b1b26', 0.12), '--surface-2': tint('#23232f', 0.15), '--card': tint('#1a1a25', 0.12),
    '--border': tint('#2f2f3d', 0.18), '--border-soft': tint('#27272f', 0.15),
    '--text': '#f3eff9', '--muted': tint('#9a9ab0', 0.12), '--muted-2': tint('#6a6a80', 0.12),
    '--absent': tint('#2f2f42', 0.15), '--absent-ink': tint('#b4b4cc', 0.08),
    '--accent': accent, '--accent-2': a2, '--accent-glow': rgba(accent, 0.45), '--pink': accent,
    '--key-bg': tint('#42424f', 0.14), '--key-wide-bg': tint('#38383f', 0.14), '--key-absent-bg': tint('#26262f', 0.10), '--key-absent-ink': tint('#66667a', 0.10),
    '--glow-1': rgba(accent, neutral ? 0.14 : 0.26), '--glow-2': rgba(accent, 0.12) };
}
const AMETISTA = {
  '--bg-1': '#17122b', '--bg-2': '#241844', '--bg-3': '#0d0a1c',
  '--surface': '#211a3c', '--surface-2': '#2a2150', '--card': '#251d46',
  '--border': '#3a2f5e', '--border-soft': '#332a52',
  '--text': '#f3effb', '--muted': '#a99fce', '--muted-2': '#7d7399', ...SEMANTIC,
  '--absent': '#39305a', '--absent-ink': '#b7addb',
  '--accent': '#a78bfa', '--accent-2': '#8b5cf6', '--accent-glow': 'rgba(167,139,250,.45)', '--pink': '#f472b6',
  '--key-bg': '#4a3f70', '--key-wide-bg': '#40365f', '--key-absent-bg': '#2a2344', '--key-absent-ink': '#6a6090',
  '--glow-1': 'rgba(139,92,246,.28)', '--glow-2': 'rgba(52,211,153,.14)',
};
const THEMES = {
  ametista:  { nome: 'Ametista',    vars: AMETISTA },
  esmeralda: { nome: 'Esmeralda',   vars: genTheme('#2dd4bf') },
  oceano:    { nome: 'Oceano',      vars: genTheme('#60a5fa') },
  rubi:      { nome: 'Rubi',        vars: genTheme('#fb7185') },
  ambar:     { nome: 'Âmbar',       vars: genTheme('#fb923c') },
  meianoite: { nome: 'Meia-noite',  vars: genTheme('#818cf8', 'dark', true) },
  claro:     { nome: 'Claro',       vars: genTheme('#8b5cf6', 'light') },
  custom:    { nome: 'Personalizar', vars: null },
};
const THEME_ORDER = ['ametista', 'esmeralda', 'oceano', 'rubi', 'ambar', 'meianoite', 'claro', 'custom'];
const ACCENTS = ['#a78bfa', '#2dd4bf', '#60a5fa', '#fb7185', '#fb923c', '#f472b6', '#34d399', '#facc15'];
function themeVars(key) {
  if (key === 'custom') { const c = S.custom || { base: 'dark', accent: '#a78bfa' }; return genTheme(c.accent, c.base, false); }
  return (THEMES[key] || THEMES.ametista).vars;
}
function applyTheme(key) { const v = themeVars(key); for (const k in v) document.documentElement.style.setProperty(k, v[k]); }
function renderThemes() {
  const grid = $('themeGrid'); grid.innerHTML = '';
  THEME_ORDER.forEach(key => {
    const th = THEMES[key], v = themeVars(key);
    const el = document.createElement('button');
    el.className = 'theme-sw' + (key === S.theme ? ' sel' : '');
    el.innerHTML = `<div class="sw-prev" style="background:linear-gradient(150deg,${v['--bg-2']},${v['--bg-3']})">
        <span class="sw-t" style="background:${v['--correct']}"></span>
        <span class="sw-dot" style="background:${v['--accent']}"></span>
        <span class="sw-t" style="background:${v['--present']}"></span>
      </div><div class="sw-name">${th.nome}</div>`;
    el.addEventListener('click', () => { S.theme = key; save('penta_theme', key); applyTheme(key); renderThemes(); });
    grid.appendChild(el);
  });
  $('customTheme').hidden = S.theme !== 'custom';
  if (S.theme === 'custom') syncCustom();
}
function syncCustom() {
  const c = S.custom || (S.custom = { base: 'dark', accent: '#a78bfa' });
  $('customColor').value = c.accent;
  document.querySelectorAll('#baseSeg .seg-btn').forEach(b => b.classList.toggle('on', b.dataset.base === c.base));
  const chips = $('accentChips'); chips.innerHTML = '';
  ACCENTS.forEach(col => {
    const ch = document.createElement('button');
    ch.className = 'chip' + (col.toLowerCase() === c.accent.toLowerCase() ? ' on' : '');
    ch.style.background = col;
    ch.addEventListener('click', () => { c.accent = col; save('penta_custom', c); applyTheme('custom'); syncCustom(); });
    chips.appendChild(ch);
  });
}

/* estado */
const S = {
  name: '', diff: 'normal', hints: false, lang: 'pt',
  stats: { vitorias: 0, jogos: 0, sequencia: 0, melhor: 0, pontos: 0 },
  daily: {},
  token: '', cfg: null, mode: 'diario', answer: '',
  row: 0, col: 0, grid: [], locked: false, over: false,
  greens: {}, req: new Set(), hintsUsed: 0,
  rowTimer: null, timerLeft: 0,
  theme: 'ametista', custom: { base: 'dark', accent: '#a78bfa' },
};
let homeCd = null, resultCd = null;

/* ---------- API ---------- */
async function api(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const err = new Error(data.error || 'Erro'); err.code = data.code; throw err; }
  return data;
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 1800); }

/* ---------- navegação ---------- */
const SCREENS = ['home', 'howto', 'settings', 'game'];
function show(name) {
  SCREENS.forEach(s => $(s).classList.toggle('active', s === name));
  if (name !== 'home' && homeCd) { clearInterval(homeCd); homeCd = null; }
  if (name === 'home') renderHome();
}
document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => show('home')));
$('howtoBtn').addEventListener('click', () => show('howto'));
$('settingsBtn').addEventListener('click', () => { renderSettings(); show('settings'); });
$('levelPill').addEventListener('click', () => { renderSettings(); show('settings'); });
$('gameBack').addEventListener('click', () => { stopRowTimer(); show('home'); });

/* ---------- HOME ---------- */
function renderHome() {
  $('stStreak').textContent = S.stats.sequencia;
  $('stWins').textContent = S.stats.vitorias;
  $('stPts').textContent = S.stats.pontos;
  const n = niv(S.diff);
  $('levelPill').innerHTML = `<span class="lv-dot" style="background:${n.cor}"></span> ${L().lvl_pill(n.nome)}`;

  const rec = S.daily[S.diff];
  const jogouHoje = rec && rec.date === today();
  const lock = $('dailyLocked'), play = $('playBtn');
  if (homeCd) { clearInterval(homeCd); homeCd = null; }
  if (jogouHoje) {
    play.hidden = true; lock.hidden = false;
    const status = rec.won ? L().lk_won(rec.tries) : L().lk_lost;
    const tick = () => { lock.innerHTML = `${L().lk_done(n.nome)}<br>${status}<div class="cd">${fmtHMS(msToMidnight())}</div><div style="font-size:12px;color:var(--muted-2)">${L().lk_next}</div>`; };
    tick(); homeCd = setInterval(tick, 1000);
  } else {
    play.hidden = false; lock.hidden = true;
  }
}

/* ---------- CONFIGURAÇÕES ---------- */
function renderSettings() {
  $('nameInput').value = S.name;
  document.querySelectorAll('#langSeg .seg-btn').forEach(b => b.classList.toggle('on', b.dataset.lang === S.lang));
  const wrap = $('levelCards'); wrap.innerHTML = '';
  ORDEM.forEach(k => {
    const n = niv(k);
    const card = document.createElement('button');
    card.className = 'level-card' + (k === S.diff ? ' sel' : '');
    card.innerHTML = `<span class="lc-badge" style="background:${n.cor}"></span>
      <div><div class="lc-name">${n.nome} <span class="lc-mult">${n.mult}× pts</span></div>
      <div class="lc-desc">${n.desc}</div></div>`;
    card.addEventListener('click', () => { S.diff = k; save('penta_diff', k); renderSettings(); });
    wrap.appendChild(card);
  });
  $('hintsToggle').setAttribute('aria-checked', String(S.hints));
  renderThemes();
}
$('nameInput').addEventListener('input', e => { S.name = e.target.value.trim(); save('penta_name', S.name); });
$('hintsToggle').addEventListener('click', () => { S.hints = !S.hints; save('penta_hints', S.hints); $('hintsToggle').setAttribute('aria-checked', String(S.hints)); });
$('langSeg').addEventListener('click', e => { const b = e.target.closest('.seg-btn'); if (!b) return; S.lang = b.dataset.lang; save('penta_lang', S.lang); applyLang(); renderSettings(); });
$('baseSeg').addEventListener('click', e => { const b = e.target.closest('.seg-btn'); if (!b) return; const c = S.custom || (S.custom = { base: 'dark', accent: '#a78bfa' }); c.base = b.dataset.base; save('penta_custom', c); if (S.theme === 'custom') applyTheme('custom'); syncCustom(); });
$('customColor').addEventListener('input', e => { const c = S.custom || (S.custom = { base: 'dark', accent: '#a78bfa' }); c.accent = e.target.value; save('penta_custom', c); if (S.theme === 'custom') applyTheme('custom'); syncCustom(); });

/* ---------- iniciar partida ---------- */
async function startGame(mode) {
  if (mode === 'diario') { const rec = S.daily[S.diff]; if (rec && rec.date === today()) { toast(L().already); return; } }
  const btn = mode === 'diario' ? $('playBtn') : $('freeBtn');
  const prev = btn.textContent; btn.disabled = true; btn.textContent = L().loading;
  let data;
  try { data = await api(mode === 'diario' ? '/api/daily' : '/api/new', { difficulty: S.diff, lang: S.lang }); }
  catch (e) { toastErr(e); btn.disabled = false; btn.textContent = prev; return; }
  btn.disabled = false; btn.textContent = prev;

  S.token = data.token; S.cfg = data.config; S.mode = mode; S.answer = '';
  S.row = 0; S.col = 0; S.locked = false; S.over = false;
  S.greens = {}; S.req = new Set(); S.hintsUsed = 0;
  S.grid = Array.from({ length: S.cfg.tentativas }, () => Array(5).fill(''));

  $('gameTitle').textContent = `${mode === 'diario' ? L().daily_label : L().free_label} · ${niv(S.diff).nome}`;
  document.documentElement.style.setProperty('--rows', S.cfg.tentativas);
  buildBoard(S.cfg.tentativas);
  buildKeyboard();
  resetKeyboardColors();
  renderCaret();

  const showHints = S.cfg.dicasMax > 0 && S.hints;
  $('hintBar').hidden = !showHints;
  if (showHints) { $('hintBtn').disabled = false; $('hintText').textContent = L().hints_counter(0, S.cfg.dicasMax); }

  stopRowTimer();
  if (S.cfg.tempo > 0) { startRowTimer(); } else { $('gameRight').innerHTML = S.stats.sequencia ? `🔥 ${S.stats.sequencia}` : ''; }

  show('game');
}
$('playBtn').addEventListener('click', () => startGame('diario'));
$('freeBtn').addEventListener('click', () => startGame('livre'));

/* ---------- tabuleiro / teclado ---------- */
function buildBoard(rows) {
  const b = $('board'); b.innerHTML = '';
  for (let r = 0; r < rows; r++) {
    const row = document.createElement('div'); row.className = 'row'; row.id = 'row-' + r;
    for (let c = 0; c < 5; c++) {
      const t = document.createElement('div'); t.className = 'tile'; t.id = `t-${r}-${c}`;
      t.innerHTML = `<div class="tile-inner"><div class="face front"></div><div class="face back"></div></div>`;
      row.appendChild(t);
    }
    b.appendChild(row);
  }
}
const LAYOUT = [['Q','W','E','R','T','Y','U','I','O','P'], ['A','S','D','F','G','H','J','K','L'], ['ENTER','Z','X','C','V','B','N','M','DEL']];
function buildKeyboard() {
  const kb = $('keyboard'); kb.innerHTML = '';
  LAYOUT.forEach(rk => {
    const kr = document.createElement('div'); kr.className = 'krow';
    rk.forEach(k => {
      const btn = document.createElement('button'); btn.className = 'key'; btn.dataset.key = k;
      btn.textContent = k === 'ENTER' ? L().key_enter : k === 'DEL' ? '⌫' : k;
      if (k === 'ENTER' || k === 'DEL') btn.classList.add('wide');
      btn.addEventListener('click', () => handleKey(k));
      kr.appendChild(btn);
    });
    kb.appendChild(kr);
  });
}
const resetKeyboardColors = () => document.querySelectorAll('.key').forEach(k => k.classList.remove('correct', 'present', 'absent'));

document.addEventListener('keydown', e => {
  if (!$('game').classList.contains('active') || $('overlay').classList.contains('show')) return;
  if (e.key === 'Enter') handleKey('ENTER');
  else if (e.key === 'Backspace') handleKey('DEL');
  else if (e.key === 'ArrowLeft') { e.preventDefault(); handleKey('LEFT'); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); handleKey('RIGHT'); }
  else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
});
// clicar numa casa da linha atual move o cursor pra lá (pra sobrescrever a letra)
$('board').addEventListener('click', e => {
  if (S.locked || S.over) return;
  const tile = e.target.closest('.tile'); if (!tile) return;
  const m = /^t-(\d+)-(\d+)$/.exec(tile.id); if (!m || Number(m[1]) !== S.row) return;
  S.col = Number(m[2]); renderCaret();
});
function handleKey(k) {
  if (S.locked || S.over) return;
  if (k === 'ENTER') return submitRow();
  if (k === 'LEFT') { S.col = Math.max(0, S.col - 1); return renderCaret(); }
  if (k === 'RIGHT') { S.col = Math.min(5, S.col + 1); return renderCaret(); }
  if (k === 'DEL') {
    if (S.col < 5 && S.grid[S.row][S.col]) { S.grid[S.row][S.col] = ''; paint(S.row, S.col, ''); }
    else if (S.col > 0) { S.col--; S.grid[S.row][S.col] = ''; paint(S.row, S.col, ''); }
    return renderCaret();
  }
  if (S.col < 5) { S.grid[S.row][S.col] = k; paint(S.row, S.col, k); S.col = Math.min(S.col + 1, 5); renderCaret(); }
}
// cursor: destaca a casa que será digitada/sobrescrita na linha atual
function renderCaret() {
  document.querySelectorAll('.tile.caret').forEach(t => t.classList.remove('caret'));
  if (S.over || S.locked || S.col >= 5) return;
  const t = $(`t-${S.row}-${S.col}`); if (t) t.classList.add('caret');
}
function paint(r, c, ch) { const t = $(`t-${r}-${c}`); t.querySelector('.front').textContent = ch; t.classList.toggle('filled', !!ch); }

function hardModeError(g) {
  for (const [i, letra] of Object.entries(S.greens)) if (g[i] !== letra) return L().hard_pos(letra, Number(i) + 1);
  for (const ch of S.req) if (!g.includes(ch)) return L().hard_has(ch);
  return null;
}

async function submitRow() {
  if (S.grid[S.row].some(c => !c)) { shake(); toast(L().missing); return; }
  const guess = S.grid[S.row].join('');
  if (S.cfg.hard) { const err = hardModeError(guess); if (err) { shake(); toast(err); return; } }

  S.locked = true; stopRowTimer(); renderCaret();
  let data;
  try { data = await api('/api/guess', { token: S.token, guess }); }
  catch (e) { S.locked = false; if (e.code === 'notword') buzz(); else shake(); toastErr(e); renderCaret(); if (S.cfg.tempo > 0) startRowTimer(); return; }

  const result = data.result;
  result.forEach((st, i) => {
    const t = $(`t-${S.row}-${i}`);
    t.querySelector('.back').textContent = guess[i];
    t.querySelector('.back').classList.add(st);
    setTimeout(() => t.classList.add('reveal'), i * 300);
  });

  setTimeout(() => {
    result.forEach((st, i) => {
      if (st === 'correct') { S.greens[i] = guess[i]; S.req.add(guess[i]); }
      else if (st === 'present') S.req.add(guess[i]);
      if (S.cfg.teclado) updateKey(guess[i], st);
    });
    if (data.gameOver) {
      S.answer = data.answer || '';
      endGame(data.won, { attempt: data.attempt });
    } else {
      S.token = data.token; S.row++; S.col = 0; S.locked = false; renderCaret();
      if (S.cfg.tempo > 0) startRowTimer();
    }
  }, (5 - 1) * 300 + 600);
}

const RANK = { correct: 3, present: 2, absent: 1 };
function updateKey(letter, st) {
  const k = document.querySelector(`.key[data-key="${letter}"]`); if (!k) return;
  const cur = k.classList.contains('correct') ? 'correct' : k.classList.contains('present') ? 'present' : k.classList.contains('absent') ? 'absent' : null;
  if (cur && RANK[cur] >= RANK[st]) return;
  k.classList.remove('correct', 'present', 'absent'); k.classList.add(st);
}
function shake() { const r = $('row-' + S.row); r.classList.add('shake'); setTimeout(() => r.classList.remove('shake'), 450); }
function buzz() { const r = $('row-' + S.row); r.classList.remove('buzz'); void r.offsetWidth; r.classList.add('buzz'); setTimeout(() => r.classList.remove('buzz'), 600); }

/* ---------- dica ---------- */
$('hintBtn').addEventListener('click', async () => {
  if (S.locked || S.over) return;
  let data;
  try { data = await api('/api/hint', { token: S.token, type: 'letra' }); }
  catch (e) { toastErr(e); return; }
  S.token = data.token; S.hintsUsed = data.hintsUsados;
  const h = data.hint;
  const txt = h.tipo === 'vogais' ? L().hint_vowels(h.valor) : L().hint_letter(h.pos + 1, h.letra);
  $('hintText').textContent = `${txt}  (${data.hintsUsados}/${data.dicasMax})`;
  if (data.hintsUsados >= data.dicasMax) $('hintBtn').disabled = true;
  toast(txt);
});

/* ---------- timer lendário ---------- */
function startRowTimer() {
  S.timerLeft = S.cfg.tempo;
  renderTimer();
  S.rowTimer = setInterval(() => {
    S.timerLeft--;
    renderTimer();
    if (S.timerLeft <= 0) { stopRowTimer(); onTimeout(); }
  }, 1000);
}
function stopRowTimer() { if (S.rowTimer) { clearInterval(S.rowTimer); S.rowTimer = null; } }
function renderTimer() {
  const m = Math.floor(S.timerLeft / 60), s = S.timerLeft % 60;
  $('gameRight').innerHTML = `<span class="timer-pill${S.timerLeft <= 10 ? ' danger' : ''}">⏱ ${m}:${String(s).padStart(2, '0')}</span>`;
}
function onTimeout() {
  if (S.over) return;
  S.locked = true; S.answer = '';
  endGame(false, { timeout: true });
}

/* ---------- fim de jogo ---------- */
function endGame(won, opts = {}) {
  S.over = true; stopRowTimer();
  S.stats.jogos++;
  let pts = 0;
  if (won) {
    const restantes = S.cfg.tentativas - opts.attempt;
    pts = Math.round(1000 * (restantes + 1) / (S.cfg.tentativas + 1) * S.cfg.mult) - S.hintsUsed * 100;
    pts += Math.min(S.stats.sequencia * 20, 200);
    pts = Math.max(0, pts);
    S.stats.vitorias++; S.stats.pontos += pts;
    S.stats.sequencia++; S.stats.melhor = Math.max(S.stats.melhor, S.stats.sequencia);
    for (let i = 0; i < 5; i++) setTimeout(() => $(`t-${opts.attempt - 1}-${i}`).classList.add('win'), i * 80);
  } else {
    S.stats.sequencia = 0;
  }
  if (S.mode === 'diario') S.daily[S.diff] = { date: today(), won, tries: won ? opts.attempt : 'X', pts };
  save('penta_stats', S.stats); save('penta_daily', S.daily);
  setTimeout(() => showResult(won, pts, opts), won ? 600 : 250);
}

function showResult(won, pts, opts) {
  const nome = S.name;
  if (won) {
    $('rEmoji').textContent = opts.attempt <= 2 ? '🏆' : '🎉';
    const m = L().win_msgs[opts.attempt] || L().win_default;
    $('rTitle').textContent = nome ? `${m.replace('!', '')}, ${nome}!` : m;
    $('rSub').textContent = L().win_sub(opts.attempt);
    fireConfetti();
  } else if (opts.timeout) {
    $('rEmoji').textContent = '⏱';
    $('rTitle').textContent = nome ? L().timeout_name(nome) : L().timeout_title;
    $('rSub').textContent = L().timeout_sub;
  } else {
    $('rEmoji').textContent = '😔';
    $('rTitle').textContent = nome ? L().lose_name(nome) : L().lose_title;
    $('rSub').textContent = L().lose_sub;
  }

  const wr = $('rWord');
  if (S.answer) { wr.hidden = false; wr.className = 'word-reveal' + (won ? '' : ' lose'); wr.innerHTML = ''; for (const ch of S.answer) { const s = document.createElement('span'); s.textContent = ch; wr.appendChild(s); } }
  else wr.hidden = true;

  $('rTries').textContent = won ? `${opts.attempt}/${S.cfg.tentativas}` : 'X';
  $('rPts').textContent = pts;
  $('rStreak').textContent = S.stats.sequencia;

  const cd = $('rCountdown');
  if (resultCd) { clearInterval(resultCd); resultCd = null; }
  if (S.mode === 'diario') {
    cd.hidden = false;
    const tick = () => { $('cdClock').textContent = fmtHMS(msToMidnight()); };
    tick(); resultCd = setInterval(tick, 1000);
  } else cd.hidden = true;

  const again = $('againBtn');
  again.textContent = S.mode === 'diario' ? L().again_daily : L().again_free;
  again.onclick = () => { closeOverlay(); startGame('livre'); };
  $('overlay').classList.add('show');
}
function closeOverlay() { $('overlay').classList.remove('show'); if (resultCd) { clearInterval(resultCd); resultCd = null; } }
$('rHomeBtn').addEventListener('click', () => { closeOverlay(); show('home'); });

/* ---------- confete ---------- */
const cvs = $('confetti'), ctx = cvs.getContext('2d');
let parts = [], raf = null;
function fireConfetti() {
  cvs.style.display = 'block'; cvs.width = innerWidth; cvs.height = innerHeight;
  const cores = ['#34d399', '#f7b83a', '#a78bfa', '#f472b6', '#ffffff', '#10b981'];
  const N = matchMedia('(prefers-reduced-motion:reduce)').matches ? 30 : 140;
  parts = [];
  for (let i = 0; i < N; i++) parts.push({ x: innerWidth / 2 + (Math.random() - .5) * 140, y: innerHeight * .42, vx: (Math.random() - .5) * 9, vy: Math.random() * -11 - 4, s: Math.random() * 7 + 4, c: cores[i % cores.length], rot: Math.random() * 6.28, vr: (Math.random() - .5) * .3, life: 1 });
  cancelAnimationFrame(raf); tick();
  function tick() {
    ctx.clearRect(0, 0, cvs.width, cvs.height); let alive = false;
    for (const p of parts) { p.vy += .32; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= .008; if (p.life > 0 && p.y < cvs.height + 30) { alive = true; ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore(); } }
    if (alive) raf = requestAnimationFrame(tick); else { ctx.clearRect(0, 0, cvs.width, cvs.height); cvs.style.display = 'none'; }
  }
}

/* ---------- init ---------- */
(function init() {
  S.lang = load('penta_lang', 'pt'); if (!(S.lang in T)) S.lang = 'pt';
  S.name = load('penta_name', '');
  S.diff = load('penta_diff', 'normal'); if (!NIVEIS[S.diff]) S.diff = 'normal';
  S.hints = load('penta_hints', false);
  S.stats = Object.assign({ vitorias: 0, jogos: 0, sequencia: 0, melhor: 0, pontos: 0 }, load('penta_stats', {}));
  S.daily = load('penta_daily', {});
  S.theme = load('penta_theme', 'ametista'); if (!THEMES[S.theme]) S.theme = 'ametista';
  S.custom = load('penta_custom', { base: 'dark', accent: '#a78bfa' });
  applyTheme(S.theme);
  applyLang();
  renderHome();
})();
