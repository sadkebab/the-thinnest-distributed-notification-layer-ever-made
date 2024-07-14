FROM node:22-alpine 

WORKDIR /app

# COPY package.json .
# COPY pnpm-lock.yaml .
# COPY src ./src
# COPY tsconfig.json .

# RUN npm install -g pnpm
# RUN pnpm install --frozen-lockfile

# RUN pnpm build

# I had to copy the dist folder because the previous process failed with pnpm workspaces
COPY dist ./dist

ENV NODE_ENV=production
ENV PORT=44443
ENV HOST=0.0.0.0

EXPOSE 44443

CMD ["node", "dist/index.cjs"]