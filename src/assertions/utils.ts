export const ASSERTION_FAILED = 'ASSERTION_FAILED';
export const WAIT_FOR_FLAG = 'WAIT_FOR_FLAG';

async function waitForFlag(parent: any, util: Chai.ChaiUtils, flagName: string) {
    return new Promise((resolve, reject) => {
        let counter = 0;
        const waitInterval = setInterval(() => {
            const flag = util.flag(parent, flagName);
            if (flag !== WAIT_FOR_FLAG && flag !== ASSERTION_FAILED) {
                clearInterval(waitInterval);
                resolve(flag);
            } else if (flag === 'ASSERTION_FAILED') {
                clearInterval(waitInterval);
                reject(`${flagName} exist assertion failed`);
            }

            if (++counter === 500) {
                clearInterval(waitInterval);
                reject(`Timed out waiting for ${flagName} exists assertion`);
            }
        }, 10);
    });
}

export async function getObject<T>(parent: any, chai: Chai.ChaiStatic, flagName: string): Promise<T> {
    let obj = parent._obj;
    const objectFlag = chai.util.flag(parent, flagName);

    if (objectFlag) {
        const flagValue = await waitForFlag(parent, chai.util, flagName);

        obj = await parent._obj.get(flagValue);
    }

    return obj;
}