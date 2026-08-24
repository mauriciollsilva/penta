# Plataforma de Geologia do Ceará

Site de divulgação científica sobre a geologia do Ceará, construído com [Next.js](https://nextjs.org) e Tailwind CSS. Funciona como PWA (offline) e pode ser instalado no celular.

## 📖 Manuais

- **[docs/MANUAL-EDICAO.md](docs/MANUAL-EDICAO.md)** — para quem edita o conteúdo: como usar o painel `/admin` para alterar títulos, textos, tese, livro e pontos do mapa sem programar
- **[docs/MANUAL-ADMINISTRACAO.md](docs/MANUAL-ADMINISTRACAO.md)** — para o administrador: como o site funciona, publicação na Vercel, conexão de domínio próprio, importação de planilhas e solução de problemas

## ✏️ Painel de edição e Área de Colaboração (/admin)

Todo o conteúdo textual do site mora em `app/data/conteudo.json` e `app/data/pontos.json`. O painel em `/admin` conta com:

- **Autenticação por Sessão:** Tela de acesso protegida por usuário e senha (`admin` / `Geologia2026@`) armazenada em `sessionStorage` com botão de logout seguro.
- **Edição Sem Código:** Formulários com rótulos amigáveis para todos os blocos do site.
- **Publicação Direta:** Gravação dos arquivos JSON diretamente no repositório GitHub via API, disparando o build e publicação automáticos sem requerer servidor dedicado ou banco de dados.

## Seções

- **Navegação & Acesso Rápido** (`app/page.js`) — menu responsivo com link direto para a rota de colaboração protegida (`🔒 Colaboração`).
- **Hero e apresentação** — a pesquisa, a pesquisadora e os três pilares do projeto[cite: 1].
- **Mapa interativo** (`app/components/Mapa.js`, `app/components/MapaWrapper.js`) — pontos georreferenciados com painel de detalhes (coordenadas em decimal e GMS, litologia, fotos de campo, diário), **camada geológica esquemática** com legenda, **rotas de geoturismo** com download de trilha GPX e modo tela cheia[cite: 1].
- **Linha do Tempo** (`app/components/LinhaDoTempo.js`) — 4,5 bilhões de anos em cartões interativos, com o Ceará em cada época[cite: 1].
- **A Tese** (`app/components/Tese.js`) — capítulos do doutorado em accordions, com linguagem acessível e nota técnica[cite: 1].
- **O Livro** (`app/components/Livro.js`) — o livro infantil premiado *O Mapa do Tesouro*[cite: 1].
- **Coleção de Rochas & Minerais** (`app/components/Glossario.js`) — glossário ilustrado com busca e filtros por tipo[cite: 1].
- **Área de Jogos** (`app/components/GibiAventura.js`) — **gibis interativos para crianças** com narração em áudio (Web Speech API) e certificado em PNG para baixar[cite: 1]:
  - **Nº 1 · O Segredo das Pedras do Ceará** — 5 capítulos (Quixadá, Araripe, Ubajara, camadas do tempo, dunas)[cite: 1]
  - **Nº 2 · O Mistério da Água do Sertão** — 3 capítulos sobre aquíferos e água no semiárido[cite: 1]
- **Modo Professor** (`/professor`) — planos de aula e 3 atividades imprimíveis (caça-palavras, ligue as colunas, Escada do Tempo)[cite: 1].
- **Seja um Apoiador & Rodapé Integrado** (`app/components/FooterApoiador.js`) — formulário assíncrono para captação de parcerias institucionais, escolares e patrocínios (via Web3Forms) integrado ao rodapé do site.

## Importar seus pontos de uma planilha

Exporte a planilha como CSV (separado por `;` ou `,`) com as colunas[cite: 1]
`nome;municipio;lat;lng;altitude;categoria;litologia;data;descricao;diario`[cite: 1]
(somente `nome`, `lat` e `lng` são obrigatórias) e rode[cite: 1]:

```bash
node scripts/importar-pontos.mjs caminho/para/planilha.csv