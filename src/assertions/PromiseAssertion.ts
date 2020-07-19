import * as chai from 'chai';
const languageChains = ['to', 'be', 'been', 'is', 'that', 'which', 'and', 'has', 'have', 'with', 'at', 'of', 'same', 'but', 'does'];

export class PromiseAssertion<T> extends Promise<T> {
    private readonly assertion: any;

    constructor(assertion: any, fn: any) {
        if (!fn) {
            super(assertion);
            return;
        } else {
            super(fn);
        }

        this.assertion = assertion;

        languageChains.forEach((chain) => {
            (this as any)[chain] = assertion;
        })
    }

    async functionAndParameters(...args: any) {
        return await this.assertion.functionAndParameters(...args);
    }

    async writeTo(...args: any) {
        return await this.assertion.writeTo(...args);
    }

    async readFrom(...args: any) {
        return await this.assertion.readFrom(...args);
    }
}