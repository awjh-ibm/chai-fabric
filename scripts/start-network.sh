#!/bin/bash

BASE_DIRECTORY=$(cd $(dirname ${BASH_SOURCE[0]}) && pwd)

docker run --rm --network=host -v /var/run/docker.sock:/var/run/docker.sock -v "${BASE_DIRECTORY}/../fixtures/network":/network cicnl/ansible-role-blockchain-platform-manager:1.0.0 bash -c "ansible-playbook /network/network.yaml && chown 1000:1000 -R /network/connection"

for KEY in $(find ${BASE_DIRECTORY}/../fixtures/network -type f -name "*_sk"); do
    KEY_DIR=$(dirname ${KEY})
    mv ${KEY} ${KEY_DIR}/key.pem
done
