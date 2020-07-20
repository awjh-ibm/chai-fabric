import * as nano from 'nano';
import { ChaincodeStub } from 'fabric-shim';
import { KeyValue } from './KeyValue';

export interface ICollection {
    exists(key: string): Promise<boolean>;
    exists(objectType: string, attributes: string[]): Promise<boolean>;
    get(key: string): Promise<KeyValue>;
    get(objectType: string, attributes: string[]): Promise<KeyValue>;
}

export class Collection implements ICollection {
    private collection: nano.DocumentScope<unknown>;
    private name: string;
      
    public constructor(db: nano.DatabaseScope, name: string) {
        this.name = name;
        this.collection = db.use(this.name);
    }

    public async exists(key: string): Promise<boolean>;
    public async exists(objectType: string, attributes: string[]): Promise<boolean>;
    public async exists(keyOrObjectType: any, attributes?: any): Promise<boolean> {
        const key = this.formatKey(keyOrObjectType, attributes);

        try {
            await this.get(key);
            return true;
        } catch (err) {
            return false;
        }
    }

    public async get(key: string): Promise<KeyValue>;
    public async get(objectType: string, attributes: string[]): Promise<KeyValue>;
    public async get(keyOrObjectType: any, attributes?: string []): Promise<KeyValue> {
        const key = this.formatKey(keyOrObjectType, attributes);

        let response: any;

        try {
            response = await this.collection.attachment.get(key, 'valueBytes');
        } catch (err) {
            response = await this.collection.get(key);
        }

        if (Buffer.isBuffer(response)) {
            return new KeyValue(key, response.toString());
        }

        if (typeof response === 'object') {
            for (const key in response) {
                if (key.startsWith('_') || key.startsWith('~')) {
                    delete response[key];
                }
            }
        }

        return new KeyValue(key, response);
    }

    private formatKey(keyOrObjectType: string, attributes?: string[]) {
        return attributes === null || attributes === undefined ? keyOrObjectType : ChaincodeStub.prototype.createCompositeKey(keyOrObjectType, attributes);
    }
}