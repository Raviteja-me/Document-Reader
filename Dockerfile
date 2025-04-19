FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . ./

# Remove if exists and create new uploads directory
RUN rm -rf uploads && mkdir uploads

EXPOSE 8080

CMD [ "npm", "start" ]