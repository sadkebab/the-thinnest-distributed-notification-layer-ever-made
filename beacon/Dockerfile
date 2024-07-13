FROM node:22-alpine 

WORKDIR /app

COPY package.json .
COPY pnpm-lock.yaml .
COPY src ./src
COPY tsconfig.json .

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

RUN pnpm build
ENV NODE_ENV=production
ENV PORT=44401
ENV HOST=0.0.0.0

EXPOSE 44401

CMD ["pnpm", "serve"]