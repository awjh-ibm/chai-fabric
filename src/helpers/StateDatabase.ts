import { Collection, ICollection } from './Collection';
import nano = require('nano');

export class StateDatabase {

    private db: nano.DatabaseScope; 
    private collections: Map<string, Collection>;

    constructor(url: string, port: string, login?: {username: string, password: string}) {
        let connectionPath = url + ':' + port;
        let connectionType = 'http';

        if (login) {
            connectionPath = login.username + ':' + login.password + '@' + connectionPath;
            connectionType = 'https'
        }

        connectionPath = connectionType + '://' + connectionPath;

        this.db = nano(connectionPath).db;
        this.collections = new Map<string, Collection>();
    }

    public async getPrivateCollection(channel: string, chaincode: string, collectionName: string): Promise<ICollection> {
        const mapCollectionName = channel + chaincode + collectionName;

        if (this.collections.has(mapCollectionName)) {
            return this.collections.get(mapCollectionName);
        }

        const stateCollectionName = await this.getCollectionName(channel, chaincode, collectionName);
        const collection = new Collection(this.db, stateCollectionName);

        this.collections.set(mapCollectionName, collection);

        return collection;
    }

    public async getWorldState(channel: string, chaincode: string): Promise<Collection> {
        const mapCollectionName = channel + chaincode;

        if (this.collections.has(mapCollectionName)) {
            return this.collections.get(mapCollectionName);
        }

        const stateCollectionName = await this.getCollectionName(channel, chaincode);
        const collection = new Collection(this.db, stateCollectionName);

        this.collections.set(mapCollectionName, collection);

        return collection;
    }

    private async getCollectionName(channel: string, chaincode: string, collectionName?: string): Promise<string> {
        const names = await this.db.list();

        let formattedCollectionName = `${channel}_${chaincode}`;

        if (collectionName) {
            formattedCollectionName += '$$p' + collectionName.split('').map((char: string) => isUpperCase(char) ? '$' + char.toLowerCase() : char).join('');
        }

        const exists = names.find((name) => {
            return name === formattedCollectionName;
        });

        if (!exists) {
            throw new Error(`Collection with name ${collectionName} does not exist in state database for chaincode ${chaincode} in channel ${channel}`);
        }

        return exists;
    }
}

function isUpperCase(char: string): boolean {
    return char.toUpperCase() === char && char.toLowerCase() !== char;
}