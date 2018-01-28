FROM node:8.9.1

ENV API_PORT=8080
ENV ARENA_PORT=4001

ADD . /var/app
RUN chown -R node. /var/app

WORKDIR /var/app

USER node

EXPOSE $API_PORT
EXPOSE $ARNEA_PORT

CMD ["npm", "start"]