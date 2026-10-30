# Un solo contenedor: el motor sirve la API y la pantalla compilada. Contexto: la raíz del repositorio.
FROM node:24-slim AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/index.html web/tsconfig.json web/vite.config.ts ./
COPY web/src ./src
RUN npm run build

FROM node:24-slim AS engine
WORKDIR /engine
COPY engine/package.json engine/package-lock.json ./
RUN npm ci
COPY engine/tsconfig.json engine/tsconfig.build.json ./
COPY engine/src ./src
RUN npm run build

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app/engine
COPY --from=engine /engine/dist ./dist
COPY engine/fixtures ./fixtures
COPY engine/package.json ./
COPY --from=web /web/dist /app/web/dist
USER node
EXPOSE 8080
CMD ["node", "dist/main.js"]
