FROM node:8.9.1

ADD . /var/app
RUN chown -R node. /var/app

WORKDIR /var/app

USER node

CMD ["npm", "start"]