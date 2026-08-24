# PENTA — Fase 1 (jogo single-player)

Jogo de palavras estilo Termo, com modo **Diário** (palavra do dia, igual pra todos) e **Livre**,
4 níveis (Fácil, Normal, Difícil, Lendário), dicas e contagem regressiva.
A palavra fica **no servidor** — o navegador só recebe as cores.

> Login + ranking entram na Fase 2 (por enquanto nome/sequência/pontos ficam salvos no navegador).

## Estrutura
```
penta/
├── server.js            # servidor Node (sem dependências): serve o site + API
├── lib/game.js          # palavras, regras, cifra, palavra do dia, dicas
├── public/              # frontend (nginx pode servir direto, se preferir)
│   ├── index.html
│   ├── style.css
│   └── app.js
└── package.json
```

## Requisitos
- Node.js 18 ou superior (`node -v`)

## Rodar localmente
```bash
cd penta
PENTA_SECRET="qualquer-segredo-aqui" npm start
# abre em http://localhost:3000
```

## Publicar no seu VPS

**1. Enviar os arquivos** (da sua máquina):
```bash
scp -r penta usuario@SEU_VPS:/caminho/dos/projetos/penta
```

**2. Gerar o segredo e subir com PM2** (no servidor):
```bash
cd /caminho/dos/projetos/penta
openssl rand -base64 32          # copie o valor
# sobe o processo já com o segredo e a porta:
PENTA_SECRET="COLE_O_SEGREDO" PORT=3000 pm2 start server.js --name penta
pm2 save                          # mantém rodando após reboot (rode 'pm2 startup' uma vez)
```
> O `PENTA_SECRET` também define a palavra do dia — mantenha o mesmo valor sempre, senão a palavra do dia muda.

**3. nginx — novo subdomínio** (ex.: `jogo.seudominio.com`, apontando A para o IP do VPS).
Crie um server block (sem `default_server`, pra não afetar as apps atuais):
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name jogo.seudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d jogo.seudominio.com
```
Pronto: `https://jogo.seudominio.com`.

**Atualizar depois:** substitua os arquivos e rode `pm2 restart penta`.

### Opcional (mais performático)
Deixe o nginx servir os estáticos direto da pasta `public/` e só encaminhe `/api` pro Node:
```nginx
    root /caminho/dos/projetos/penta/public;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location /api/ { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; }
```

## Observações desta fase
- **Nome, sequência e pontos** ficam no navegador (localStorage). O ranking real (com login e placar no servidor) vem na Fase 2.
- **Dicionário**: ~250 palavras comuns. Dá pra plugar um léxico maior (o do Termo é MIT) depois.
- **Níveis** hoje diferem pelas *regras* (tentativas, modo hard, teclado, tempo). Palavras raras por nível entram junto com o dicionário maior.
