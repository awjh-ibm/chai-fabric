import * as nano from 'nano';
import { ChaincodeStub } from 'fabric-shim';

export interface ICollection {
    exists(key: string): Promise<boolean>;
    exists(objectType: string, attributes: string[]): Promise<boolean>;
    get(key: string): Promise<any>;
    get(objectType: string, attributes: string[]): Promise<any>;
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

    public async get(key: string): Promise<any>;
    public async get(objectType: string, attributes: string[]): Promise<any>;
    public async get(keyOrObjectType: any, attributes?: string []): Promise<any> {
        const key = this.formatKey(keyOrObjectType, attributes);

        let response: any;

        try {
            response = await this.collection.attachment.get(key, 'valueBytes');
        } catch (err) {
            response = await this.collection.get(key);
        }

        if (Buffer.isBuffer(response)) {
            return response.toString();
        }

        if (typeof response === 'object') {
            for (const key in response) {
                if (key.startsWith('_') || key.startsWith('~')) {
                    delete response[key];
                }
            }
        }

        return response;
    }

    private formatKey(keyOrObjectType: string, attributes?: string[]) {
        return attributes === null || attributes === undefined ? keyOrObjectType : ChaincodeStub.prototype.createCompositeKey(keyOrObjectType, attributes);
    }
}