import * as chai from 'chai';
import { Contract, Gateway } from 'fabric-network';
import { v4 as uuid } from 'uuid';
import { Channel, chaiFabricAssertions } from '../..';
import { setup } from './utils';
import { ChaincodeStub } from 'fabric-shim';

const expect = chai.expect;
chai.use(chaiFabricAssertions);

describe('Ledger', () => {
    const objectType = 'com.example.SimpleAsset';

    let gateway: Gateway;
    let contract: Contract;
    let channel: Channel;

    before(async () => {
        const setupDetails = await setup();

        gateway = setupDetails.gateway;
        contract = setupDetails.contract;

        channel = new Channel(gateway, 'test');
    });

    after(() => {
        gateway.disconnect();
    });

    describe('Channel', () => {

        describe('.transaction()', () => {

            it ('should satisfy expect when a transaction exists', async () => {
                const transaction = contract.createTransaction('createKeyValue');
                const transactionId = transaction.getTransactionID().getTransactionID();
                
                await transaction.submit(uuid(), '100');
        
                await expect(channel).to.have.transaction(transactionId);
            });
    
            it ('should satisfy expect not when a transaction does not exist', async () => {
                const transaction = contract.createTransaction('createKeyValue');
                const transactionId = 'fake tx id';
                
                await transaction.submit(uuid(), '100');
        
                await expect(channel).to.not.have.transaction(transactionId);
            });

            it ('should assert an error when expect tests a transaction to exist but it does not', async () => {
                const transaction = contract.createTransaction('createKeyValue');
                const transactionId = 'fake tx id';
                
                await transaction.submit(uuid(), '100');

                try {
                    await expect(channel).to.have.transaction(transactionId);
                    chai.assert.fail('transaction() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes('Transaction fake tx id not found')) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests a transaction to not exist but it does', async () => {
                const transaction = contract.createTransaction('createKeyValue');
                const transactionId = transaction.getTransactionID().getTransactionID();
                
                await transaction.submit(uuid(), '100');

                try {
                    await expect(channel).to.not.have.transaction(transactionId);
                    chai.assert.fail('transaction() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} found`)) {
                        chai.assert.fail(err);
                    }
                }
            })
        });
    });

    describe('Transaction', () => {

        describe('.functionAndParameters()', () => {

            let transactionId: string;
            let key: string;

            beforeEach(async () => {
                const transaction = contract.createTransaction('createKeyValue');
                transactionId = transaction.getTransactionID().getTransactionID();
                key = uuid();
    
                await transaction.submit(key, '100');
            })

            it ('should satisfy expect when function and parameters were used for transaction', async () => {
                const foundTransaction = channel.get(transactionId);
        
                await expect(foundTransaction).to.have.functionAndParameters('createKeyValue', [key, '100']);
            });

            it ('should satisfy expect not when function and parameters were not used for transaction', async () => {
                const foundTransaction = channel.get(transactionId);
        
                await expect(foundTransaction).to.not.have.functionAndParameters('lies', ['not key', '101']);
            });

            it ('should assert an error when expect tests transaction to have function and parameters but it does not', async () => {
                const foundTransaction = channel.get(transactionId);

                try {
                    await expect(foundTransaction).to.have.functionAndParameters('lies', [key, '100']);
                    chai.assert.fail('functionAndParameters() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does not have function`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests transaction to not have function and parameters but it does', async () => {
                const foundTransaction = channel.get(transactionId);

                try {
                    await expect(foundTransaction).to.not.have.functionAndParameters('createKeyValue', [key, '100']);
                    chai.assert.fail('functionAndParameters() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does have function`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should work when chained with .transaction()', async () => {
                await expect(channel).to.have.transaction(transactionId).with.functionAndParameters('createKeyValue', [key, '100']);
            });
        });

        describe('.writeTo', async () => {
            let transactionId: string;
    
            beforeEach(async () => {
                const transaction = contract.createTransaction('createSimpleAsset');
                transaction.setEndorsingOrganizations('org1Msp');
                transactionId = transaction.getTransactionID().getTransactionID();
                const id = uuid();
        
                await transaction.submit(id, '100', 'org1Collection', 'org2Collection');
            });
    
            it ('should satisfy expect when transaction writes to collection', async () => {
                const foundTransaction = channel.get(transactionId);
    
                await expect(foundTransaction).to.writeTo('org1Collection');
            });

            it ('should satisfy expect when transaction only writes to collection', async () => {
                const foundTransaction = channel.get(transactionId);
    
                await expect(foundTransaction).to.only.writeTo('org1Collection', 'org2Collection');
            });
    
            it ('should satisfy expect not when transaction does not write to collection', async () => {
                const foundTransaction = channel.get(transactionId);
    
                await expect(foundTransaction).to.not.writeTo('org3Collection');
            });
    
            it ('should assert an error when expect tests transaction to write to collection but it does not', async () => {
                const foundTransaction = channel.get(transactionId);
    
                try {
                    await expect(foundTransaction).to.writeTo('org3Collection')
                    chai.assert.fail('writeTo() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does not write to collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests transaction to only write to collection but it does not', async () => {
                const foundTransaction = channel.get(transactionId);
    
                try {
                    await expect(foundTransaction).to.only.writeTo('org1Collection')
                    chai.assert.fail('writeTo() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does not write only to collections`)) {
                        chai.assert.fail(err);
                    }
                }
            });
    
            it ('should assert an error when expect tests transaction to not write to collection but it does', async () => {
                const foundTransaction = channel.get(transactionId);
    
                try {
                    await expect(foundTransaction).to.not.writeTo('org1Collection')
                    chai.assert.fail('writeTo() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does write to collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
    
            it ('should work when chained with .transaction()', async () => {
                await expect(channel).to.have.transaction(transactionId).to.writeTo('org1Collection');
            });
        });

        describe('.writeToKey', async () => {
            let privateStateTransactionId: string;
            let worldStateTransactionId: string;
            let compositeKey: string;
            let id: string;
    
            beforeEach(async () => {
                const privateStateTransaction = contract.createTransaction('createSimpleAsset');
                privateStateTransaction.setEndorsingOrganizations('org1Msp');
                privateStateTransactionId = privateStateTransaction.getTransactionID().getTransactionID();
                id = uuid();

                compositeKey = ChaincodeStub.prototype.createCompositeKey(objectType, [id]);
        
                await privateStateTransaction.submit(id, '100', 'org1Collection', 'org2Collection');

                const worldStateTransaction = contract.createTransaction('createKeyValue');
                worldStateTransactionId = worldStateTransaction.getTransactionID().getTransactionID();

                await worldStateTransaction.submit(id, '100');
            });
    
            it ('should satisfy expect when transaction writes to key in world state', async () => {
                const foundTransaction = channel.get(worldStateTransactionId);
    
                await expect(foundTransaction).to.writeToKey(id);
            });

            it ('should satisfy expect when transaction writes to key in collection', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
    
                await expect(foundTransaction).to.writeToKey(compositeKey, 'org1Collection', 'org2Collection');
            });

            it ('should satisfy expect when transaction only writes to key in world state', async () => {
                const foundTransaction = channel.get(worldStateTransactionId);
    
                await expect(foundTransaction).to.only.writeToKey(id);
            });

            it ('should satisfy expect when transaction only writes to key collection', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
    
                await expect(foundTransaction).to.only.writeToKey(compositeKey, 'org1Collection', 'org2Collection');
            });

            it ('should satisfy expect not when transaction does not write to world state', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
    
                await expect(foundTransaction).to.not.writeToKey(id);
            });
    
            it ('should satisfy expect not when transaction does not write to collection', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
    
                await expect(foundTransaction).to.not.writeToKey(compositeKey, 'org3Collection');
            });

            it ('should satisfy expect not when transaction does not write to key in world state', async () => {
                const foundTransaction = channel.get(worldStateTransactionId);
    
                await expect(foundTransaction).to.not.writeToKey('some key');
            });

            it ('should satisfy expect not when transaction does not write to key in collection', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
    
                await expect(foundTransaction).to.not.writeToKey('some key', 'org1Collection');
            });
    
            it ('should assert an error when expect tests transaction to write to collection but it does not', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
    
                try {
                    await expect(foundTransaction).to.writeToKey(compositeKey, 'org3Collection')
                    chai.assert.fail('writeToKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${privateStateTransactionId} does not write to collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests transaction to write to key in collection but it does not', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
    
                try {
                    await expect(foundTransaction).to.writeToKey('some key', 'org1Collection')
                    chai.assert.fail('writeToKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${privateStateTransactionId} does not write to key in org1Collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests transaction to only write to collection but it does not', async () => {
                const transaction = contract.createTransaction('createMultipleSimpleAsset');
                transaction.setEndorsingOrganizations('org1Msp');
                privateStateTransactionId = transaction.getTransactionID().getTransactionID();
                const id = uuid();
                const id2 = uuid();

                compositeKey = ChaincodeStub.prototype.createCompositeKey(objectType, [id]);
        
                await transaction.submit(`["${id}", "${id2}"]`, '100', 'org1Collection', 'org2Collection');

                const foundTransaction = channel.get(privateStateTransactionId);
    
                try {
                    await expect(foundTransaction).to.only.writeToKey(compositeKey, 'org1Collection')
                    chai.assert.fail('writeToKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${privateStateTransactionId} does not write only to key in collection org1Collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
    
            it ('should assert an error when expect tests transaction to not write to collection but it does', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
    
                try {
                    await expect(foundTransaction).to.not.writeToKey(compositeKey, 'org1Collection')
                    chai.assert.fail('writeToKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${privateStateTransactionId} does write to key in org1Collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
    
            it ('should work when chained with .transaction()', async () => {
                await expect(channel).to.have.transaction(privateStateTransactionId).to.writeToKey(compositeKey, 'org1Collection');
            });
        });

        describe('.writeToCompositeKey', async () => {
            let transactionId: string;
            let id: string;
        
            beforeEach(async () => {
                const transaction = contract.createTransaction('createSimpleAsset');
                transaction.setEndorsingOrganizations('org1Msp');
                transactionId = transaction.getTransactionID().getTransactionID();
                id = uuid();
        
                await transaction.submit(id, '100', 'org1Collection', 'org2Collection');
            });
        
            it ('should satisfy expect when transaction writes to composite key in collection', async () => {
                const foundTransaction = channel.get(transactionId);
        
                await expect(foundTransaction).to.writeToCompositeKey(objectType, [id], 'org1Collection', 'org2Collection');
            });
        
            it ('should satisfy expect when transaction only writes to composite key collection', async () => {
                const foundTransaction = channel.get(transactionId);
        
                await expect(foundTransaction).to.only.writeToCompositeKey(objectType, [id], 'org1Collection', 'org2Collection');
            });
        
            it ('should satisfy expect not when transaction does not write to collection', async () => {
                const foundTransaction = channel.get(transactionId);
        
                await expect(foundTransaction).to.not.writeToCompositeKey(objectType, [id], 'org3Collection');
            });
        
            it ('should satisfy expect not when transaction does not write to composite key in collection', async () => {
                const foundTransaction = channel.get(transactionId);
        
                await expect(foundTransaction).to.not.writeToCompositeKey('some', ['key'], 'org1Collection');
            });
        
            it ('should assert an error when expect tests transaction to write to collection but it does not', async () => {
                const foundTransaction = channel.get(transactionId);
        
                try {
                    await expect(foundTransaction).to.writeToCompositeKey(objectType, [id], 'org3Collection')
                    chai.assert.fail('writeToCompositeKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does not write to collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        
            it ('should assert an error when expect tests transaction to write to composite key in collection but it does not', async () => {
                const foundTransaction = channel.get(transactionId);
        
                try {
                    await expect(foundTransaction).to.writeToCompositeKey('some key', ['key'], 'org1Collection')
                    chai.assert.fail('writeToCompositeKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does not write to key in org1Collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        
            it ('should assert an error when expect tests transaction to only write to collection but it does not', async () => {
                const transaction = contract.createTransaction('createMultipleSimpleAsset');
                transaction.setEndorsingOrganizations('org1Msp');
                transactionId = transaction.getTransactionID().getTransactionID();
                id = uuid();
                const id2 = uuid();
        
                await transaction.submit(`["${id}", "${id2}"]`, '100', 'org1Collection', 'org2Collection');
        
                const foundTransaction = channel.get(transactionId);
        
                try {
                    await expect(foundTransaction).to.only.writeToCompositeKey(objectType, [id], 'org1Collection')
                    chai.assert.fail('writeToCompositeKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does not write only to key in collection org1Collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        
            it ('should assert an error when expect tests transaction to not write to collection but it does', async () => {
                const foundTransaction = channel.get(transactionId);
        
                try {
                    await expect(foundTransaction).to.not.writeToCompositeKey(objectType, [id], 'org1Collection')
                    chai.assert.fail('writeToCompositeKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does write to key in org1Collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        
            it ('should work when chained with .transaction()', async () => {
                await expect(channel).to.have.transaction(transactionId).to.writeToCompositeKey(objectType, [id], 'org1Collection');
            });
        });
    
        describe('.readFrom', async () => {
            let transactionId: string;
    
            beforeEach(async () => {
                const transaction = contract.createTransaction('createSimpleAsset');
                transaction.setEndorsingOrganizations('org1Msp');
                transactionId = transaction.getTransactionID().getTransactionID();
                const id = uuid();
        
                await transaction.submit(id, '100', 'org1Collection', 'org2Collection');
            });
    
            it ('should satisfy expect when transaction reads from collection', async () => {
                const foundTransaction = channel.get(transactionId);
    
                await expect(foundTransaction).to.readFrom('org1Collection');
            });

            it ('should satisfy expect when transaction reads only from collections', async () => {
                const foundTransaction = channel.get(transactionId);
    
                await expect(foundTransaction).to.only.readFrom('org1Collection', 'org2Collection');
            });
    
            it ('should satisfy expect not when transaction does not read from collection', async () => {
                const foundTransaction = channel.get(transactionId);
    
                await expect(foundTransaction).to.not.readFrom('org3Collection');
            });
    
            it ('should assert an error when expect tests transaction to read from collection but it does not', async () => {
                const foundTransaction = channel.get(transactionId);
    
                try {
                    await expect(foundTransaction).to.readFrom('org3Collection')
                    chai.assert.fail('readFrom() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does not read from collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests transaction to only read from collection but it does not', async () => {
                const foundTransaction = channel.get(transactionId);
    
                try {
                    await expect(foundTransaction).to.only.readFrom('org1Collection')
                    chai.assert.fail('readFrom() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does not read only from collections`)) {
                        chai.assert.fail(err);
                    }
                }
            });
    
            it ('should assert an error when expect tests transaction to not read from collection but it does', async () => {
                const foundTransaction = channel.get(transactionId);
    
                try {
                    await expect(foundTransaction).to.not.readFrom('org1Collection')
                    chai.assert.fail('readFrom() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does read from collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
    
            it ('should work when chained with .transaction()', async () => {
                await expect(channel).to.have.transaction(transactionId).to.readFrom('org1Collection');
            });
        });

        describe('.readFromKey', async () => {
            let privateStateTransactionId: string;
            let worldStateTransactionId: string;
            let compositeKey: string;
            let id: string;
    
            beforeEach(async () => {
                const privateStateTransaction = contract.createTransaction('createSimpleAsset');
                privateStateTransaction.setEndorsingOrganizations('org1Msp');
                privateStateTransactionId = privateStateTransaction.getTransactionID().getTransactionID();
                id = uuid();

                compositeKey = ChaincodeStub.prototype.createCompositeKey(objectType, [id]);
        
                await privateStateTransaction.submit(id, '100', 'org1Collection', 'org2Collection');

                const worldStateTransaction = contract.createTransaction('createKeyValue');
                worldStateTransactionId = worldStateTransaction.getTransactionID().getTransactionID();

                await worldStateTransaction.submit(id, '100');
            });
        
            it ('should satisfy expect when transaction reads from key in world state', async () => {
                const foundTransaction = channel.get(worldStateTransactionId);
        
                await expect(foundTransaction).to.readFromKey(id);
            });

            it ('should satisfy expect when transaction reads from key in collection', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
        
                await expect(foundTransaction).to.readFromKey(compositeKey, 'org1Collection', 'org2Collection');
            });

            it ('should satisfy expect when transaction only reads from key in world state', async () => {
                const foundTransaction = channel.get(worldStateTransactionId);
        
                await expect(foundTransaction).to.only.readFromKey(id);
            });
        
            it ('should satisfy expect when transaction only reads from key collection', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
        
                await expect(foundTransaction).to.only.readFromKey(compositeKey, 'org1Collection', 'org2Collection');
            });

            it ('should satisfy expect not when transaction does not read from world state', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
        
                await expect(foundTransaction).to.not.readFromKey(compositeKey);
            });

            it ('should satisfy expect not when transaction does not read from collection', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
        
                await expect(foundTransaction).to.not.readFromKey(compositeKey, 'org3Collection');
            });
        
            it ('should satisfy expect not when transaction does not read from key in world state', async () => {
                const foundTransaction = channel.get(worldStateTransactionId);
        
                await expect(foundTransaction).to.not.readFromKey('some key');
            });

            it ('should satisfy expect not when transaction does not read from key in collection', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
        
                await expect(foundTransaction).to.not.readFromKey('some key', 'org1Collection');
            });
        
            it ('should assert an error when expect tests transaction to read from collection but it does not', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
        
                try {
                    await expect(foundTransaction).to.readFromKey(compositeKey, 'org3Collection')
                    chai.assert.fail('readFromKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${privateStateTransactionId} does not read from collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        
            it ('should assert an error when expect tests transaction to read from key in collection but it does not', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
        
                try {
                    await expect(foundTransaction).to.readFromKey('some key', 'org1Collection')
                    chai.assert.fail('readFromKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${privateStateTransactionId} does not read from key in collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        
            it ('should assert an error when expect tests transaction to only read from collection but it does not', async () => {
                const transaction = contract.createTransaction('createMultipleSimpleAsset');
                transaction.setEndorsingOrganizations('org1Msp');
                privateStateTransactionId = transaction.getTransactionID().getTransactionID();
                const id = uuid();
                const id2 = uuid();
        
                compositeKey = ChaincodeStub.prototype.createCompositeKey(objectType, [id]);
        
                await transaction.submit(`["${id}", "${id2}"]`, '100', 'org1Collection', 'org2Collection');
        
                const foundTransaction = channel.get(privateStateTransactionId);
        
                try {
                    await expect(foundTransaction).to.only.readFromKey(compositeKey, 'org1Collection')
                    chai.assert.fail('readFromKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${privateStateTransactionId} does not read only from key in collection org1Collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        
            it ('should assert an error when expect tests transaction to not read from collection but it does', async () => {
                const foundTransaction = channel.get(privateStateTransactionId);
        
                try {
                    await expect(foundTransaction).to.not.readFromKey(compositeKey, 'org1Collection')
                    chai.assert.fail('readFromKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${privateStateTransactionId} does read from key in collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        
            it ('should work when chained with .transaction()', async () => {
                await expect(channel).to.have.transaction(privateStateTransactionId).to.readFromKey(compositeKey, 'org1Collection');
            });
        });

        describe('.readFromCompositeKey', async () => {
            let transactionId: string;
            let id: string;
        
            beforeEach(async () => {
                const transaction = contract.createTransaction('createSimpleAsset');
                transaction.setEndorsingOrganizations('org1Msp');
                transactionId = transaction.getTransactionID().getTransactionID();
                id = uuid();
        
                await transaction.submit(id, '100', 'org1Collection', 'org2Collection');
            });
        
            it ('should satisfy expect when transaction reads from composite key in collection', async () => {
                const foundTransaction = channel.get(transactionId);
        
                await expect(foundTransaction).to.readFromCompositeKey(objectType, [id], 'org1Collection', 'org2Collection');
            });
        
            it ('should satisfy expect when transaction only reads from composite key collection', async () => {
                const foundTransaction = channel.get(transactionId);
        
                await expect(foundTransaction).to.only.readFromCompositeKey(objectType, [id], 'org1Collection', 'org2Collection');
            });
        
            it ('should satisfy expect not when transaction does not read from collection', async () => {
                const foundTransaction = channel.get(transactionId);
        
                await expect(foundTransaction).to.not.readFromCompositeKey(objectType, [id], 'org3Collection');
            });
        
            it ('should satisfy expect not when transaction does not read from composite key in collection', async () => {
                const foundTransaction = channel.get(transactionId);
        
                await expect(foundTransaction).to.not.readFromCompositeKey('some', ['key'], 'org1Collection');
            });
        
            it ('should assert an error when expect tests transaction to read from collection but it does not', async () => {
                const foundTransaction = channel.get(transactionId);
        
                try {
                    await expect(foundTransaction).to.readFromCompositeKey(objectType, [id], 'org3Collection')
                    chai.assert.fail('readFromCompositeKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does not read from collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        
            it ('should assert an error when expect tests transaction to read from composite key in collection but it does not', async () => {
                const foundTransaction = channel.get(transactionId);
        
                try {
                    await expect(foundTransaction).to.readFromCompositeKey('some', ['key'], 'org1Collection')
                    chai.assert.fail('readFromCompositeKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does not read from key in collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        
            it ('should assert an error when expect tests transaction to only read from composite collection but it does not', async () => {
                const transaction = contract.createTransaction('createMultipleSimpleAsset');
                transaction.setEndorsingOrganizations('org1Msp');
                transactionId = transaction.getTransactionID().getTransactionID();
                id = uuid();
                const id2 = uuid();
        
                await transaction.submit(`["${id}", "${id2}"]`, '100', 'org1Collection', 'org2Collection');
        
                const foundTransaction = channel.get(transactionId);
        
                try {
                    await expect(foundTransaction).to.only.readFromCompositeKey(objectType, [id], 'org1Collection')
                    chai.assert.fail('readFromCompositeKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does not read only from key in collection org1Collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        
            it ('should assert an error when expect tests transaction to not read from collection but it does', async () => {
                const foundTransaction = channel.get(transactionId);
        
                try {
                    await expect(foundTransaction).to.not.readFromCompositeKey(objectType, [id], 'org1Collection')
                    chai.assert.fail('readFromCompositeKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionId} does read from key in collection`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        
            it ('should work when chained with .transaction()', async () => {
                await expect(channel).to.have.transaction(transactionId).to.readFromCompositeKey(objectType, [id], 'org1Collection');
            });
        });

        describe('.emit', async () => {
            let transactionIdEventEmitter: string;
            let transactionIdNonEventEmitter: string;
    
            beforeEach(async () => {
                const nonEventTransaction = contract.createTransaction('createSimpleAsset');
                nonEventTransaction.setEndorsingOrganizations('org1Msp');
                transactionIdNonEventEmitter = nonEventTransaction.getTransactionID().getTransactionID();
                const id = uuid();
        
                await nonEventTransaction.submit(id, '100', 'org1Collection', 'org2Collection');

                const eventTransaction = contract.createTransaction('emitEvent');
                transactionIdEventEmitter = eventTransaction.getTransactionID().getTransactionID();
        
                await eventTransaction.submit('some name', 'some data');
            });

            it ('should satisfy expect when transaction emits event', async () => {
                const foundTransaction = channel.get(transactionIdEventEmitter);

                await expect(foundTransaction).to.emit('some name', 'some data');
            });

            it ('should satisfy expect when transaction does not emit event with name and data', async () => {
                const foundTransaction = channel.get(transactionIdNonEventEmitter);

                await expect(foundTransaction).to.not.emit('some name', 'some data');
            });

            it ('should assert an error when expect tests transaction to emit event but it does not emit any event', async () => {
                const foundTransaction = channel.get(transactionIdNonEventEmitter);
    
                try {
                    await expect(foundTransaction).to.emit('some name', 'some data');
                    chai.assert.fail('emit() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionIdNonEventEmitter} does not emit event`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests transaction to emit event but it does not emit event with name', async () => {
                const foundTransaction = channel.get(transactionIdEventEmitter);
    
                try {
                    await expect(foundTransaction).to.emit('some other name', 'some data');
                    chai.assert.fail('emit() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionIdEventEmitter} does not emit event`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests transaction to emit event but it does not emit event with data', async () => {
                const foundTransaction = channel.get(transactionIdEventEmitter);
    
                try {
                    await expect(foundTransaction).to.emit('some name', 'some other data');
                    chai.assert.fail('emit() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionIdEventEmitter} does not emit event`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests transaction to not emit event but it does', async () => {
                const foundTransaction = channel.get(transactionIdEventEmitter);
    
                try {
                    await expect(foundTransaction).to.not.emit('some name', 'some data');
                    chai.assert.fail('emit() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionIdEventEmitter} does emit event`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should work when chained with .transaction()', async () => {
                await expect(channel).to.have.transaction(transactionIdEventEmitter).to.emit('some name', 'some data');
            });
        });

        describe('.event', () => {
            let transactionIdEventEmitter: string;
            let transactionIdNonEventEmitter: string;
    
            beforeEach(async () => {
                const nonEventTransaction = contract.createTransaction('createSimpleAsset');
                nonEventTransaction.setEndorsingOrganizations('org1Msp');
                transactionIdNonEventEmitter = nonEventTransaction.getTransactionID().getTransactionID();
                const id = uuid();
        
                await nonEventTransaction.submit(id, '100', 'org1Collection', 'org2Collection');

                const eventTransaction = contract.createTransaction('emitEvent');
                transactionIdEventEmitter = eventTransaction.getTransactionID().getTransactionID();
        
                await eventTransaction.submit('some name', 'some data');
            });

            it ('should satisfy expect when transaction emits an event and no passing args given', async () => {
                const foundTransaction = channel.get(transactionIdEventEmitter);

                await expect(foundTransaction).to.have.event;
            });

            it ('should satisfy expect when transaction does not emit an event and no passing args given', async () => {
                const foundTransaction = channel.get(transactionIdNonEventEmitter);

                await expect(foundTransaction).to.not.have.event;
            });

            it ('should assert an error when expect tests transaction to emit event but it does not and no passing args given', async () => {
                const foundTransaction = channel.get(transactionIdNonEventEmitter);
    
                try {
                    await expect(foundTransaction).to.have.event;
                    chai.assert.fail('emit() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionIdNonEventEmitter} does not emit event`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests transaction to not emit event but it does', async () => {
                const foundTransaction = channel.get(transactionIdEventEmitter);
    
                try {
                    await expect(foundTransaction).to.not.have.event;
                    chai.assert.fail('emit() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${transactionIdEventEmitter} does emit event`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should work when chained with .transaction()', async () => {
                await expect(channel).to.have.transaction(transactionIdEventEmitter).with.event;
            });
        });

        describe('worldState', () => {
            let worldStateTransactionId: string;
            let nonWorldStateTransactionId: string;

            beforeEach(async () => {
                const worldStateTransaction = contract.createTransaction('createKeyValue');
                worldStateTransactionId = worldStateTransaction.getTransactionID().getTransactionID();
                
                await worldStateTransaction.submit(uuid(), '100');

                const nonWorldStateTransaction = contract.createTransaction('createSimpleAsset');
                nonWorldStateTransaction.setEndorsingOrganizations('org1Msp');
                nonWorldStateTransactionId = nonWorldStateTransaction.getTransactionID().getTransactionID();
                const id = uuid();
        
                await nonWorldStateTransaction.submit(id, '100', 'org1Collection', 'org2Collection');
            });

            it ('should satisfy expect when transaction does write to world state', async () => {
                const foundTransaction = channel.get(worldStateTransactionId);

                await expect(foundTransaction).to.write.to.worldState;
            });

            it ('should satisfy expect not when transaction does not write to world state', async () => {
                const foundTransaction = channel.get(nonWorldStateTransactionId);

                await expect(foundTransaction).to.not.write.to.worldState;
            });

            it ('should satisfy expect when transaction does read from world state', async () => {
                const foundTransaction = channel.get(worldStateTransactionId);

                await expect(foundTransaction).to.read.worldState;
            });

            it ('should satisfy expect not when transaction does not read from world state', async () => {
                const foundTransaction = channel.get(nonWorldStateTransactionId);

                await expect(foundTransaction).to.not.read.worldState;
            });
        });

        describe('.successful', () => {
            let returnValueTransactionId: string;
            let failTransactionId: string;

            beforeEach(async () => {
                const returnValueTransaction = contract.createTransaction('returnSomething');
                returnValueTransactionId = returnValueTransaction.getTransactionID().getTransactionID();
                
                await returnValueTransaction.submit('100');

                const failTransaction = contract.createTransaction('fail');
                failTransactionId = failTransaction.getTransactionID().getTransactionID();
                
                // await failTransaction.submit('some error'); TODO HANDLE FAIL COMMIT TXN
            });

            it ('should satisfy expect when transaction is successful', async () => {
                const foundTransaction = channel.get(returnValueTransactionId);

                await expect(foundTransaction).to.be.successful;
            });

            it.skip ('should satisfy expect not when transaction is not successful', async () => {
                const foundTransaction = channel.get(failTransactionId);

                await expect(foundTransaction).to.not.be.successful;
            });

            it.skip ('should assert an error when expect tests transaction to be successful but it is not', async () => {
                const foundTransaction = channel.get(failTransactionId);
    
                try {
                    await expect(foundTransaction).to.be.successful;
                    chai.assert.fail('successful should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${failTransactionId} is not successful`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests transaction to not be successful but it is', async () => {
                const foundTransaction = channel.get(returnValueTransactionId);
    
                try {
                    await expect(foundTransaction).to.not.be.successful;
                    chai.assert.fail('successful should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${returnValueTransactionId} is successful`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        });

        // describe('.unsuccessful', () => {
        //     let returnValueTransactionId: string;
        //     let failTransactionId: string;

        //     beforeEach(async () => {
        //         const returnValueTransaction = contract.createTransaction('returnSomething');
        //         returnValueTransactionId = returnValueTransaction.getTransactionID().getTransactionID();
                
        //         await returnValueTransaction.submit('100');

        //         const failTransaction = contract.createTransaction('fail');
        //         failTransactionId = failTransaction.getTransactionID().getTransactionID();
                
        //         await failTransaction.submit('some error'); // TODO HANDLE SUBMIT FAIL TXNS
        //     });

        //     it ('should satisfy expect when transaction is unsuccessful', async () => {
        //         const foundTransaction = channel.get(failTransactionId);

        //         await expect(foundTransaction).to.be.unsuccessful;
        //     });

        //     it ('should satisfy expect not when transaction is not unsuccessful', async () => {
        //         const foundTransaction = channel.get(returnValueTransactionId);

        //         await expect(foundTransaction).to.not.be.unsuccessful;
        //     });

        //     it ('should assert an error when expect tests transaction to be unsuccessful but it is not', async () => {
        //         const foundTransaction = channel.get(returnValueTransactionId);
    
        //         try {
        //             await expect(foundTransaction).to.be.unsuccessful;
        //             chai.assert.fail('unsuccessful should have asserted an error');
        //         } catch(err) {
        //             if (!err.message.includes(`Transaction ${returnValueTransactionId} is successful`)) {
        //                 chai.assert.fail(err);
        //             }
        //         }
        //     });

        //     it ('should assert an error when expect tests transaction to not be unsuccessful but it is', async () => {
        //         const foundTransaction = channel.get(failTransactionId);
    
        //         try {
        //             await expect(foundTransaction).to.not.be.unsuccessful;
        //             chai.assert.fail('unsuccessful should have asserted an error');
        //         } catch(err) {
        //             if (!err.message.includes(`Transaction ${failTransactionId} is not successful`)) {
        //                 chai.assert.fail(err);
        //             }
        //         }
        //     });
        // });

        describe('.payload', () => {
            let returnValueTransactionId: string;
            let notReturnValueTransactionId: string;

            beforeEach(async () => {
                const returnValueTransaction = contract.createTransaction('returnSomething');
                returnValueTransactionId = returnValueTransaction.getTransactionID().getTransactionID();

                await returnValueTransaction.submit(uuid());

                const notReturnValueTransaction = contract.createTransaction('createKeyValue');
                notReturnValueTransactionId = notReturnValueTransaction.getTransactionID().getTransactionID();
                
                await notReturnValueTransaction.submit(uuid(), '100');
            });

            it ('should satisfy expect when transaction has payload', async () => {
                const foundTransaction = channel.get(returnValueTransactionId);

                await expect(foundTransaction).to.have.payload;
            });

            it ('should satisfy expect not when transaction does not have payload', async () => {
                const foundTransaction = channel.get(notReturnValueTransactionId);

                await expect(foundTransaction).to.not.have.payload;
            });

            it ('should assert an error when expect tests transaction to have payload but it does not', async () => {
                const foundTransaction = channel.get(notReturnValueTransactionId);

                try {
                    await expect(foundTransaction).to.have.payload;
                    chai.assert.fail('payload should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${notReturnValueTransactionId} does not have response payload`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests transaction to not have payload but it does', async () => {
                const foundTransaction = channel.get(returnValueTransactionId);

                try {
                    await expect(foundTransaction).to.not.have.payload;
                    chai.assert.fail('payload should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${returnValueTransactionId} does have response payload`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        });

        describe('.message', () => {
            let messageTransactionId: string;
            let notMessageTransactionId: string;

            beforeEach(async () => {
                const messageTransaction = contract.createTransaction('fail');
                messageTransactionId = messageTransaction.getTransactionID().getTransactionID();

                // await messageTransaction.submit(uuid()); TODO ALLOW SUBMIT OF FAILING TXNS

                const notMessageTransaction = contract.createTransaction('createKeyValue');
                notMessageTransactionId = notMessageTransaction.getTransactionID().getTransactionID();
                
                await notMessageTransaction.submit(uuid(), '100');
            });

            it.skip ('should satisfy expect when transaction has message', async () => {
                const foundTransaction = channel.get(messageTransactionId);

                await expect(foundTransaction).to.have.message;
            });

            it ('should satisfy expect not when transaction does not have message', async () => {
                const foundTransaction = channel.get(notMessageTransactionId);

                await expect(foundTransaction).to.not.have.message;
            });

            it ('should assert an error when expect tests transaction to have message but it does not', async () => {
                const foundTransaction = channel.get(notMessageTransactionId);

                try {
                    await expect(foundTransaction).to.have.message;
                    chai.assert.fail('message should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${notMessageTransactionId} does not have response message`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it.skip ('should assert an error when expect tests transaction to not have message but it does', async () => {
                const foundTransaction = channel.get(messageTransactionId);

                try {
                    await expect(foundTransaction).to.not.have.message;
                    chai.assert.fail('message should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${messageTransactionId} does have response message`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        });

        describe('.exactPayload', () => {
            let returnValueTransactionId: string;
            let notReturnValueTransactionId: string;
            let value: string;

            beforeEach(async () => {
                const returnValueTransaction = contract.createTransaction('returnSomething');
                returnValueTransactionId = returnValueTransaction.getTransactionID().getTransactionID();
                value = uuid();

                await returnValueTransaction.submit(value);

                const notReturnValueTransaction = contract.createTransaction('createKeyValue');
                notReturnValueTransactionId = notReturnValueTransaction.getTransactionID().getTransactionID();
                
                await notReturnValueTransaction.submit(uuid(), '100');
            });

            it ('should satisfy expect when transaction has given payload', async () => {
                const foundTransaction = channel.get(returnValueTransactionId);

                await expect(foundTransaction).to.have.exactPayload(value);
            });

            it ('should satisfy expect not when transaction does not have given payload', async () => {
                const foundTransaction = channel.get(returnValueTransactionId);

                await expect(foundTransaction).to.not.have.exactPayload('bad payload');
            });

            it ('should assert an error when expect tests transaction to have given payload but it does not have a payload', async () => {
                const foundTransaction = channel.get(notReturnValueTransactionId);

                try {
                    await expect(foundTransaction).to.have.exactPayload(value);
                    chai.assert.fail('exactPayload should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${notReturnValueTransactionId} does not have given response payload`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests transaction to have given payload but it does not', async () => {
                const foundTransaction = channel.get(returnValueTransactionId);

                try {
                    await expect(foundTransaction).to.have.exactPayload('bad payload');
                    chai.assert.fail('exactPayload should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${returnValueTransactionId} does not have given response payload`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests transaction to not have payload but it does', async () => {
                const foundTransaction = channel.get(returnValueTransactionId);

                try {
                    await expect(foundTransaction).to.not.have.exactPayload(value);
                    chai.assert.fail('exactPayload should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Transaction ${returnValueTransactionId} does have given response payload`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        });

        // describe.skip('.exactMessage', () => {
        //     let messageTransactionId: string;
        //     let nonMessageTransactionId: string;
        //     let errorMessage: string;

        //     beforeEach(async () => {
        //         const messageTransaction = contract.createTransaction('fail');
        //         messageTransactionId = messageTransaction.getTransactionID().getTransactionID();
        //         errorMessage = 'some error ' + uuid();

        //         await messageTransaction.submit(errorMessage); // TODO MAKE IT SO CAN SUBMIT FAILING TXNS

        //         const nonMessageTransaction = contract.createTransaction('createKeyValue');
        //         nonMessageTransactionId = nonMessageTransaction.getTransactionID().getTransactionID();
                
        //         await nonMessageTransaction.submit(uuid(), '100');
        //     });

        //     it ('should satisfy expect when transaction has given message', async () => {
        //         const foundTransaction = channel.get(messageTransactionId);

        //         await expect(foundTransaction).to.have.exactMessage(errorMessage);
        //     });

        //     it ('should satisfy expect not when transaction does not have given message', async () => {
        //         const foundTransaction = channel.get(messageTransactionId);

        //         await expect(foundTransaction).to.not.have.exactMessage('bad message');
        //     });

        //     it ('should assert an error when expect tests transaction to have given message but it does not have a message', async () => {
        //         const foundTransaction = channel.get(nonMessageTransactionId);

        //         try {
        //             await expect(foundTransaction).to.have.exactMessage(errorMessage);
        //             chai.assert.fail('exactMessage should have asserted an error');
        //         } catch(err) {
        //             if (!err.message.includes(`Transaction ${nonMessageTransactionId} does not have given response message`)) {
        //                 chai.assert.fail(err);
        //             }
        //         }
        //     });

        //     it ('should assert an error when expect tests transaction to have given message but it does not', async () => {
        //         const foundTransaction = channel.get(messageTransactionId);

        //         try {
        //             await expect(foundTransaction).to.have.exactMessage('bad message');
        //             chai.assert.fail('exactMessage should have asserted an error');
        //         } catch(err) {
        //             if (!err.message.includes(`Transaction ${messageTransactionId} does not have given response message`)) {
        //                 chai.assert.fail(err);
        //             }
        //         }
        //     });

        //     it ('should assert an error when expect tests transaction to not have message but it does', async () => {
        //         const foundTransaction = channel.get(messageTransactionId);

        //         try {
        //             await expect(foundTransaction).to.not.have.exactMessage(errorMessage);
        //             chai.assert.fail('exactMessage should have asserted an error');
        //         } catch(err) {
        //             if (!err.message.includes(`Transaction ${messageTransactionId} does have given response message`)) {
        //                 chai.assert.fail(err);
        //             }
        //         }
        //     });
        // });
    });
});