#!/bin/bash

echo "Waiting for postgres..."

while ! nc -z $SQL_HOST $SQL_PORT; do
  sleep 0.1
done

echo "PostgreSQL started"

if [ -z "$DOCKER_ENV" ];
then
  python3 app.py db_create;
else
  python3 app.py -c "$DOCKER_ENV" db_create;
fi

exec "$@"
