import * as fs from 'fs-extra';
import * as path from 'path';
import { Gateway, Contract, Identity, X509WalletMixin, InMemoryWallet, Transaction } from 'fabric-network';
import { Endorser } from 'fabric-common';

export const CHANNEL_NAME = 'test';
export const CHAINCODE_NAME = 'assertion-contract';

const connectionPath = path.join(__dirname, '../../../fixtures/network/connection');
const ccpPath = path.join(connectionPath, 'gateways/org1/gateway1.json');

export async function setup(): Promise<{gateway: Gateway, contract: Contract}> {
    const org1AdminPath = path.join(connectionPath, 'wallet/org1/org1-admin');

    const cert = await fs.readFile(path.join(org1AdminPath, 'signcerts/cert.pem'), 'utf-8');
    const key = await fs.readFile(path.join(org1AdminPath, 'keystore/key.pem'), 'utf-8');
    const mspId = 'org1Msp';

    const identity: Identity = X509WalletMixin.createIdentity(mspId, cert, key);

    const wallet = new InMemoryWallet();
    await wallet.import('admin', identity);

    const gateway = new Gateway();
    await gateway.connect(ccpPath, {
        identity: 'admin',
        wallet,
        discovery: {
            enabled: true,
            asLocalhost: true
        }
    });

    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);

    return {gateway, contract};
}
