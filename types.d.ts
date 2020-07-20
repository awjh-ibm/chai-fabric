/// <reference types="chai" />

import { ChainMethods } from './src/assertions/PromiseAssertion';

export {}

declare global {
    namespace Chai {
        interface Assertion extends ChainMethods {}
    }
}