import { ChannelAssertions } from './ChannelAssertions';
import { CollectionAssertions } from '././CollectionAssertions';
import { TransactionAssertions } from './TransactionAssertions';

export function ibpAssertions(chai: Chai.ChaiStatic) {
    chai.use(ChannelAssertions);
    chai.use(CollectionAssertions);
    chai.use(TransactionAssertions);
}
