import { Channel as FabricChannel } from 'fabric-client';
import { Gateway } from 'fabric-network';
import { ITransaction, Transaction } from './Transaction';

export class Channel {
    private readonly gateway: Gateway;
    private readonly channelName: string;
    private channel: FabricChannel;

    public constructor(gateway: Gateway, channelName: string) {
        this.gateway = gateway;
        this.channelName = channelName;
    }

    public async exists(transactionId: string): Promise<boolean> {
        try {
            await this.get(transactionId);
            return true;
        } catch (err) {
            return false;
        }
    }

    public async get(transactionId: string): Promise<ITransaction> {
        if (!this.channel) {
            this.channel = (await this.gateway.getNetwork(this.channelName)).getChannel();
        }

        const block = await this.channel.queryBlockByTxID(transactionId);

        const transaction = block.data.data.find((blockTransaction) => {
            return blockTransaction.payload.header.channel_header.tx_id === transactionId;
        });

        const channelHeader = transaction.payload.header.channel_header;
        const payload = transaction.payload.data.actions[0].payload;
        const action = payload.action;
        const chaincodeSpec = payload.chaincode_proposal_payload.input.chaincode_spec;
        const chaincodeName = chaincodeSpec.chaincode_id.name;

        const args = chaincodeSpec.input.args.map((arg: Buffer) => {
            return arg.toString();
        });

        const extension = action.proposal_response_payload.extension;

        const rwSet = extension.results.ns_rwset.find((_rwSet: {namespace: string}) => {
            return _rwSet.namespace === chaincodeName;
        });

        let privateWrites: string[];
        let privateReads: string[];

        if (rwSet) {
            const privateRwSet = rwSet.collection_hashed_rwset;

            privateWrites = privateRwSet.filter((collectionRwSet: any) => collectionRwSet.hashed_rwset.hashed_writes.length > 0)
                                                        .map((collectionRwSet: any) => collectionRwSet.collection_name);
            privateReads = privateRwSet.filter((collectionRwSet: any) => collectionRwSet.hashed_rwset.hashed_reads.length > 0)
                                                       .map((collectionRwSet: any) => collectionRwSet.collection_name);
        }

        const txEvents = extension.events;

        let events: {name: string, data: string} = null;

        if (txEvents && txEvents.chaincode_id !== '') {
            events = {
                name: txEvents.event_name,
                data: txEvents.payload.toString()
            };
        }

        return new Transaction(transactionId, channelHeader.channel_id, chaincodeName, args[0], args.slice(1), privateWrites, privateReads, events);
    }
}