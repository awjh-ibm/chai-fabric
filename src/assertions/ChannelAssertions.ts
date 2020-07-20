import { Channel } from '../helpers/Channel';
import { PromiseAssertion } from './PromiseAssertion';
import { ASSERTION_FAILED, WAIT_FOR_FLAG } from './utils';

class ChannelAssertionMethods {
    private chai: Chai.ChaiStatic;

    constructor(chai: Chai.ChaiStatic) {
        this.chai = chai;
    }

    public async hasTransaction(channel: Channel, transactionId: string, not: boolean) {
        this.chai.assert.equal(!not, await channel.exists(transactionId), `Transaction ${transactionId}${not ? '' : ' not'} found`);
    }
}

export const ChannelAssertions = (chai: Chai.ChaiStatic): void => {
    const channelAssertionMethods = new ChannelAssertionMethods(chai);

    chai.Assertion.addChainableMethod('transaction', function (transactionId: string) {
        return new PromiseAssertion(this, async (resolve: (msg?: any) => void, reject: (msg?: string) => void) => {
            try {
                await channelAssertionMethods.hasTransaction(this._obj, transactionId, chai.util.flag(this, 'negate'));
                chai.util.flag(this, 'transaction', transactionId);
            } catch (err) {
                chai.util.flag(this, 'transaction', ASSERTION_FAILED);
                reject(err);
            };

            resolve(this);
        })
    }, function () {
        chai.util.flag(this, 'transaction', WAIT_FOR_FLAG);
    });
}

