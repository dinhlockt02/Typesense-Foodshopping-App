FROM node:lts-slim

WORKDIR /app

COPY . .

RUN npm install 

ENV TYPESENSE_API_KEY=api-key
ENV EATERIES_COLLECTION_NAME=value
ENV TYPESENSE_HOST=value

CMD ["node", "server.js"]