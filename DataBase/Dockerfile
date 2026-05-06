FROM mysql:8.0
LABEL Description=" This is application database image for H-M-System application"
LABEL Maintainer="dattasaibattu@gmail.com"

COPY ./queries.sql /docker-entrypoint-initdb.d/
EXPOSE 3306
