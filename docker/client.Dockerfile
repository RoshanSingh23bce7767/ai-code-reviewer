FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=http://localhost:5000/api/v1
ARG VITE_APP_NAME="AI Code Reviewer"
ARG VITE_AI_MODEL=gemini-2.5-flash-lite
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_AI_MODEL=$VITE_AI_MODEL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
