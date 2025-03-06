const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class CustomPromise {
    constructor(executor) {
        this.state = PENDING;
        this.onFulfillmentCallback = [];
        this.onRejectCallback = [];
        this.value = undefined;
        this.reason = undefined;
        
        const resolve = (value) => {
            //console.log("In resolve");
            if(this.state === PENDING) {
                this.state = FULFILLED;
                this.value = value;
                this.onFulfillmentCallback.forEach(callbackFunc => callbackFunc(this.value))
            }
        }

        const reject = (reason) => {
            //console.log("In reject");
            if(this.state === PENDING) {
                this.state = REJECTED;
                this.reason = reason;
                this.onRejectCallback.forEach(callback => callback(this.reason));
            }
        }

        //console.log("Staring executing context");
        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error)
        }
    }

    then(onFulfill, onReject) {
        return new CustomPromise((resolve, reject) => {
            
            const handleFulfill = () => {
                queueMicrotask(() => {
                    if(!onFulfill) {
                        return resolve(this.value);
                    }

                    try {
                        const result = onFulfill(this.value)

                        if(result instanceof CustomPromise) {
                            result.then(resolve, reject);
                        }
                        else {
                            resolve(result);
                        }
                    } catch (error) {
                        reject(error)
                    }
                })
            }

            const handleReject = () => {
                queueMicrotask(() => {
                    if(!onReject) {
                        return reject(this.reason);
                    }

                    try {
                        const result = onReject(this.reason);
                        if(result instanceof CustomPromise) {
                            result.then(resolve, reject)
                        }
                        else {
                            resolve(result);
                        }
                    } catch (error) {
                        reject(error)
                    }
                })
            }

            if(this.state === FULFILLED) {
                handleFulfill();
            }
            else if(this.state === REJECTED) {
                handleReject();
            }
            else {
                this.onFulfillmentCallback.push(handleFulfill);
                this.onRejectCallback.push(handleReject);
            }
        })
    }

    catch(onReject) {
        return this.then(undefined, onReject);
    }

}

const myPromise = () => {
    return new CustomPromise((resolve, reject) => {
        setTimeout(() => {
            console.log("From setTimeout");
            resolve("Promise resolved");

        }, 2000)
    })
}

myPromise().then(() => {
    console.log("From then");
    throw new Error("Intentinal error")
}).catch((error) => {
    console.log("In catch");
    // return "Returing from catch"
}).then((value) => {
    console.log(`From second then, value: ${value}`)
})