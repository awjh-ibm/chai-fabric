export interface ITransaction {
    readonly transactionId: string;
    readonly channelName: string;
    readonly chaincodeName: string;
    readonly functionName: string;
    readonly parameters: string[];

    writesTo(collection: string): boolean;
    readsFrom(collection: string): boolean;
}

export class Transaction implements ITransaction {
    private readonly privateWrites: string[];
    private readonly privateReads: string[];
    
    public readonly transactionId: string;
    public readonly channelName: string;
    public readonly chaincodeName: string;
    public readonly functionName: string;
    public readonly parameters: string[];

    public constructor(transactionId: string, channelName: string, chaincodeName: string, functionName: string, parameters: string[], privateWrites: string[], privateReads: string[]) {
        this.transactionId = transactionId;
        this.chaincodeName = chaincodeName;
        this.functionName = functionName;
        this.parameters = parameters;

        this.privateWrites = privateWrites;
        this.privateReads = privateReads;
    }

    public writesTo(collection: string): boolean {
        return this.privateWrites.includes(collection);
    }

    public readsFrom(collection: string): boolean {
        return this.privateReads.includes(collection);
    }
}