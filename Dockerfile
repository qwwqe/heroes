FROM node:18.16.0-alpine
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm i
COPY . .
RUN pnpm build
EXPOSE 8080
CMD [ "node", "./dist/server.js" ]