FROM node:12.22.10-alpine

COPY ["package.json", "yarn.lock", "/usr/src/"]

WORKDIR /usr/src

RUN npm install

COPY [".", "/usr/src"]

CMD ["npm", "run", "start"]
