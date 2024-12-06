FROM node:latest
WORKDIR /clockmail-buddy
COPY . .
RUN rm -rf node_modules
RUN yarn install
CMD ["npm", "start"]

EXPOSE 7001