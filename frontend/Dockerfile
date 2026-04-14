FROM node:22 as builder

ARG NEXT_PUBLIC_WALLET_API_URL
ARG PORT

ENV NEXT_PUBLIC_WALLET_API_URL=${NEXT_PUBLIC_WALLET_API_URL}
ENV PORT=${PORT}

WORKDIR /app
RUN apt-get update && apt-get install -y git

COPY package.json package-lock.json ./


RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/build /usr/share/nginx/html
RUN ["chmod", "+x", "/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]