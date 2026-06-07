FROM node:20-alpine

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install packages
RUN npm install

# Copy application files
COPY . .

# Run development server
CMD ["npm", "run", "dev"]
