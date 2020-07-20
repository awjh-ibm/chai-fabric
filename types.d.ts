/// <reference types="chai" />

export {}

declare global {
    namespace Chai {
        interface Assertion {
            // Collection
            compositeKey(objectType: string, attributes: string[]): Assertion;
            keyWithValue(key: string, expectedValue: any): Assertion;
            compositeKeyWithValue(objectType: string, attributes: string[], expectedValue: any): Assertion;

            // KeyValue
            value(expectedValue: any): Assertion;

            // Channel
            transaction(transactionId: string): Assertion;
            boo(transactionId: string): Assertion;

            // Transaction
            functionAndParameters(functionName: string, parameters: string[]): Assertion;
            writeTo(collectionName: string): Assertion;
            readFrom(collectionName: string): Assertion;
        }
    }
}