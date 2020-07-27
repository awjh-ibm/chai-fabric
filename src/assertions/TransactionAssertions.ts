import { Transaction } from '../helpers/Transaction';
import { PromiseAssertion } from './PromiseAssertion';
import { getObject } from './utils';

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

        this.chai.assert[assertionMethod](transaction.numberOfWrites(), collectionNames.length, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} write only to collections`);
    }

    public writesTo(transaction: Transaction, collectionNames: string[], not: boolean) {
        for (const collectionName of collectionNames) {
            this.chai.assert.equal(!not, transaction.writesTo(collectionName), `Transaction ${transaction.transactionId} does${not ? '' : ' not'} write to collection`);
        }
    }

    public readsFromOnly(transaction: Transaction, collectionNames: string[], not: boolean) {
        this.writesTo(transaction, collectionNames, not);

        const assertionMethod: keyof Chai.AssertStatic = not ? 'notEqual' : 'equal';

        this.chai.assert[assertionMethod](transaction.numberOfReads(), collectionNames.length, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} read only from collections`);
    }

    public readsFrom(transaction: Transaction, collectionNames: string[], not: boolean) {
        for (const collectionName of collectionNames) {
            this.chai.assert.equal(!not, transaction.readsFrom(collectionName), `Transaction ${transaction.transactionId} does${not ? '' : ' not'} read from collection`);
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
}

export const TransactionAssertions = (chai: Chai.ChaiStatic): void => {
    const transactionAssertionMethods = new TransactionAssertionMethods(chai);

    chai.Assertion.addProperty('only', function () { 
        chai.util.flag(this, 'only', true);
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

    chai.Assertion.addProperty('event', async function () {
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
