FROM node:8.9.1

ENV API_PORT=8090
ENV ARENA_PORT=8091

ADD . /var/app
RUN chown -R node. /var/app

WORKDIR /var/app

USER node

EXPOSE $API_PORT
EXPOSE $ARENA_PORT

CMD ["npm", "start"]