FROM node:20-alpine AS build
LABEL Description="Backend image for H-M-System"
LABEL Maintainer="dattasaibattu@gmail.com"
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --if-present

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
ENTRYPOINT [ "node" ]
CMD [ "server.js" ]
