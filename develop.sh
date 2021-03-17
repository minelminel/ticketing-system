#!/bin/bash
set -e

function _up() {
    docker-compose up
    return 0
}

function _down() {
    docker-compose down --remove-orphans
    return 0
}

function _build() {
    docker-compose build
    return 0
}

if [[ $# -eq 0 ]]; then
    echo "Usage: $0 {up,down,build}"
    exit 1
fi

for ARG in "$@"; do
    case $ARG in
    "up")
        _up
        ;;
    "down")
        _down
        ;;
    "build")
        _build
        ;;
    *)
        echo "Unknown argument: $ARG, skipping..."
        ;;
    esac
done
