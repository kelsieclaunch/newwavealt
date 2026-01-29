
# FROM node:20-alpine AS builder
# WORKDIR /app

# COPY package*.json ./
# RUN npm install --production

# COPY . .

# FROM nginx:alpine
# COPY --from=builder /app /usr/share/nginx/html

# COPY nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE 8080

# CMD ["nginx", "-g", "daemon off;"]


FROM node:20

WORKDIR /usr/src/app


COPY package*.json ./

RUN npm install --production

COPY server.js ./
COPY public ./public


ENV PORT=8080
EXPOSE 8080


CMD ["node", "server.js"]
