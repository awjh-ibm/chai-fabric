import { Transaction } from '../helpers/Transaction';
import { PromiseAssertion } from './PromiseAssertion';
import { getObject } from './utils';
import { ChaincodeStub } from 'fabric-shim';

class TransactionAssertionMethods {
    private chai: Chai.ChaiStatic;

    constructor(chai: Chai.ChaiStatic) {
        this.chai = chai;
    }

    public hasFunction(transaction: Transaction, functionName: string, not: boolean) {
        const assertionMethod: keyof Chai.AssertStatic = not ? 'notEqual' : 'equal';
        
        this.chai.assert[assertionMethod](transaction.functionName, functionName, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} have function`);
    }

    public hasParameters(transaction: Transaction, parameters: string[], not: boolean) {
        const assertionMethod: keyof Chai.AssertStatic = not ? 'notDeepEqual' : 'deepEqual';
        
        this.chai.assert[assertionMethod](transaction.parameters, parameters, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} have parameters`);
    }

    public writesToOnly(transaction: Transaction, collectionNames: string[], not: boolean) {
        this.writesTo(transaction, collectionNames, not);

        const assertionMethod: keyof Chai.AssertStatic = not ? 'notEqual' : 'equal';

        this.chai.assert[assertionMethod](transaction.collectionsWrittenTo(), collectionNames.length, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} write only to collections`);
    }

    public writesTo(transaction: Transaction, collectionNames: string[], not: boolean) {
        for (const collectionName of collectionNames) {
            this.chai.assert.equal(!not, transaction.writesTo(collectionName), `Transaction ${transaction.transactionId} does${not ? '' : ' not'} write to collection`);
        }
    }

    public writesToKeyOnly(transaction: Transaction, key: string, collectionNames: string[], not: boolean) {
        this.writesToKey(transaction, key, collectionNames, not);

        const assertionMethod: keyof Chai.AssertStatic = not ? 'notEqual' : 'equal';

        for (const collectionName of collectionNames) {
            this.chai.assert[assertionMethod](transaction.keysWrittenTo(collectionName), 1, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} write only to key in collection ${collectionName}`);
        }
    }

    public writesToKey(transaction: Transaction, key: string, collectionNames: string[], not: boolean) {
        if(collectionNames.length === 0) {
            collectionNames = [null];
        }

        for (const collectionName of collectionNames) {
            if (not) {
                if (!transaction.writesTo(collectionName)) {
                    return;
                }
            } else if (collectionName) {
                this.writesTo(transaction, [collectionName], false);
            }

            this.chai.assert.equal(!not, transaction.writesToKey(key, collectionName), `Transaction ${transaction.transactionId} does${not ? '' : ' not'} write to key in ${collectionName ? collectionName : 'world state'}`);
        }
    }

    public readsFromOnly(transaction: Transaction, collectionNames: string[], not: boolean) {
        this.readsFrom(transaction, collectionNames, not);

        const assertionMethod: keyof Chai.AssertStatic = not ? 'notEqual' : 'equal';

        this.chai.assert[assertionMethod](transaction.collectionsReadFrom(), collectionNames.length, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} read only from collections`);
    }

    public readsFrom(transaction: Transaction, collectionNames: string[], not: boolean) {
        for (const collectionName of collectionNames) {
            this.chai.assert.equal(!not, transaction.readsFrom(collectionName), `Transaction ${transaction.transactionId} does${not ? '' : ' not'} read from collection`);
        }
    }

    public readsFromKeyOnly(transaction: Transaction, key: string, collectionNames: string[], not: boolean) {
        this.readsFromKey(transaction, key, collectionNames, not);

        const assertionMethod: keyof Chai.AssertStatic = not ? 'notEqual' : 'equal';

        for (const collectionName of collectionNames) {
            this.chai.assert[assertionMethod](transaction.keysReadFrom(collectionName), 1, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} read only from key in collection ${collectionName}`);
        }
    }

    public readsFromKey(transaction: Transaction, key: string, collectionNames: string[], not: boolean) {
        for (const collectionName of collectionNames) {
            if (not) {
                if (!transaction.readsFrom(collectionName)) {
                    return;
                }
            } else {
                this.readsFrom(transaction, [collectionName], false);
            }

            this.chai.assert.equal(!not, transaction.readsFromKey(key, collectionName), `Transaction ${transaction.transactionId} does${not ? '' : ' not'} read from key in collection`);
        }
    }


    public emits(transaction: Transaction, name: string, data: string, not: boolean) {
        this.emitsAnything(transaction, not);

        const assertionMethod: keyof Chai.AssertStatic = not ? 'notEqual' : 'equal';

        if (not && transaction.event === null) {
            return;
        }

        this.chai.assert[assertionMethod](transaction.event.name, name, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} emit event with name`);
        this.chai.assert[assertionMethod](transaction.event.data, data, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} emit event with data`);
    }

    public emitsAnything(transaction: Transaction, not: boolean) {
        const assertionMethod: keyof Chai.AssertStatic = not ? 'isNull' : 'isNotNull';

        this.chai.assert[assertionMethod](transaction.event, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} emit event`);
    }

    public writeToWorldState(transaction: Transaction, not: boolean) {
        const assertionMethod: keyof Chai.AssertStatic = not ? 'equal' : 'notEqual';

        this.chai.assert[assertionMethod](transaction.keysWrittenTo(), 0, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} write to world state`)
    }

    public readFromWorldState(transaction: Transaction, not: boolean) {
        const assertionMethod: keyof Chai.AssertStatic = not ? 'equal' : 'notEqual';

        this.chai.assert[assertionMethod](transaction.keysReadFrom(), 0, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} read from world state`)
    }
}

export const TransactionAssertions = (chai: Chai.ChaiStatic): void => {
    const transactionAssertionMethods = new TransactionAssertionMethods(chai);

    chai.Assertion.addProperty('only', function () { 
        chai.util.flag(this, 'only', true);
    });

    chai.Assertion.addProperty('write', function () { 
        chai.util.flag(this, 'write', true);
    });

    chai.Assertion.addProperty('read', function () { 
        chai.util.flag(this, 'read', true);
    });

    chai.Assertion.addProperty('worldState', function () {
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const transaction = await getObject<Transaction>(this, chai, 'transaction');

                if (chai.util.flag(this, 'write')) {
                    transactionAssertionMethods.writeToWorldState(transaction, chai.util.flag(this, 'negate'));
                } else if (chai.util.flag(this, 'read')) {
                    transactionAssertionMethods.readFromWorldState(transaction, chai.util.flag(this, 'negate'));
                } else {
                    throw new Error('Read/write not specified');
                }

            } catch (err) {
                reject(err);
            }

            resolve(this);
        });
    });

    chai.Assertion.addChainableMethod('functionAndParameters', function (functionName: string, parameters: string[]) {      
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const transaction = await getObject<Transaction>(this, chai, 'transaction');

                transactionAssertionMethods.hasFunction(transaction, functionName, chai.util.flag(this, 'negate'));                
                transactionAssertionMethods.hasParameters(transaction, parameters, chai.util.flag(this, 'negate'));
            } catch (err) {
                reject(err);
            }

            resolve(this);
        });
    });

    chai.Assertion.addChainableMethod('writeTo', async function (...collectionNames: string[]) {
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const transaction = await getObject<Transaction>(this, chai, 'transaction');

                if (chai.util.flag(this, 'only')) {
                    transactionAssertionMethods.writesToOnly(transaction, collectionNames, chai.util.flag(this, 'negate'));
                } else {
                    transactionAssertionMethods.writesTo(transaction, collectionNames, chai.util.flag(this, 'negate'));
                }

            } catch(err) {
                reject(err);
            }

            resolve(this);
        });
    });

    chai.Assertion.addChainableMethod('writeToKey', async function (key: string, ...collectionNames: string[]) {
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const transaction = await getObject<Transaction>(this, chai, 'transaction');

                if (chai.util.flag(this, 'only')) {
                    transactionAssertionMethods.writesToKeyOnly(transaction, key, collectionNames, chai.util.flag(this, 'negate'));
                } else {
                    transactionAssertionMethods.writesToKey(transaction, key, collectionNames, chai.util.flag(this, 'negate'));
                }

            } catch(err) {
                reject(err);
            }

            resolve(this);
        });
    });

    chai.Assertion.addChainableMethod('writeToCompositeKey', async function (objectType: string, attributes: string[], ...collectionNames: string[]) {
        const key = ChaincodeStub.prototype.createCompositeKey(objectType, attributes);

        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const transaction = await getObject<Transaction>(this, chai, 'transaction');

                if (chai.util.flag(this, 'only')) {
                    transactionAssertionMethods.writesToKeyOnly(transaction, key, collectionNames, chai.util.flag(this, 'negate'));
                } else {
                    transactionAssertionMethods.writesToKey(transaction, key, collectionNames, chai.util.flag(this, 'negate'));
                }

            } catch(err) {
                reject(err);
            }

            resolve(this);
        });
    });

    chai.Assertion.addChainableMethod('readFrom', async function (...collectionNames: string[]) {
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const transaction = await getObject<Transaction>(this, chai, 'transaction');

                if (chai.util.flag(this, 'only')) {
                    transactionAssertionMethods.readsFromOnly(transaction, collectionNames, chai.util.flag(this, 'negate'));
                } else {
                    transactionAssertionMethods.readsFrom(transaction, collectionNames, chai.util.flag(this, 'negate'));
                }
            } catch(err) {
                reject(err);
            }

            resolve(this);
        });
    });

    chai.Assertion.addChainableMethod('readFromKey', async function (key: string, ...collectionNames: string[]) {
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const transaction = await getObject<Transaction>(this, chai, 'transaction');

                if (chai.util.flag(this, 'only')) {
                    transactionAssertionMethods.readsFromKeyOnly(transaction, key, collectionNames, chai.util.flag(this, 'negate'));
                } else {
                    transactionAssertionMethods.readsFromKey(transaction, key, collectionNames, chai.util.flag(this, 'negate'));
                }

            } catch(err) {
                reject(err);
            }

            resolve(this);
        });
    });

    chai.Assertion.addChainableMethod('readFromCompositeKey', async function (objectType: string, attributes: string[], ...collectionNames: string[]) {
        const key = ChaincodeStub.prototype.createCompositeKey(objectType, attributes);

        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const transaction = await getObject<Transaction>(this, chai, 'transaction');

                if (chai.util.flag(this, 'only')) {
                    transactionAssertionMethods.readsFromKeyOnly(transaction, key, collectionNames, chai.util.flag(this, 'negate'));
                } else {
                    transactionAssertionMethods.readsFromKey(transaction, key, collectionNames, chai.util.flag(this, 'negate'));
                }

            } catch(err) {
                reject(err);
            }

            resolve(this);
        });
    });

    chai.Assertion.addChainableMethod('emit', async function (name: string, data: string) {
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const transaction = await getObject<Transaction>(this, chai, 'transaction');
                transactionAssertionMethods.emits(transaction, name, data, chai.util.flag(this, 'negate'));
            } catch (err) {
                reject(err);
            }

            resolve(this);
        });
    });

    chai.Assertion.addProperty('event', function () {
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const transaction = await getObject<Transaction>(this, chai, 'transaction');
                transactionAssertionMethods.emitsAnything(transaction, chai.util.flag(this, 'negate'));
            } catch (err) {
                reject(err);
            }

            resolve(this);
        });
    });
}
