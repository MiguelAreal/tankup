# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# 1. Declara as variáveis de ambiente
ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_OUTRA_CHAVE

# 2. Torna-as disponíveis para o comando 'npm run'
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
# -----------------------------

COPY package*.json ./
RUN npm install

COPY . .

# O Expo vai ler as variáveis ENV acima
RUN npx expo export -p web

# Stage 2: Serve
FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]