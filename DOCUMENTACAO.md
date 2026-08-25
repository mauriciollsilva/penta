# PENTA — Documentação Completa

> Jogo de palavras estilo Termo, com modo Diário e Livre, 4 níveis de dificuldade,
> dicas, temas e contagem regressiva. A palavra secreta fica **no servidor**.
>
> No ar em: **https://penta.geologiadoceara.cloud**
>
> Este documento é o guia para você mesmo alterar e republicar o projeto no futuro.

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Tecnologias usadas](#2-tecnologias-usadas)
3. [Estrutura de arquivos](#3-estrutura-de-arquivos)
4. [Como funciona (arquitetura)](#4-como-funciona-arquitetura)
5. [Backend em detalhe](#5-backend-em-detalhe)
6. [Frontend em detalhe](#6-frontend-em-detalhe)
7. [Regras e lógica do jogo](#7-regras-e-lógica-do-jogo)
8. [Como fazer alterações comuns](#8-como-fazer-alterações-comuns)
9. [Montando o ambiente de desenvolvimento](#9-montando-o-ambiente-de-desenvolvimento)
10. [Publicação no VPS (deploy)](#10-publicação-no-vps-deploy)
11. [Solução de problemas (troubleshooting)](#11-solução-de-problemas-troubleshooting)
12. [Atualizando o que já está no ar](#12-atualizando-o-que-já-está-no-ar)
13. [Ligar, desligar e reiniciar quando quiser](#13-ligar-desligar-e-reiniciar-quando-quiser)
14. [Sites de referência e bibliotecas](#14-sites-de-referência-e-bibliotecas)
15. [Dicas para desenvolvedor iniciante](#15-dicas-para-desenvolvedor-iniciante)
16. [Segurança](#16-segurança)
17. [Limitações atuais e próximos passos](#17-limitações-atuais-e-próximos-passos)
18. [Glossário](#18-glossário)

---

## 1. Visão geral

PENTA é um jogo web: o jogador tenta descobrir uma palavra de 5 letras em algumas tentativas,
e as cores (verde/amarelo/cinza) indicam o quão perto ele está — igual ao Termo/Wordle.

Duas ideias centrais guiaram o projeto:

- **Simplicidade de operação:** nenhuma dependência externa. O servidor usa só o que já vem
  no Node.js, e o site é HTML/CSS/JavaScript puro. Isso torna o deploy trivial e o código fácil de ler.
- **A palavra fica escondida:** diferente de um jogo 100% no navegador (onde dá pra "inspecionar"
  a página e achar a resposta), aqui a palavra e a correção ficam **no servidor**. O navegador só
  recebe as cores de cada palpite.

---

## 2. Tecnologias usadas

| Camada | Tecnologia | Observação |
|---|---|---|
| Back-end | **Node.js** (JavaScript) | Servidor HTTP + API. Usa **ES Modules** (`import`/`export`). |
| Back-end (built-ins) | `node:http`, `node:crypto`, `node:fs/promises`, `node:url`, `node:path` | Módulos nativos — não precisa instalar nada. |
| Front-end | **HTML5 + CSS3 + JavaScript (vanilla)** | Sem React/Vue, sem passo de build. |
| Fontes | Google Fonts | Bricolage Grotesque, Space Grotesk, Inter. |
| Criptografia | AES-256-GCM e SHA-256 | Via `node:crypto`. Escondem a palavra e geram a palavra do dia. |
| Persistência (cliente) | `localStorage` | Guarda nome, estatísticas, tema (no navegador do jogador). |
| Deploy | **Git + PM2 + nginx + certbot** | Versionamento, gerenciador de processo, proxy reverso e HTTPS. |

> **Por que "sem bibliotecas" é bom aqui?** Menos coisas pra instalar, atualizar e quebrar;
> deploy mais simples; e você entende 100% do que roda. Quando o projeto crescer (ex.: login),
> aí sim vale a pena adicionar bibliotecas específicas — veja a [seção 17](#17-limitações-atuais-e-próximos-passos).

---

## 3. Estrutura de arquivos

```
penta-app/            (no VPS fica clonada como ~/projetos/penta)
├── server.js            # Servidor Node: serve o site + responde a API
├── package.json         # "Ficha técnica" do projeto (habilita `npm start` e ES Modules)
├── README.md            # Instruções rápidas
├── DOCUMENTACAO.md      # Este arquivo
├── .gitignore           # O que NÃO vai pro Git (node_modules, logs, .env)
├── lib/
│   ├── game.js          # "Cérebro": regras, cifra, palavra do dia, dicas
│   ├── palavras.js      # Palavras em português (respostas + palpites válidos)
│   └── palavras-en.js   # Palavras em inglês (respostas + palpites válidos)
└── public/              # Tudo que vai pro navegador (o nginx pode servir direto)
    ├── index.html       # Estrutura das telas
    ├── style.css        # Aparência + sistema de temas (variáveis CSS)
    └── app.js           # Lógica do jogo no navegador
```

**Regra mental:** `lib/` e `server.js` rodam **no servidor** (o jogador nunca vê).
`public/` roda **no navegador** (qualquer um pode ver o código-fonte). Segredos e a palavra
**nunca** vão pra dentro de `public/`.

---

## 4. Como funciona (arquitetura)

```
   NAVEGADOR (public/)                         SERVIDOR (Node)
   ┌────────────────────┐                      ┌───────────────────────────┐
   │ index.html         │   GET / , /app.js    │ server.js                 │
   │ style.css          │◄────────────────────►│  • serve arquivos public/ │
   │ app.js  ───────────┼──POST /api/daily────►│  • roteia /api/*          │
   │  (desenha, anima,  │◄──token + config─────┤                           │
   │   guarda no local- │                      │ lib/game.js               │
   │   Storage)         │──POST /api/guess────►│  • score() colore         │
   │                    │◄──cores (+resposta   │  • seal()/open() cifra    │
   │                    │     no fim)          │  • dailyWord() palavra    │
   └────────────────────┘                      └───────────────────────────┘
```

Em produção, o **nginx** fica na frente recebendo as visitas em `https://penta.geologiadoceara.cloud`
e as encaminha para o Node, que roda numa porta interna (no nosso caso, a **3010**).

**Ciclo de uma partida:**

1. O jogador clica "Jogar". O `app.js` faz um `POST /api/daily` (ou `/api/new`).
2. O servidor sorteia/escolhe a palavra, guarda o estado do jogo **cifrado** num "token"
   e devolve só o token + as configurações do nível (nº de tentativas etc.). **A palavra não vai.**
3. A cada palpite, o `app.js` manda `POST /api/guess` com o token + o palpite.
4. O servidor abre o token, compara o palpite com a palavra, devolve as **cores** e um token
   novo (com a tentativa somada). A palavra só é revelada quando o jogo acaba.

O token é como um "envelope lacrado": o navegador carrega ele de um lado pro outro, mas não
consegue abrir nem falsificar.

---

## 5. Backend em detalhe

### `server.js`

Servidor HTTP puro (sem Express). Responsabilidades:

- **Servir arquivos estáticos** de `public/` (o `index.html`, `style.css`, `app.js`).
  - Tem proteção contra *path traversal* (impede pedir algo tipo `../../etc/senha`):
    o caminho resolvido precisa começar dentro da pasta `public/`.
  - Define o `Content-Type` certo por extensão (`.html`, `.css`, `.js`...).
- **Rotear a API** (`/api/*`): lê o corpo JSON da requisição e chama a função certa.
- **Porta:** variável de ambiente `PORT` (padrão `3000`; em produção usamos `3010`).

### `lib/game.js`

O "cérebro". Partes:

#### Palavras e validação (bilíngue)
O jogo é **bilíngue** (português e inglês). Cada idioma tem seu arquivo em `lib/`:
- **Português** — `palavras.js`, gerado do corpus **fserb/pt-br** (do criador do Termo): ~1.290 respostas comuns (filtradas por frequência ICF) e ~8.400 palpites válidos. Palavrões (lista "negativas" do criador) e nomes próprios (países/estados/municípios) removidos.
- **Inglês** — `palavras-en.js`: ~2.310 respostas (as respostas oficiais do Wordle — fonte `ljskernel/wordle-solver`) e ~14.800 palpites válidos (fonte `tabatkins/wordle-list`). Ofensas de 5 letras removidas.
- Em `game.js`, `LEXICO` junta os dois idiomas; `isWord(g, lang)` diz se um palpite é palavra real **naquele idioma**, e `dailyWord`/`randomWord` recebem o idioma.
- `strip(s)`: remove acentos e troca `Ç`→`C`, deixando maiúsculas. Ex.: `"AÇÃO"`→`"ACAO"`.
- `VOGAIS`: conjunto `A E I O U` (usado nas dicas).

#### `DIFFS` — configuração dos níveis
Um objeto onde cada nível define o comportamento do jogo:

| Campo | Significado |
|---|---|
| `nome` | Nome exibido ("Fácil", "Normal"...). |
| `tentativas` | Quantos palpites o jogador tem. |
| `hard` | Se `true`, letras já reveladas são **obrigatórias** no próximo palpite (modo difícil). |
| `teclado` | Se `true`, o teclado colore as letras usadas. No Lendário é `false`. |
| `dicasMax` | Quantas dicas o nível permite (0 = nenhuma). |
| `tempo` | Segundos por palpite (0 = sem limite). Só o Lendário usa. |
| `mult` | Multiplicador de pontos do nível. |
| `desc` | Descrição curta mostrada nas Configurações. |

- `publicConfig(d)`: devolve uma versão "segura" do nível pra mandar ao navegador
  (nunca inclui a palavra).

#### `score(guess, answer)` — a regra das cores
Devolve um array de 5 estados: `'correct'` (verde), `'present'` (amarelo) ou `'absent'` (cinza).
Usa **duas passadas** pra tratar letras repetidas corretamente:

1. **1ª passada:** marca de verde toda letra que está na posição certa e "consome" uma
   ocorrência dela numa contagem.
2. **2ª passada:** para as demais, marca de amarelo **só se ainda sobra** aquela letra na contagem.

**Por que duas passadas?** Imagine a resposta `LIVRO` e o palpite `LILAS`.
Só existe **um** `L` na resposta. A 1ª passada já usa esse `L` no verde (posição 1). Então o
segundo `L` do palpite (posição 3) fica **cinza**, e não amarelo. Sem a contagem, o jogo pintaria
os dois de amarelo/verde e enganaria o jogador.

#### `seal` e `open` — o token lacrado
- `seal(state)`: transforma o estado do jogo (`{ w, n, d, mode, date, hints }`) num texto
  cifrado com **AES-256-GCM**. O resultado junta `iv` (12 bytes) + `authTag` (16 bytes) +
  texto cifrado, tudo em `base64url`.
- `open(token)`: faz o caminho inverso e devolve o estado.
- A **chave** vem de `SHA-256(PENTA_SECRET)`.

O GCM dá duas garantias: **confidencialidade** (ninguém lê a palavra dentro do token) e
**autenticidade** (se o token for adulterado, o `open` falha). Ou seja: o cliente não vê nem
falsifica o estado.

Estado guardado no token:

| Campo | Significado |
|---|---|
| `w` | A palavra-resposta (fica só aqui, cifrada). |
| `n` | Quantos palpites já foram feitos. |
| `d` | A dificuldade (`facil`, `normal`...). |
| `mode` | `diario` ou `livre`. |
| `date` | A data (só no diário). |
| `hints` | Quantas dicas já foram usadas. |

#### `dailyWord(dateStr, diff)` — a palavra do dia
Gera um número a partir de `SHA-256(PENTA_SECRET | data | dificuldade)` e usa esse número
para escolher um índice na lista (`% WORDS.length`).

Consequências (todas de propósito):
- **A mesma para todo mundo** naquele dia e nível (é determinística).
- **Muda à meia-noite** (a data muda).
- **Diferente por nível** (a dificuldade entra no cálculo).
- **Imprevisível sem o segredo** (ninguém calcula a palavra de amanhã sem o `PENTA_SECRET`).

`randomWord()` só sorteia uma palavra qualquer (modo Livre).

#### `makeHint(word, type)` — dicas
- `type: 'letra'` → revela uma letra numa posição aleatória.
- `type: 'vogais'` → informa quantas vogais a palavra tem.

Como a palavra está no servidor, a dica é calculada lá e só o resultado vai pro navegador.

### Endpoints da API

Todos são `POST` e trocam JSON.

| Rota | Recebe | Devolve | O que faz |
|---|---|---|---|
| `/api/daily` | `{ difficulty }` | `{ token, config, date }` | Começa o **desafio do dia** no nível pedido. |
| `/api/new` | `{ difficulty }` | `{ token, config }` | Começa um jogo do **modo Livre** (palavra aleatória). |
| `/api/guess` | `{ token, guess }` | `{ result, attempt, won, gameOver, token?, answer? }` | Confere um palpite; devolve as cores. No fim, manda `answer`. |
| `/api/hint` | `{ token, type }` | `{ hint, hintsUsados, dicasMax, token }` | Dá uma dica, se o nível permitir. |

### `PENTA_SECRET`
Uma variável de ambiente que você define ao subir o servidor. Ela tem **dois papéis**:
1. É a base da chave que cifra os tokens.
2. É a semente da palavra do dia.

**Regras:** mantenha em **segredo** e **sempre o mesmo valor**. Se mudar o segredo, todos os tokens
em jogo param de abrir **e** a palavra do dia muda. Gere um bom valor com `openssl rand -base64 32`.
Ele **nunca** vai pro Git — fica só no comando que inicia o app no servidor.

---

## 6. Frontend em detalhe

### `index.html`
Define as **telas** (todas existem no HTML; o JS mostra uma por vez trocando a classe `active`):
- `#home` — tela inicial (jogar, nível, modo livre, estatísticas).
- `#howto` — "Como jogar" (exemplo colorido + regras).
- `#settings` — configurações (nome, nível, dicas, **tema**).
- `#game` — o tabuleiro + teclado.
- `#overlay` — o cartão de resultado (fim de jogo).

### `style.css`
O coração visual é o **sistema de variáveis CSS**. No topo, em `:root`, ficam cores como
`--accent`, `--bg-1`, `--surface`, `--correct` etc. Todo o resto do CSS usa essas variáveis.
Trocar de tema = trocar os **valores** dessas variáveis (o `app.js` faz isso). Por isso a troca
de tema é instantânea e afeta o app inteiro.

Também usa variáveis para o teclado (`--key-bg`...) e para o brilho de fundo (`--glow-1/2`),
justamente pra que os temas mudem esses elementos junto.

### `app.js`
Organizado em blocos (comentados no próprio arquivo):

- **Helpers de armazenamento:** `load(k, def)` / `save(k, v)` — leem/gravam no `localStorage`
  (com um "plano B" em memória caso o navegador bloqueie).
- **TEMAS:**
  - `mix(cor1, cor2, t)`, `rgba(cor, alpha)` — matemática de cor (misturam tons).
  - `genTheme(accent, base, neutral)` — **gera** uma paleta inteira a partir de uma cor de
    destaque e de uma base (escura/clara). É o que alimenta os temas e o "Personalizar".
  - `AMETISTA` — o tema padrão, com valores fixos (idênticos ao original).
  - `THEMES` / `THEME_ORDER` — a lista de temas e a ordem que aparecem.
  - `applyTheme(key)` — escreve as variáveis CSS no documento (aplica o tema).
  - `renderThemes()` / `syncCustom()` — desenham a grade de temas e os controles de personalização.
- **NIVEIS / ORDEM:** dados só de exibição dos níveis (nome, cor, descrição) — as **regras**
  de verdade vêm do servidor (`config`).
- **Estado `S`:** um objeto que guarda tudo da sessão atual (tema, nível, partida em andamento,
  linha/coluna, tabuleiro, timer etc.).
- **Navegação:** `show(nome)` troca a tela ativa.
- **Home:** `renderHome()` — atualiza estatísticas, o "pill" de nível e o estado de "já jogou hoje"
  (com contagem regressiva).
- **Configurações:** `renderSettings()` — monta os cartões de nível, o interruptor de dicas e a grade de temas.
- **Fluxo do jogo:**
  - `startGame(mode)` — chama a API, prepara o tabuleiro/teclado, liga o timer (Lendário) etc.
  - `buildBoard()` / `buildKeyboard()` — criam os elementos na tela.
  - `handleKey(k)` — trata digitação (teclado físico e o da tela).
  - `submitRow()` — envia o palpite, **anima a revelação** das peças, colore o teclado e, no
    modo difícil, valida as letras obrigatórias.
  - `hardModeError(g)` — retorna a mensagem se o palpite quebrar a regra do modo difícil.
  - dica (`hintBtn`) — pede dica à API.
  - timer do Lendário (`startRowTimer`/`onTimeout`).
  - `endGame(won, opts)` — calcula pontos, atualiza estatísticas e sequência, salva.
  - `showResult(...)` — monta o cartão de fim de jogo e a contagem regressiva do diário.
  - `fireConfetti()` — a animação de vitória (canvas).

### Chaves salvas no `localStorage`

| Chave | Conteúdo |
|---|---|
| `penta_name` | Nome do jogador (opcional). |
| `penta_diff` | Nível escolhido. |
| `penta_hints` | Dicas ligadas (true/false). |
| `penta_stats` | `{ vitorias, jogos, sequencia, melhor, pontos }`. |
| `penta_daily` | Por nível: `{ date, won, tries, pts }` (controla "já jogou hoje"). |
| `penta_theme` | Tema atual. |
| `penta_custom` | `{ base, accent }` do tema personalizado. |

> Como isso fica **no navegador**, cada dispositivo tem seus próprios dados. Limpar os dados do
> site (ou o `localStorage`) zera tudo — o que é útil pra testar.

---

## 7. Regras e lógica do jogo

### Cores
- **Verde** (`correct`): letra certa, posição certa.
- **Amarelo** (`present`): a letra existe, em outra posição.
- **Cinza** (`absent`): a letra não está na palavra.
- Letras repetidas são tratadas pela contagem (veja [`score`](#scoreguess-answer--a-regra-das-cores)).

### Níveis (valores atuais em `DIFFS`)

| Nível | Tentativas | Modo hard | Teclado colore | Dicas | Tempo/palpite | Pontos |
|---|---|---|---|---|---|---|
| Fácil | 6 | não | sim | até 3 | — | 0,5× |
| Normal | 6 | não | sim | até 2 | — | 1× |
| Difícil | 5 | sim | sim | 0 | — | 2× |
| Lendário | 4 | sim | **não** | 0 | 60s | 4× |

### Modos
- **Diário:** a palavra do dia (uma por dia, por nível). Conta pra sequência.
- **Livre:** palavras aleatórias, sem limite. Bom pra treinar; não conta pra sequência.

### Pontuação (no `endGame`)
```
restantes = tentativas_do_nível − tentativa_da_vitória
pontos = round( 1000 × (restantes + 1) / (tentativas_do_nível + 1) × mult )
         − dicas_usadas × 100
         + (modo diário ? min(sequência × 20, 200) : 0)
pontos = máx(0, pontos)      // nunca negativo
```
**Exemplo:** Normal (mult 1), venceu na 3ª de 6 tentativas, sem dicas, sequência 2 (diário):
`restantes = 3` → `1000 × 4/7 = 571` → `× 1 = 571` → `+ 40` (bônus de sequência) = **611 pontos**.
No Lendário (mult 4), vencer cedo rende muito mais.

### Dicas
Só aparecem se estiverem ligadas **e** o nível permitir. Cada dica revela pouca coisa (uma letra
ou o número de vogais). Existe um limite por nível. *(O limite hoje é "leve" — quando houver contas
no servidor, dá pra travar de forma rígida. Veja a [seção 16](#16-segurança).)*

### Sequência (streak)
Só o modo diário mexe na sequência: vitória soma 1; derrota zera. O recorde fica em `melhor`.

---

## 8. Como fazer alterações comuns

> Regra de ouro: **mude uma coisa, salve, teste, repita.** Alterações no `public/` (site) aparecem
> só **atualizando a página**. Alterações no servidor (`server.js`, `lib/game.js`) exigem **reiniciar**
> o Node (local: Ctrl+C e rodar de novo; no VPS: `pm2 restart penta`).

**Adicionar ou trocar palavras** — as listas estão em `lib/palavras.js` (`RESPOSTAS` e `VALIDAS`).
Para incluir/remover uma **resposta**, edite a string `_RESP`; para aceitar/recusar um **palpite**, edite `_VAL`.
Use 5 letras, MAIÚSCULAS e **sem acento** (ex.: `ACAO`, não `AÇÃO`). As listas foram geradas do corpus
fserb/pt-br; dá pra regenerar com mais/menos palavras ajustando o corte de frequência (ICF).
O inglês fica em `lib/palavras-en.js` (mesmo formato: `_RESP` e `_VAL`). O jogador escolhe o idioma em
**Configurações → Idioma**; cada idioma tem sua própria palavra do dia (a interface também é traduzida).

**Mudar a dificuldade** — em `lib/game.js`, edite o objeto `DIFFS` (tentativas, tempo, multiplicador etc.).

**Mudar a fórmula de pontos** — em `public/app.js`, função `endGame` (o bloco que calcula `pts`).

**Adicionar um tema novo** — em `public/app.js`:
1. adicione uma entrada em `THEMES` (ex.: `verdejade: { nome: 'Verde Jade', vars: genTheme('#10b981') }`);
2. inclua a chave em `THEME_ORDER`.
   Para um tema totalmente à mão, passe um objeto de variáveis no lugar de `genTheme(...)`
   (use `AMETISTA` como modelo).

**Trocar o tema padrão** — em `public/app.js`, no `init`, mude o padrão em
`load('penta_theme', 'ametista')` para a chave que quiser.

**Trocar as cores das peças (verde/amarelo)** — em `public/app.js`, no objeto `SEMANTIC`
(afeta todos os temas). *Cuidado:* manter verde/amarelo padronizados ajuda quem tem daltonismo.

**Adicionar um tipo de dica** — em `lib/game.js`, função `makeHint` (crie o novo `type`), e no
`public/app.js`, no botão de dica, decida quando pedir esse tipo.

**Atenção — o "5" está embutido em vários lugares** (tabuleiro, validação `^[A-Z]{5}$`, animações).
Mudar o tamanho da palavra é possível, mas exige trocar em vários pontos coordenadamente.

Depois de qualquer mudança, para publicar: veja a [seção 12](#12-atualizando-o-que-já-está-no-ar).

---

## 9. Montando o ambiente de desenvolvimento

### Passo 1 — Instalar o Node.js
Precisa da versão **LTS** (18 ou superior). Confira se já tem:
```bash
node -v
npm -v
```
Se não tiver:
- **Recomendado (Linux/macOS):** instale via **nvm** (permite ter várias versões).
  Site: <https://github.com/nvm-sh/nvm>. Depois: `nvm install --lts`.
- **Windows:** use o instalador oficial em <https://nodejs.org> ou o **nvm-windows**
  (<https://github.com/coreybutler/nvm-windows>).

### Passo 2 — Um editor de código
**VS Code** (<https://code.visualstudio.com>) é o mais comum e gratuito. Extensões úteis:
- **ESLint** (aponta erros de JavaScript enquanto você digita).
- **Prettier** (formata o código automaticamente).

### Passo 3 — Rodar o projeto localmente
Dentro da pasta `penta-app` (não precisa `npm install` — projeto sem dependências):

- **Linux/macOS:**
  ```bash
  PENTA_SECRET="teste123" npm start
  ```
- **Windows (PowerShell):**
  ```powershell
  $env:PENTA_SECRET="teste123"; npm start
  ```
- **Windows (CMD):**
  ```cmd
  set PENTA_SECRET=teste123&& npm start
  ```
Abra <http://localhost:3000>. Para parar: **Ctrl + C**.

### Passo 4 — O fluxo do dia a dia
- Editou algo em `public/` (site)? **Atualize a página** (F5).
- Editou `server.js` ou `lib/game.js` (servidor)? **Pare e rode de novo**.
  - *Dica:* `node --watch server.js` reinicia sozinho quando você salva.

### Passo 5 — As Ferramentas do Desenvolvedor do navegador (F12)
Seu melhor amigo pra depurar:
- **Console:** mostra erros (com arquivo e linha!) e o que você imprimir com `console.log(...)`.
- **Network (Rede):** veja as chamadas `/api/...` acontecendo, o que foi enviado e recebido.
- **Application → Local Storage:** veja/edite/limpe os dados salvos (`penta_stats`, `penta_theme`...).

### Passo 6 — Controle de versão (Git)
Já usamos o Git pra publicar. Fluxo básico:
```bash
git add .
git commit -m "descricao da mudanca"
git push
```
Site: <https://git-scm.com>.

---

## 10. Publicação no VPS (deploy)

Esta seção é o **passo a passo real** que usamos, com os comandos exatos. Serve tanto para
reproduzir do zero quanto para lembrar como o ambiente está montado.

### O nosso cenário (para referência)

| Item | Valor |
|---|---|
| Domínio | `geologiadoceara.cloud` |
| Endereço do jogo | `https://penta.geologiadoceara.cloud` (subdomínio) |
| Servidor | VPS Ubuntu, com **nginx já rodando** outros sites |
| Código | GitHub, repositório **público**: `github.com/mauriciollsilva/penta` |
| Pasta no VPS | `~/projetos/penta` |
| Porta interna do app | **3010** (a 3000 já estava ocupada por outro projeto) |
| Processo | gerenciado pelo **PM2** |
| HTTPS | **certbot** (Let's Encrypt) |

> Fluxo geral: **sua máquina → GitHub → VPS**. O código sobe pro GitHub e o VPS baixa de lá.
> O segredo (`PENTA_SECRET`) **nunca** vai pro GitHub — ele só existe no comando que liga o app no servidor.

### Pré-requisitos no VPS
```bash
node -v            # precisa 18+
nginx -v           # nginx instalado
git --version      # se faltar: sudo apt install -y git
```

### Passo 1 — Apontar o subdomínio (DNS)
No painel do seu domínio, crie um registro **A**:
```
penta   →   IP_PÚBLICO_DO_SEU_VPS
```
Para descobrir o IP do VPS (rode no VPS):
```bash
curl -4 ifconfig.me
```
Depois, confirme que o nome já resolve para esse IP (pode levar alguns minutos):
```bash
dig +short penta.geologiadoceara.cloud
# ou, se não tiver o dig:
nslookup penta.geologiadoceara.cloud
```
O IP que aparecer tem que ser o mesmo do `curl`.

### Passo 2 — Subir o código pro GitHub (na SUA máquina)
Dentro da pasta do projeto (a que tem `server.js`, `lib/`, `public/`):
```bash
printf "node_modules/\n*.log\n.env\n" > .gitignore
git init
git add .
git commit -m "PENTA - versao inicial"
```
Crie o repositório e envie. Com o **GitHub CLI** (`gh`), é um comando só:
```bash
gh auth login      # só na primeira vez (autentica pelo navegador)
gh repo create penta --public --source=. --push
```
Sem o `gh`: crie o repositório no site (New repository → nome `penta` → Public) e depois:
```bash
git remote add origin https://github.com/SEU-USUARIO/penta.git
git branch -M main
git push -u origin main
```

### Passo 3 — Baixar o código no VPS
Na sua pasta de projetos (no nosso caso `~/projetos`):
```bash
cd ~/projetos
git clone https://github.com/mauriciollsilva/penta.git penta
cd penta
ls    # deve mostrar server.js, package.json, lib, public
```

### Passo 4 — Escolher uma porta livre
Como o nginx já servia outros projetos, a porta 3000 estava ocupada. Verifique:
```bash
sudo ss -ltnp | grep :3000 || echo "porta 3000 livre"
sudo ss -ltnp | grep :3010 || echo "porta 3010 livre"
```
Usamos a **3010** (livre). Essa porta é **só interna** (localhost) — quem fala com a internet é o nginx.

### Passo 5 — Ligar o app com o PM2
```bash
npm install -g pm2

# gera o segredo (COPIE o valor; guarde seguro; NÃO vai pro Git):
openssl rand -base64 32

# inicia o app na porta 3010 (troque COLE_O_SEGREDO):
PENTA_SECRET="COLE_O_SEGREDO" PORT=3010 pm2 start server.js --name penta
pm2 save

# faz o app voltar sozinho se o servidor reiniciar:
pm2 startup
# ^ o comando acima IMPRIME uma linha começando com "sudo env PATH=...".
#   copie e rode essa linha, e depois:
pm2 save
```
Teste interno:
```bash
curl -I http://localhost:3010     # deve responder HTTP/1.1 200 OK
```

### Passo 6 — nginx (proxy reverso)
Adiciona o PENTA **sem tocar** nos outros sites. Crie o arquivo:
```bash
sudo nano /etc/nginx/sites-available/penta
```
Conteúdo (repare no `127.0.0.1:3010`):
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name penta.geologiadoceara.cloud;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Salvar no nano: **Ctrl+O**, Enter, **Ctrl+X**. Ative e recarregue:
```bash
sudo ln -s /etc/nginx/sites-available/penta /etc/nginx/sites-enabled/
sudo nginx -t                     # tem que dizer "syntax is ok" / "test is successful"
sudo systemctl reload nginx
```
Teste pelo domínio (ainda em HTTP):
```bash
curl -s http://penta.geologiadoceara.cloud | grep -i '<title>'
# esperado: <title>PENTA — descubra a palavra</title>
```
> **Se seus sites ficam em `/etc/nginx/conf.d/`** (em vez de `sites-available`): crie
> `/etc/nginx/conf.d/penta.conf` com o mesmo bloco `server { ... }` e **não** faça o `ln -s`.

### Passo 7 — HTTPS (certbot / Let's Encrypt)
```bash
# se faltar o certbot:
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d penta.geologiadoceara.cloud
```
Durante o processo:
- informe um **e-mail** (avisos de expiração) e aceite os termos;
- quando perguntar sobre **redirecionar HTTP → HTTPS**, escolha **2 (Redirect)**.

Confirme e teste:
```bash
sudo certbot certificates                                   # deve listar penta... VALID
curl -sI https://penta.geologiadoceara.cloud | head -n 1     # HTTP/... 200
curl -s  https://penta.geologiadoceara.cloud | grep -i '<title>'
```
Pronto: **https://penta.geologiadoceara.cloud** no ar, com cadeado. O certificado **renova sozinho**.

---

## 11. Solução de problemas (troubleshooting)

**A porta escolhida já está em uso** (`ss` mostra algo na porta) → escolha outra (3010, 3011, 3012…)
e ajuste nos **dois** lugares: no comando do PM2 (`PORT=...`) e no `proxy_pass` do nginx. Depois
`pm2 restart penta` e `sudo systemctl reload nginx`.

**`https://` abre o site errado / aparece "Não seguro"** — foi o que aconteceu com a gente.
Duas causas possíveis:
1. **O certificado do subdomínio ainda não foi emitido.** Enquanto não roda o `certbot` para o
   subdomínio, o HTTPS cai em outra config. Solução: rodar o Passo 7.
2. **Cache do navegador.** Depois de emitir o certificado, o navegador pode ter guardado a versão
   antiga. Solução: abra em **janela anônima** e/ou recarregue com **Ctrl+Shift+R**.

Para saber se o problema é do servidor ou do navegador:
```bash
sudo certbot certificates                                   # existe cert VALID pro penta?
curl -sI https://penta.geologiadoceara.cloud | head -n 1     # o curl recusaria cert inválido
```
Se o `curl` retorna `200`, o servidor está OK e o "cortado" é cache do navegador.

**O domínio não resolve (ou resolve pro IP errado)** → confira o registro **A** no painel do DNS,
espere a propagação e teste com `dig +short penta.geologiadoceara.cloud`.

**`certbot: command not found`** → `sudo apt install -y certbot python3-certbot-nginx`.

**`nginx -t` falhou** → **não** recarregue; leia a mensagem (ela aponta o arquivo e a linha do erro),
corrija e rode `nginx -t` de novo.

**O app não responde no `curl http://localhost:PORTA`** →
```bash
pm2 status            # o "penta" está "online"?
pm2 logs penta        # veja o erro em tempo real (Ctrl+C pra sair)
```
Causa comum: faltou o `PENTA_SECRET` (o app derruba na hora com erro claro) ou a porta está diferente.

**O app não volta depois de reiniciar o VPS** → você rodou o `pm2 startup` (a linha que ele mandou)
e depois `pm2 save`? Sem isso, o PM2 não sobe no boot.

### Comandos úteis do PM2 (dia a dia)
```bash
pm2 status            # lista os apps e o estado
pm2 logs penta        # logs ao vivo
pm2 logs penta --lines 100   # últimas 100 linhas
pm2 restart penta     # reinicia (use após atualizar o código)
pm2 stop penta        # para
pm2 start penta       # inicia de novo
pm2 delete penta      # remove do PM2
```

---

## 12. Atualizando o que já está no ar

Depois que o projeto está publicado, atualizar é rápido — **sem** mexer em nginx nem certificado.

**1) Na sua máquina** (dentro de `~/Documentos/dev/penta-app`), após editar o código:
```bash
git add .
git commit -m "descricao da mudanca"
git push
```

**2) No VPS** (dentro de `~/projetos/penta`):
```bash
git pull
pm2 restart penta
```

- Se você mudou **só documentação** (nada de código que roda), o `git pull` já basta — não precisa
  reiniciar (mas reiniciar não faz mal).
- Se mudou algo em `public/` e não aparece no navegador, force o recarregamento com **Ctrl+Shift+R**.

---

## 13. Ligar, desligar e reiniciar quando quiser

Quem controla se o app está no ar é o **PM2**. Rode no VPS (funciona de qualquer pasta).

**Derrubar (tirar do ar) na hora:**
```bash
pm2 stop penta
```
O app para na mesma hora. Quem acessar o site vê um erro **502 Bad Gateway** do nginx — porque o
nginx continua de pé, mas não há mais o Node atrás dele pra responder. É esperado.

**Subir (colocar no ar) na hora:**
```bash
pm2 start penta
```
Volta imediatamente, na mesma porta (3010) e com o mesmo segredo — o PM2 lembra a configuração.

**Ver o estado:**
```bash
pm2 status      # "online" = no ar | "stopped" = derrubado
```

**Reiniciar** (derruba e sobe de uma vez — use após atualizar o código):
```bash
pm2 restart penta
```

**Remover do PM2** (não só parar — apaga o registro):
```bash
pm2 delete penta
```
Depois de um `delete`, pra subir de novo é preciso o comando completo (com o segredo), porque ele
deixou de estar registrado:
```bash
PENTA_SECRET="SEU_SEGREDO" PORT=3010 pm2 start server.js --name penta
```

### Dois avisos importantes
1. **`pm2 save` memoriza o estado atual.** Se você **parar** o app e rodar `pm2 save`, o PM2 vai
   lembrar que ele deve ficar **parado** no próximo reboot do servidor. Regra prática: só rode
   `pm2 save` quando o estado atual (ligado/desligado) for o que você quer que volte após reiniciar.
2. Se o `pm2 start penta` reclamar que **não existe** o processo `penta` (ex.: depois de um
   `delete`), use o comando completo com o segredo (o de cima).

> Opcional: dá pra mostrar uma página de "jogo em manutenção" no lugar do erro 502 quando o app
> está parado — mas isso envolve um ajuste no nginx e não é necessário pro funcionamento.

---

## 14. Sites de referência e bibliotecas

**Este projeto não usa nenhuma biblioteca externa** (nem no back, nem no front). O que você vai
querer por perto são as **documentações de referência**:

- **MDN Web Docs** — <https://developer.mozilla.org> — a referência nº 1 de JavaScript, DOM e CSS.
- **Node.js** — <https://nodejs.org/docs> — documentação dos módulos nativos (`http`, `crypto`...).
- **Google Fonts** — <https://fonts.google.com> — as fontes usadas.
- **Can I use** — <https://caniuse.com> — checar suporte de um recurso nos navegadores.

**Ferramentas de deploy** (documentação):
- **PM2** — <https://pm2.keymetrics.io> — mantém o app rodando.
- **nginx** — <https://nginx.org/en/docs/> — proxy reverso / servidor web.
- **Let's Encrypt / certbot** — <https://certbot.eff.org> — HTTPS gratuito.
- **Git** — <https://git-scm.com/doc> · **GitHub CLI** — <https://cli.github.com>.

**Para o futuro (Fase 2 — login/ranking):** aí sim entram bibliotecas, buscadas no **npm**
(<https://www.npmjs.com>). Prováveis:
- Banco de dados: **`better-sqlite3`** (<https://www.npmjs.com/package/better-sqlite3>) ou o
  SQLite nativo do Node (`node:sqlite`).
- Senhas: **`bcryptjs`** (<https://www.npmjs.com/package/bcryptjs>).
Instalação, quando for a hora: `npm install nome-da-biblioteca`.

**Para aprender (iniciante):**
- **MDN Learn** — <https://developer.mozilla.org/pt-BR/docs/Learn>
- **JavaScript.info** — <https://javascript.info>
- **freeCodeCamp** — <https://www.freecodecamp.org>

---

## 15. Dicas para desenvolvedor iniciante

- **Leia a mensagem de erro.** O Console (e o `pm2 logs`) quase sempre dizem o arquivo e a linha.
- **Uma mudança por vez.** Alterou, testou, funcionou? Próxima. Assim você sabe o que quebrou.
- **`console.log()` é seu raio-x.** Não sabe o valor de algo? `console.log('valor:', x)` e olhe no Console.
- **O front é instantâneo, o back precisa reiniciar.** Guarde isso — evita confusão de "por que não mudou?".
- **Variáveis CSS economizam tempo.** Mude uma cor em um lugar e ela muda no app inteiro.
- **Nunca coloque segredos no `public/` nem no Git.** Palavra e `PENTA_SECRET` ficam no servidor.
- **Git é seu ponto de retorno.** Commit antes de mexer bastante; se algo der errado, você volta.
- **Os comentários no código são um mapa.** Cada bloco tem uma linha explicando o que faz.
- **Limpar o `localStorage` reseta o jogo** (estatísticas, tema). Ótimo pra testar do zero.
- **Quando travar:** isole o trecho, copie o **texto exato** do erro e pesquise (MDN, Stack Overflow).

---

## 16. Segurança

O que já está protegido nesta versão:
- **A palavra fica no servidor.** O navegador só recebe cores; inspecionar a página não revela a resposta.
- **Token cifrado e autenticado (AES-256-GCM).** Não dá pra ler nem falsificar o estado do jogo.
- **Proteção contra path traversal** ao servir arquivos.
- **`PENTA_SECRET`** guarda a chave e a semente da palavra do dia; não vai pro Git.
- **HTTPS** ativo (certbot), com redirecionamento de HTTP para HTTPS.

Ponto a evoluir:
- O **limite de dicas/tentativas** hoje é aplicado no cliente e via token (é "leve"). Como o servidor
  não guarda estado por jogo, um usuário insistente conseguiria contornar. Isso vira **rígido** na
  Fase 2, quando houver banco de dados e contas (o servidor passa a lembrar cada partida).

---

## 17. Limitações atuais e próximos passos

**Hoje (Fase 1):**
- É um jogo **single-player** completo. Nome, sequência e pontos ficam **no navegador** (não há login).
- Dicionário do corpus fserb/pt-br: ~1.290 respostas comuns e ~8.400 palpites válidos aceitos (palpite fora da lista é recusado).
- **Bilíngue (PT/EN):** o jogador escolhe o idioma em Configurações; cada idioma tem lista e palavra do dia próprias, e a interface toda é traduzida.
- Níveis diferem pelas **regras** (não por raridade de palavra).

**Fase 2 (planejada) — login + ranking:**
- Adicionar um **banco de dados** no servidor (ex.: SQLite) e **contas** (usuário + senha, com a
  senha guardada em hash — nunca em texto puro).
- Guardar pontuação no servidor e montar **placares** (diário/semanal/geral).
- Só o **desafio diário** conta pro ranking sério (todos com a mesma palavra = justo).
- Aí entram as bibliotecas da [seção 14](#14-sites-de-referência-e-bibliotecas).

**Ideias extras:** dicionário maior (o do Termo é de licença MIT), compartilhar resultado em emoji
(🟩🟨⬛), sons, e modos com 2/4 palavras ao mesmo tempo.

---

## 18. Glossário

- **API** — o "balcão" do servidor: endereços (`/api/...`) que recebem pedidos e devolvem dados.
- **Endpoint** — cada endereço específico da API (ex.: `/api/guess`).
- **Token** — aqui, o "envelope lacrado" (cifrado) que carrega o estado do jogo entre navegador e servidor.
- **Hash** — uma função que transforma um texto em um código fixo e imprevisível (usamos SHA-256).
- **AES-256-GCM** — método de criptografia que esconde o conteúdo **e** detecta adulteração.
- **`localStorage`** — "gavetinha" do navegador pra guardar dados no dispositivo do usuário.
- **Variável CSS** — um valor de cor/estilo reutilizável (ex.: `--accent`), base do sistema de temas.
- **ES Module** — o formato moderno de JavaScript com `import`/`export` (ligado por `"type": "module"`).
- **Proxy reverso (nginx)** — um "porteiro" na frente do seu app: recebe as visitas e repassa pro Node.
- **PM2** — programa que mantém o Node rodando (reinicia se cair, sobe no boot).
- **certbot / Let's Encrypt** — emite e renova o certificado HTTPS de graça.
- **Porta** — o "número da porta" onde um programa escuta (o PENTA escuta na 3010, interna).
- **DNS / registro A** — o que liga um nome (subdomínio) a um endereço IP.
- **Path traversal** — tentativa de acessar arquivos fora da pasta permitida; o servidor bloqueia isso.

---

*Documento gerado para o projeto PENTA — Fase 1. No ar em https://penta.geologiadoceara.cloud.*
