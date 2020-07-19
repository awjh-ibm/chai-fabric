import { Collection } from '../helpers/Collection';
import { ChaincodeStub } from 'fabric-shim';
import { PromiseAssertion } from './PromiseAssertion';

class CollectionAssertionMethods {
    private chai: Chai.ChaiStatic;

    constructor(chai: Chai.ChaiStatic) {
        this.chai = chai;
    }

    public async hasKey(collection: Collection, key: string, not: boolean) {
        this.chai.assert.equal(!not, await collection.exists(key), `Key ${key}${not ? '' : ' not'} found`);
    }

    public async hasValue(collection: Collection, key: string, expectedValue: string, not: boolean) {
        const actualValue = await collection.get(key);

        const assertionMethod: keyof Chai.AssertStatic = not ? 'notDeepEqual' : 'deepEqual';

        this.chai.assert[assertionMethod](actualValue, expectedValue, `Value at ${key} does${not ? '' : ' not'} equal expected value`);
    }
}

export const CollectionAssertions = (chai: Chai.ChaiStatic): void => {
    const collectionAssertionMethods = new CollectionAssertionMethods(chai);

    chai.Assertion.overwriteMethod('key', function (_super) {
        return function (key: string): Promise<void> {
            const obj = chai.util.flag(this, 'object');

            if (obj instanceof Collection) {
                return new PromiseAssertion(this, async (resolve: any, reject: any) => {
                    try {
                        await collectionAssertionMethods.hasKey(this._obj, key, chai.util.flag(this, 'negate'));
                    } catch (err) {
                        reject(err)
                    }

                    resolve();
                });
            }

            _super.apply(this, arguments);
        }
    });

    chai.Assertion.addMethod('compositeKey', function (objectType: string, attributes: string[]) {
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                await collectionAssertionMethods.hasKey(this._obj, ChaincodeStub.prototype.createCompositeKey(objectType, attributes), chai.util.flag(this, 'negate'));
            } catch (err) {
                reject(err);
            }
            
            resolve();
        });      
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
