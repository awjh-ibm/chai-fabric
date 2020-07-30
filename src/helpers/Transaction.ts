import * as crypto from 'crypto';

export interface ITransaction {
    readonly transactionId: string;
    readonly channelName: string;
    readonly chaincodeName: string;
    readonly functionName: string;
    readonly parameters: string[];

    collectionsWrittenTo(): number;
    writesTo(collection: string): boolean;
    writesToKey(key: string, collection: string): boolean;
    keysWrittenTo(collection: string): number;
    collectionsReadFrom(): number;
    readsFrom(collection: string): boolean;
    readsFromKey(key: string, collection: string): boolean;
    keysReadFrom(collection: string): number;
}

export interface KeyValueHash {
    keyHash: string;
    valueHash: string;
}

export interface PrivateWriteSet {
    collection: string;
    keyValueHashes: KeyValueHash[]
}

export interface PrivateReadSet {
    collection: string;
    keyHashes: string[]
}

export class Transaction implements ITransaction {
    private readonly publicWrites: KeyValueHash[];
    private readonly publicReads: string[]

    private readonly privateWrites: PrivateWriteSet[];
    private readonly privateReads: PrivateReadSet[];
    
    public readonly transactionId: string;
    public readonly channelName: string;
    public readonly chaincodeName: string;
    public readonly functionName: string;
    public readonly parameters: string[];
    public readonly event: {name: string, data: string};

    public constructor(transactionId: string, channelName: string, chaincodeName: string, functionName: string, parameters: string[], privateWrites: PrivateWriteSet[], privateReads: PrivateReadSet[], event: {name: string, data: string}) {
        this.transactionId = transactionId;
        this.channelName = channelName;
        this.chaincodeName = chaincodeName;
        this.functionName = functionName;
        this.parameters = parameters;

        this.privateWrites = privateWrites;
        this.privateReads = privateReads;

        this.event = event;
    }

    public collectionsWrittenTo(): number {
        return this.privateWrites.length;
    }

    public writesTo(collection: string): boolean {
        try {
            this.getWrites(collection);
            return true;
        } catch (err) {
            return false;
        }
    }

    public writesToKey(key: string, collection: string): boolean {
        const keyHash = crypto.createHash('sha256').update(key).digest('hex');

        if (this.getWrites(collection).find((keyValueHash) => keyValueHash.keyHash === keyHash)) {
            return true;
        }

        return false;
    }

    public keysWrittenTo(collection: string): number {
        return this.getWrites(collection).length;
    }

    public collectionsReadFrom(): number {
        return this.privateReads.length;
    }

    public readsFrom(collection: string): boolean {
        try {
            this.getReads(collection);
            return true;
        } catch (err) {
            return false;
        }
    }

    public readsFromKey(key: string, collection: string): boolean {
        const passedKeyHash = crypto.createHash('sha256').update(key).digest('hex');

        if (this.getReads(collection).find((keyHash) => passedKeyHash === keyHash)) {
            return true;
        }

        return false;
    }

    public keysReadFrom(collection: string): number {
        return this.getReads(collection).length;
    }

    private getWrites(collection: string): KeyValueHash[] {
        const found = this.privateWrites.find((privateWrite) => privateWrite.collection === collection).keyValueHashes;

        if (!found) {
            throw new Error('Collection not written to');
        }

        return found;
    }

    private getReads(collection: string): string[] {
        const found = this.privateReads.find((privateRead) => privateRead.collection === collection).keyHashes;

        if (!found) {
            throw new Error('Collection not read from');
        }

        return found;
    }
}