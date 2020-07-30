const languageChains = ['only', 'to', 'be', 'been', 'is', 'that', 'which', 'and', 'has', 'have', 'with', 'at', 'of', 'same', 'but', 'does'];
const methods = ['functionAndParameters', 'writeTo', 'readFrom', 'value', 'emit']; // TODO add tests to ensure all have been covered

interface LanguageChains {
    only: Chai.Assertion;
    to: Chai.Assertion;
    be: Chai.Assertion;
    been: Chai.Assertion;
    is: Chai.Assertion;
    that: Chai.Assertion;
    which: Chai.Assertion;
    and: Chai.Assertion;
    has: Chai.Assertion;
    have: Chai.Assertion;
    with: Chai.Assertion;
    at: Chai.Assertion;
    of: Chai.Assertion;
    same: Chai.Assertion;
    but: Chai.Assertion;
    does: Chai.Assertion;
}

export interface ChainMethods {
    // Collection
    compositeKey(objectType: string, attributes: string[]): PromiseAssertion;
    keyWithValue(key: string, expectedValue: any): PromiseAssertion;
    compositeKeyWithValue(objectType: string, attributes: string[], expectedValue: any): PromiseAssertion;

    // KeyValue
    value(expectedValue: any): PromiseAssertion;

    // Channel
    transaction(transactionId: string): PromiseAssertion;

    // Transaction
    only: Chai.Assertion;
    event: PromiseAssertion;
    write: Chai.Assertion;
    read: Chai.Assertion;
    worldState: PromiseAssertion;
    functionAndParameters(functionName: string, parameters: string[]): PromiseAssertion;
    writeTo(...collectionName: string[]): PromiseAssertion;
    writeToKey(key: string, ...collectionName: string[]): PromiseAssertion;
    writeToCompositeKey(objectType: string, attributes: string[], ...collectionName: string[]): PromiseAssertion;
    readFrom(...collectionName: string[]): PromiseAssertion;
    readFromKey(key: string, ...collectionName: string[]): PromiseAssertion;
    readFromCompositeKey(objectType: string, attributes: string[], ...collectionName: string[]): PromiseAssertion;
    emit(name: string, data: string): PromiseAssertion;
}

export class PromiseAssertion extends Promise<Chai.Assertion> implements LanguageChains {
    private readonly assertion: any;

    public only: Chai.Assertion;
    public to: Chai.Assertion;
    public be: Chai.Assertion;
    public been: Chai.Assertion;
    public is: Chai.Assertion;
    public that: Chai.Assertion;
    public which: Chai.Assertion;
    public and: Chai.Assertion;
    public has: Chai.Assertion;
    public have: Chai.Assertion;
    public with: Chai.Assertion;
    public at: Chai.Assertion;
    public of: Chai.Assertion;
    public same: Chai.Assertion;
    public but: Chai.Assertion;
    public does: Chai.Assertion;
    public event: Chai.Assertion;

    constructor(assertion: any, fn: any, omit: string[] = []) {
        if (!fn) {
            super(assertion);
            return;
        } else {
            super(fn);
        }

        this.assertion = assertion;

        languageChains.forEach((chain) => {
            (this as any)[chain] = assertion;
        });

        methods.forEach((method) => {
            if (!omit.includes(method)) {
                (this as any)[method] = assertion[method];
            }
        });
    }
}