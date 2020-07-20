import * as chai from 'chai';
import { Contract, Gateway } from 'fabric-network';
import { v4 as uuid } from 'uuid';
import { Channel, ibpAssertions } from '../..';
import { setup } from './utils';

const expect = chai.expect;
chai.use(ibpAssertions);

describe('Ledger', () => {
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
    });

    describe('.writeTo', async () => {
        let transactionId: string;

        beforeEach(async () => {
            const transaction = contract.createTransaction('createSimpleAsset');
            transaction.setEndorsingOrganizations('org1Msp');
            transactionId = transaction.getTransactionID().getTransactionID();
            const id = uuid();
    
            await transaction.submit(id, '100', 'org1Collection', 'org1Collection');
        });

        it ('should satisfy expect when transaction writes to collection', async () => {
            const foundTransaction = channel.get(transactionId);

            await expect(foundTransaction).to.writeTo('org1Collection');
        });

        it ('should satisfy expect not when transaction does not write to collection', async () => {
            const foundTransaction = channel.get(transactionId);

            await expect(foundTransaction).to.not.writeTo('org2Collection');
        });

        it ('should assert an error when expect tests transaction to write to collection but it does not', async () => {
            const foundTransaction = channel.get(transactionId);

            try {
                await expect(foundTransaction).to.writeTo('org2Collection')
                chai.assert.fail('writeTo() should have asserted an error');
            } catch(err) {
                if (!err.message.includes(`Transaction ${transactionId} does not write to collection`)) {
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

    describe('.readFrom', async () => {
        let transactionId: string;

        beforeEach(async () => {
            const transaction = contract.createTransaction('createSimpleAsset');
            transaction.setEndorsingOrganizations('org1Msp');
            transactionId = transaction.getTransactionID().getTransactionID();
            const id = uuid();
    
            await transaction.submit(id, '100', 'org1Collection', 'org1Collection');
        });

        it ('should satisfy expect when transaction reads from collection', async () => {
            const foundTransaction = channel.get(transactionId);

            await expect(foundTransaction).to.readFrom('org1Collection');
        });

        it ('should satisfy expect not when transaction does not read from collection', async () => {
            const foundTransaction = channel.get(transactionId);

            await expect(foundTransaction).to.not.readFrom('org2Collection');
        });

        it ('should assert an error when expect tests transaction to read from collection but it does not', async () => {
            const foundTransaction = channel.get(transactionId);

            try {
                await expect(foundTransaction).to.readFrom('org2Collection')
                chai.assert.fail('readFrom() should have asserted an error');
            } catch(err) {
                if (!err.message.includes(`Transaction ${transactionId} does not read from collection`)) {
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
});