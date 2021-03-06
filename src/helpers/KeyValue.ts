export interface IKeyValue {
    value(): Promise<any>;
}

export class KeyValue implements IKeyValue {
    private _value: any;
    private _key: any;

    public constructor(key: string, value: any) {
        this._key = key;
        this._value = value;
    }

    public key(): string {
        return this._key;
    }

    public value(stringify: boolean = false): any {
        return stringify ? JSON.stringify(this._value) : this._value;
    }
}