# Use the Bun image as the base image
FROM oven/bun:latest

# Set the working directory in the container
WORKDIR /app

# Copy package.json and bun.lockb first to leverage Docker cache
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the application files
COPY . .

# Run the build command
# This will likely create the 'dist' folder for your Hono application
RUN bun run build

# Set the production environment
ENV NODE_ENV=production

# Expose the application port (Hono often defaults to 3000, but 4000 is fine if configured)
EXPOSE 4000

# Start the Hono application from the 'dist' folder
CMD ["bun", "dist/index.js"]