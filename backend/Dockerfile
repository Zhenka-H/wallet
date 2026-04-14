FROM node:22.19-bullseye-slim AS builder

# Define ARG variables (build-time variables)
ARG NODE_ENV

ARG PG_USERNAME
ARG PG_PASSWORD
ARG PG_PORT
ARG PG_DATABASE_HOST
ARG PG_DATABASE

ARG PORT

# Set ENV variables (runtime variables)
ENV NODE_ENV=${NODE_ENV}

ENV PG_USERNAME=${PG_USERNAME}
ENV PG_PASSWORD=${PG_PASSWORD}
ENV PG_PORT=${PG_PORT}
ENV PG_DATABASE_HOST=${PG_DATABASE_HOST}
ENV PG_DATABASE=${PG_DATABASE}

ENV PORT=${PORT}


# Set the working directory in the container
WORKDIR /app

COPY . .

# Install dependencies and Git
RUN apt-get update && apt-get install -y git

# Clear npm cache (optional)
# RUN npm cache clean --force


# Install dependencies and build the project
RUN npm install && npm run build


FROM node:22-bullseye-slim AS deploy

# Install ffmpeg
# RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*


ARG NODE_ENV

ARG PG_USERNAME
ARG PG_PASSWORD
ARG PG_PORT
ARG PG_DATABASE_HOST
ARG PG_DATABASE

ARG PORT



# Set environment variables for the deploy stage
ENV NODE_ENV=${NODE_ENV}

ENV PG_USERNAME=${PG_USERNAME}
ENV PG_PASSWORD=${PG_PASSWORD}
ENV PG_PORT=${PG_PORT}
ENV PG_DATABASE_HOST=${PG_DATABASE_HOST}
ENV PG_DATABASE=${PG_DATABASE}

ENV PORT=${PORT}

WORKDIR /app


COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./


EXPOSE ${PORT}

# Command to run the NestJS application
CMD ["node", "dist/src/main"]