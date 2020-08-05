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

export interface KeyValue {
    key: string;
    value: string;
}

export interface KeyValueHash {
    keyHash: string;
    valueHash: string;
}

export interface PrivateWriteSet {
    collection: string;
    keyValueHashes: KeyValueHash[];
}

export interface PrivateReadSet {
    collection: string;
    keyHashes: string[];
}

export interface Response {
    status: number;
    message: string;
    payload: string;
}

export class Transaction implements ITransaction {
    private readonly publicWrites: KeyValue[];
    private readonly publicReads: string[]

    private readonly privateWrites: PrivateWriteSet[];
    private readonly privateReads: PrivateReadSet[];
    
    public readonly transactionId: string;
    public readonly channelName: string;
    public readonly chaincodeName: string;
    public readonly functionName: string;
    public readonly parameters: string[];
    public readonly event: {name: string, data: string};
    public readonly response: Response;

    public constructor(transactionId: string, channelName: string, chaincodeName: string, functionName: string, parameters: string[], publicWrites: KeyValue[], publicReads: string[], privateWrites: PrivateWriteSet[], privateReads: PrivateReadSet[], event: {name: string, data: string}, response: Response) {
        this.transactionId = transactionId;
        this.channelName = channelName;
        this.chaincodeName = chaincodeName;
        this.functionName = functionName;
        this.parameters = parameters;

        
        this.publicWrites = publicWrites;
        this.publicReads = publicReads;
        this.privateWrites = privateWrites;
        this.privateReads = privateReads;

        this.response = response;

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

    public writesToKey(key: string, collection?: string): boolean {
        if (collection) {
            const keyHash = crypto.createHash('sha256').update(key).digest('hex');
            return this.getWrites(collection).some((keyValueHash) => keyValueHash.keyHash === keyHash);
        }

        return this.publicWrites.some((keyValue) => keyValue.key === key);
    }

    public keysWrittenTo(collection?: string): number {
        if (collection) {
            return this.getWrites(collection).length;
        }

        return this.publicWrites.length;
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

    public readsFromKey(key: string, collection?: string): boolean {
        if (collection) {
            const passedKeyHash = crypto.createHash('sha256').update(key).digest('hex');
            return this.getReads(collection).some((keyHash) => keyHash === passedKeyHash);
        }

        return this.publicReads.some((readKey) => readKey === key);
    }

    public keysReadFrom(collection?: string): number {
        if (collection) {
            return this.getReads(collection).length;
        }

        return this.publicReads.length;
    }

    public isSuccessful(): boolean {
        return this.response.status === 200;
    }

    public getStatus(): number {
        return this.response.status;
    }

    public getMessage(): string {
        return this.response.message;
    }

    public getPayload(): string {
        return this.response.payload;
    }

    private getWrites(collection: string): KeyValueHash[] {
        const found = this.privateWrites.find((privateWrite) => privateWrite.collection === collection);

        if (!found) {
            throw new Error('Collection not written to');
        }

        return found.keyValueHashes;;
    }

    private getReads(collection: string): string[] {
        const found = this.privateReads.find((privateRead) => privateRead.collection === collection);

        if (!found) {
            throw new Error('Collection not read from');
        }

        return found.keyHashes;
    }
}