import { ChannelAssertions } from './ChannelAssertions';
import { CollectionAssertions } from '././CollectionAssertions';
import { KeyValueAssertions } from '././KeyValueAssertions';
import { TransactionAssertions } from './TransactionAssertions';

export function ibpAssertions(chai: Chai.ChaiStatic) {
    chai.use(ChannelAssertions);
    chai.use(CollectionAssertions);
    chai.use(KeyValueAssertions);
    chai.use(TransactionAssertions);
}
