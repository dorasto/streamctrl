# Use Node.js 22 as the base image
FROM node:23-alpine

# Set the working directory to /app
WORKDIR /app

# Copy package.json and pnpm-lock.yaml from the root to install dependencies
COPY ./package.json ./

# Install pnpm with specific version and install dependencies
RUN corepack enable pnpm
RUN pnpm approve-builds -g
RUN pnpm install --prod 

# Copy the backend source code into the container
COPY ./ ./

# Build the TypeScript code for the backend
RUN pnpm build

# Set the production environment
ENV NODE_ENV=production

# Expose the application port (4000 for Fastify)
EXPOSE 4000

# Start the backend Fastify application
CMD ["pnpm", "start"]