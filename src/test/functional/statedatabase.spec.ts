import * as chai from 'chai';
import { Contract, Gateway } from 'fabric-network';
import { v4 as uuid } from 'uuid';
import { Collection, chaiFabricAssertions, StateDatabase, Channel } from '../..';
import { CHAINCODE_NAME, CHANNEL_NAME, setup } from './utils';
import { ChaincodeStub } from 'fabric-shim';
import { KeyValue } from '../../helpers/KeyValue';

const expect = chai.expect;
chai.use(chaiFabricAssertions);

describe('StateDatabase', () => {
    const objectType = 'com.example.SimpleAsset';

    let gateway: Gateway;
    let contract: Contract;
    let org1Database: StateDatabase;
    let org1Collection: Collection;
    let worldState: Collection;
    
    before(async () => {
        const setupDetails = await setup();

        gateway = setupDetails.gateway;
        contract = setupDetails.contract;

        org1Database = new StateDatabase('localhost', '8054');
        org1Collection = await org1Database.getPrivateCollection(CHANNEL_NAME, CHAINCODE_NAME, 'org1Collection');
        worldState = await org1Database.getWorldState(CHANNEL_NAME, CHAINCODE_NAME);
    });

    after(() => {
        gateway.disconnect();
    });

    describe('Collection', () => {

        describe('.key', () => {
            let key: string;

            beforeEach(async () => {
                const transaction = contract.createTransaction('createKeyValue');
                key = uuid();

                await transaction.submit(key, '100');
            });
            
            it ('should satisfy expect when a key exists', async () => {
                await expect(worldState).to.have.key(key);
            });

            it ('should satisfy expect not when a key does not exist', async () => {
                await expect(worldState).not.to.have.key('fake key');
            });

            it ('should assert an error when expect tests a key to exist but it does not', async () => {
                try {
                    await expect(worldState).to.have.key('fake key');
                    chai.assert.fail('key() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes('Key fake key not found')) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests a key to not exist but it does', async () => {
                try {
                    await expect(worldState).not.to.have.key(key);
                    chai.assert.fail('key() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Key ${key} found`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should allow chai to handle .key() for non Collection types', () => {
                expect({a: 1}).to.have.key('a');

                try {
                    expect({a: 1}).to.have.key('b');
                } catch (err) {
                    if (!err.message.includes(`expected { a: 1 } to have key 'b'`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        });

        describe('.compositeKey', () => {

            let id: string;

            beforeEach(async () => {
                const transaction = contract.createTransaction('createSimpleAsset');
                transaction.setEndorsingOrganizations('org1Msp');
                id = uuid();

                await transaction.submit(id, '100', 'org1Collection', 'org2Collection');
            });
            
            it ('should satisfy expect when a composite key exists', async () => {
                await expect(org1Collection).to.have.compositeKey(objectType, [id]);
            });

            it ('should satisfy expect not when a composite key does not exist', async () => {
                await expect(org1Collection).not.to.have.compositeKey(objectType, ['fakeId']);
            });

            it ('should assert an error when expect tests a composite key to exist but it does not', async () => {
                try {
                    await expect(org1Collection).to.have.compositeKey(objectType, ['fakeId']);
                    chai.assert.fail('compositeKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Key ${ChaincodeStub.prototype.createCompositeKey(objectType, ['fakeId'])} not found`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests a composite key to not exist but it does', async () => {
                try {
                    await expect(org1Collection).not.to.have.compositeKey(objectType, [id]);
                    chai.assert.fail('compositeKey() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Key ${ChaincodeStub.prototype.createCompositeKey(objectType, [id])} found`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        });

        describe('.keyWithValue()', () => {
            let key: string;

            beforeEach(async () => {
                const transaction = contract.createTransaction('createKeyValue');
                key = uuid();

                await transaction.submit(key, '100');
            });

            it ('should satisfy expect when a key exists with value', async () => {
                await expect(worldState).to.have.keyWithValue(key, '100');
            });

            it ('should satisfy expect not when a key exists but not with value', async () => {
                await expect(worldState).to.not.have.keyWithValue(key, '101');
            });

            it ('should not satisfy expect not when a key does not exist', async () => {
                try {
                    await expect(worldState).to.not.have.keyWithValue('fake key', '100');
                    chai.assert.fail('keyWithValue() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Key fake key not found`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests a key to to have value but it does not', async () => {
                try {
                    await expect(worldState).to.have.keyWithValue(key, '101');
                    chai.assert.fail('keyWithValue() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Value at ${key} does not equal expected value`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests a key to not exist but it does', async () => {
                try {
                    await expect(worldState).to.not.have.keyWithValue(key, '100');
                    chai.assert.fail('keyWithValue() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Value at ${key} does equal expected value`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        });

        describe('.compositeKeyWithValue()', () => {
            let id: string;

            beforeEach(async () => {
                const transaction = contract.createTransaction('createSimpleAsset');
                transaction.setEndorsingOrganizations('org1Msp');
                id = uuid();

                await transaction.submit(id, '100', 'org1Collection', 'org2Collection');
            });

            it ('should satisfy expect when a composite key exists with value', async () => {
                await expect(org1Collection).to.have.compositeKeyWithValue(objectType, [id], {value: '100'});
            });

            it ('should satisfy expect not when a composite key exists but not with value', async () => {
                await expect(org1Collection).to.not.have.compositeKeyWithValue(objectType, [id], {value: '101'});
            });

            it ('should not satisfy expect not when a composite key does not exist', async () => {
                try {
                    await expect(org1Collection).to.not.have.compositeKeyWithValue(objectType, ['fakeId'], {value: '100'});
                    chai.assert.fail('compositeKeyWithValue() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Key ${ChaincodeStub.prototype.createCompositeKey(objectType, ['fakeId'])} not found`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests a composite key to to have value but it does not', async () => {
                try {
                    await expect(org1Collection).to.have.compositeKeyWithValue(objectType, [id], {value: '101'});
                    chai.assert.fail('compositeKeyWithValue() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Value at ${ChaincodeStub.prototype.createCompositeKey(objectType, [id])} does not equal expected value`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests a key to not have value but it does', async () => {
                try {
                    await expect(org1Collection).to.not.have.compositeKeyWithValue(objectType, [id], {value: '100'});
                    chai.assert.fail('compositeKeyWithValue() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Value at ${ChaincodeStub.prototype.createCompositeKey(objectType, [id])} does equal expected value`)) {
                        chai.assert.fail(err);
                    }
                }
            });
        });
    });

    describe('KeyValue', () => {
        describe('.value()', () => {
            let keyValue: KeyValue;
            let id: string;
            let transactionId: string;

            beforeEach(async () => {
                const transaction = contract.createTransaction('createSimpleAsset');
                transactionId = transaction.getTransactionID().getTransactionID();
                transaction.setEndorsingOrganizations('org1Msp');
                id = uuid();

                await transaction.submit(id, '100', 'org1Collection', 'org2Collection');

                keyValue = await org1Collection.get(objectType, [id]);
            });

            it ('should satisfy expect when has value', async () => {
                await expect(keyValue).to.have.value({value: '100'});
            });

            it ('should satisfy expect not when does not have value', async () => {
                await expect(keyValue).to.not.have.value({value: '101'});
            });

            it ('should assert an error when expect tests a key value to have value but it does not', async () => {
                try {
                    await expect(keyValue).to.have.value({value: '101'});
                    chai.assert.fail('value() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Value at ${keyValue.key()} does not equal expected value`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should assert an error when expect tests a key value to not have value but it does', async () => {
                try {
                    await expect(keyValue).to.not.have.value({value: '100'});
                    chai.assert.fail('value() should have asserted an error');
                } catch(err) {
                    if (!err.message.includes(`Value at ${keyValue.key()} does equal expected value`)) {
                        chai.assert.fail(err);
                    }
                }
            });

            it ('should work when chained with .key()', async () => {
                await expect(org1Collection).to.have.key(keyValue.key()).with.value({value: '100'});
            });

            it ('should work when chained with .compositeKey()', async () => {
                await expect(org1Collection).to.have.compositeKey(objectType, [id]).with.value({value: '100'});
            });
        });
    });
});