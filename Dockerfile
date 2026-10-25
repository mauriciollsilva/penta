# Penta (jogo estilo Wordle): Node puro (só stdlib + ./lib), SEM dependências.
FROM node:20-alpine
WORKDIR /app
COPY . .
ENV PORT=3010
EXPOSE 3010
CMD ["node", "server.js"]
