import { Collection } from '../helpers/Collection';
import { ChaincodeStub } from 'fabric-shim';
import { PromiseAssertion } from './PromiseAssertion';
import { KeyValueAssertionMethods } from './KeyValueAssertions'
import { ASSERTION_FAILED, WAIT_FOR_FLAG } from './utils';

class CollectionAssertionMethods {
    private chai: Chai.ChaiStatic;

    constructor(chai: Chai.ChaiStatic) {
        this.chai = chai;
    }

    public async hasKey(collection: Collection, key: string, not: boolean) {
        this.chai.assert.equal(!not, await collection.exists(key), `Key ${key}${not ? '' : ' not'} found`);
    }

    public async hasValue(collection: Collection, key: string, expectedValue: any, not: boolean) {
        const keyValue = await collection.get(key);

        const keyAssertionMethods = new KeyValueAssertionMethods(this.chai);

        keyAssertionMethods.hasValue(keyValue, expectedValue, not);
    }
}

export const CollectionAssertions = (chai: Chai.ChaiStatic): void => {
    const collectionAssertionMethods = new CollectionAssertionMethods(chai);

    chai.Assertion.overwriteMethod('key', function (_super) {
        return function (key: string): PromiseAssertion {
            const obj = chai.util.flag(this, 'object');

            if (obj instanceof Collection) {
                chai.util.flag(this, 'key', WAIT_FOR_FLAG);

                return new PromiseAssertion(this, async (resolve: any, reject: any) => {
                    try {
                        await collectionAssertionMethods.hasKey(this._obj, key, chai.util.flag(this, 'negate'));
                        chai.util.flag(this, 'key', key);
                    } catch (err) {
                        reject(err)
                        chai.util.flag(this, 'key', ASSERTION_FAILED);
                    }

                    resolve(this);
                });
            }

            _super.apply(this, arguments);
        }
    });

    chai.Assertion.addChainableMethod('compositeKey', function (objectType: string, attributes: string[]) {
        const key = ChaincodeStub.prototype.createCompositeKey(objectType, attributes);
        
        return new PromiseAssertion(this, async (resolve: (msg?: any) => void, reject: (msg?: string) => void) => {
            try {
                await collectionAssertionMethods.hasKey(this._obj, key, chai.util.flag(this, 'negate'));
                chai.util.flag(this, 'key', key);
            } catch (err) {
                chai.util.flag(this, 'key', ASSERTION_FAILED);
                reject(err);
            };

            resolve(this);
        })
    }, function () {
        chai.util.flag(this, 'key', WAIT_FOR_FLAG);
    });

    chai.Assertion.addMethod('keyWithValue', async function (key: string, expectedValue: any) {
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                await collectionAssertionMethods.hasKey(this._obj, key, false);
                await collectionAssertionMethods.hasValue(this._obj, key, expectedValue, chai.util.flag(this, 'negate'));        
            } catch (err) {
                reject(err);
            }

            resolve();
        });
    });

    chai.Assertion.addMethod('compositeKeyWithValue', async function (objectType: string, attributes: string[], expectedValue: any) {
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const key = ChaincodeStub.prototype.createCompositeKey(objectType, attributes);
        
                await collectionAssertionMethods.hasKey(this._obj, key, false);
                await collectionAssertionMethods.hasValue(this._obj, key, expectedValue, chai.util.flag(this, 'negate'));
            } catch (err) {
                reject(err);
            }

            resolve();
        });
    });
}