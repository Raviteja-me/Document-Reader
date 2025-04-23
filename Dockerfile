FROM --platform=linux/amd64 node:18-slim

WORKDIR /app

# Install antiword and other dependencies needed by textract
RUN apt-get update && apt-get install -y \
    antiword \
    poppler-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . ./

# Remove if exists and create new uploads directory
RUN rm -rf uploads && mkdir uploads

EXPOSE 8080
 
CMD [ "node", "src/index.js" ]