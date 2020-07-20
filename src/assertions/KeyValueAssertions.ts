import { KeyValue } from '../helpers/KeyValue';
import { PromiseAssertion } from './PromiseAssertion';
import { getObject } from './utils';

export class KeyValueAssertionMethods {
    private chai: Chai.ChaiStatic;

    constructor(chai: Chai.ChaiStatic) {
        this.chai = chai;
    }

    public hasValue(key: KeyValue, expectedValue: any, not: boolean) {
        const assertionMethod: keyof Chai.AssertStatic = not ? 'notDeepEqual' : 'deepEqual';

        this.chai.assert[assertionMethod](key.value(), expectedValue, `Value at ${key.key()} does${not ? '' : ' not'} equal expected value`);
    }
}

export const KeyValueAssertions = (chai: Chai.ChaiStatic): void => {
    const keyValueAssertionMethods = new KeyValueAssertionMethods(chai);

    chai.Assertion.addChainableMethod('value', function (functionName: string, parameters: string[]) {      
        
        return new PromiseAssertion(this, async (resolve: any, reject: any) => {
            try {
                const keyValue = await getObject<KeyValue>(this, chai, 'key');keyValue

                keyValueAssertionMethods.hasValue(keyValue, functionName, chai.util.flag(this, 'negate'));                
            } catch (err) {
                reject(err);
            }

            resolve(this);
        });
    });

}