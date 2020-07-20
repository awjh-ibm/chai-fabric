import { Transaction } from '../helpers/Transaction';
import { PromiseAssertion } from './PromiseAssertion';
import { getObject } from './utils';

class TransactionAssertionMethods {
    private chai: Chai.ChaiStatic;

    constructor(chai: Chai.ChaiStatic) {
        this.chai = chai;
    }

    public async hasFunction(transaction: Transaction, functionName: string, not: boolean) {
        const assertionMethod: keyof Chai.AssertStatic = not ? 'notEqual' : 'equal';
        
        this.chai.assert[assertionMethod](transaction.functionName, functionName, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} have function`);
    }

    public async hasParameters(transaction: Transaction, parameters: string[], not: boolean) {
        const assertionMethod: keyof Chai.AssertStatic = not ? 'notDeepEqual' : 'deepEqual';
        
        this.chai.assert[assertionMethod](transaction.parameters, parameters, `Transaction ${transaction.transactionId} does${not ? '' : ' not'} have parameters`);
    }

    public async writesTo(transaction: Transaction, collectionName: string, not: boolean) {
        this.chai.assert.equal(!not, transaction.writesTo(collectionName), `Transaction ${transaction.transactionId} does${not ? '' : ' not'} write to collection`);
    }

    public async readsFrom(transaction: Transaction, collectionName: string, not: boolean) {
        this.chai.assert.equal(!not, transaction.readsFrom(collectionName), `Transaction ${transaction.transactionId} does${not ? '' : ' not'} read from collection`);
    }
}

export const TransactionAssertions = (chai: Chai.ChaiStatic): void => {
    const transactionAssertionMethods = new TransactionAssertionMethods(chai);

    chai.Assertion.addChainableMethod('functionAndParameters', function (functionName: string, parameters: string[]) {      
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const transaction = await getObject<Transaction>(this, chai, 'transaction');

                await transactionAssertionMethods.hasFunction(transaction, functionName, chai.util.flag(this, 'negate'));                
                await transactionAssertionMethods.hasParameters(transaction, parameters, chai.util.flag(this, 'negate'));
            } catch (err) {
                reject(err);
            }

            resolve(this);
        });
    });

    chai.Assertion.addChainableMethod('writeTo', async function (collectionName: string) {
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const transaction = await getObject<Transaction>(this, chai, 'transaction');

                await transactionAssertionMethods.writesTo(transaction, collectionName, chai.util.flag(this, 'negate'));
            } catch(err) {
                reject(err);
            }

            resolve(this);
        });
    });

    chai.Assertion.addChainableMethod('readFrom', async function (collectionName: string) {
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const transaction = await getObject<Transaction>(this, chai, 'transaction');

                await transactionAssertionMethods.readsFrom(transaction, collectionName, chai.util.flag(this, 'negate'));
            } catch(err) {
                reject(err);
            }

            resolve(this);
        });
    });
}
