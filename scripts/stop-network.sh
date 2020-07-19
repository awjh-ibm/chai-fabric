#!/bin/bash

BASE_DIRECTORY=$(cd $(dirname ${BASH_SOURCE[0]}) && pwd)

docker rm -f $(docker ps -aq)
docker rmi $(docker images at-* --quiet)
docker network rm hub_default
docker volume rm $(docker volume ls -qf dangling=true)
rm -rf "${BASE_DIRECTORY}/../fixtures/network/connection"