FROM nginx:latest

# Remove the default Nginx configuration file
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom Nginx configuration file into the container
# Ensure your local path './nginx/nginx.conf' is correct relative to the build context
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

# Optional: If your React app's static files are part of this Nginx image (less common for React apps)
# This path needs to be where your 'react-router build' outputs the static files relative to this Dockerfile's context
# COPY ./build/client /usr/share/nginx/html

# Expose the port Nginx is configured to listen on
EXPOSE 80
# EXPOSE 443 # If using HTTPS

# Command to run Nginx (default command for Nginx image is usually sufficient)
CMD ["nginx", "-g", "daemon off;"]