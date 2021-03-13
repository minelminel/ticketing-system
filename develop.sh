#!/bin/bash
set -e

NAME=ticketing-system
TAG=latest

function _run() {
    # ps -ef | grep python, then kill -9 with PID
    cd api && python3 app.py &
    cd ui && yarn start
    return 0
}

function _build() {
    docker build . -t "$NAME:$TAG"
    docker build . -f ./api/Dockerfile.dev -t "$NAME-api:$TAG"
    docker build . -f ./ui/Dockerfile.dev -t "$NAME-ui:$TAG"
    return 0
}

function _docker() {
    _build
    docker-compose up -d
    return 0
}

if [[ $# -eq 0 ]]; then
    echo "Usage: $0 {run,build,docker}"
    exit 1
fi

for ARG in "$@"; do
    case $ARG in
    "run")
        _run
        ;;
    "build")
        _build
        ;;
    "docker")
        _docker
        ;;
    *)
        echo "Unknown argument: $ARG, skipping..."
        ;;
    esac
done
