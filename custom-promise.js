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

    finally(func) {
        return this.then((value) => {
            try {
                func();
                return value;
            } catch (error) {
                throw error
            }
        },

        (reason) => {
            try {
                func();
                return reason;
            } catch (error) {
                throw error
            }
        })
    }

    static resolve(value) {
        if(value instanceof CustomPromise)
            return value;
        else
            return new CustomPromise((resolve) => resolve(value));
    }

    static reject(reason) {
        return new CustomPromise((_, reject) => reject(reason));
    }

    // "All or nothing"
    static all(promises) {
        return new CustomPromise((resolve, reject) => {
            if(!Array.isArray(promises)) {
                throw new TypeError("Not type of array");
            }
            const results = [];
            const count = 0;

            if(promises.length === 0)
                return resolve([]);

            promises.forEach((promise, index) => {
                if(!(promise  instanceof CustomPromise))
                    reject(`Not a instance of CustomPromise. Line: ${index}`);
                
                CustomPromise.resolve(promise).then(value => {
                    results[index] = value;
                    count++;

                    if(count === promises.length)
                        return resolve(results);
                    
                }).catch(reason => {
                    return reject(reason)
                })

            })
        })
    }

    static allSettled(promises) {
        return new CustomPromise((resolve) => {
            if (!Array.isArray(promises)) {
                throw new Error("promises Not type of array");
            }
    
            if (promises.length === 0) {
                return resolve([]);
            }
    
            const results = [];
            let count = 0;
    
            promises.forEach((promise, index) => {
                if (!(promise instanceof CustomPromise)) {
                    results[index] = { status: "rejected", reason: new Error("Not an instance of CustomPromise") };
                    count++;
                    if (count === promises.length) resolve(results);
                    return;
                }
    
                promise
                    .then((value) => {
                        results[index] = { status: "fulfilled", value };
                    })
                    .catch((reason) => {
                        results[index] = { status: "rejected", reason };
                    })
                    .finally(() => {
                        count++;
                        if (count === promises.length) {
                            resolve(results);
                        }
                    });
            });
        });
    }

    // Returns first settled promise whether is a value or rejct
    static race(promises) {
        return new CustomPromise((resolve, reject) => {
            if(!Array.isArray(promises))
                return reject( new Error("promises is not type of Array"));
    
            if(promises.length === 0)
                return reject(new Error("Length of array is 0"));

            let isSettled = false;

            promises.forEach(promise => {
                
                CustomPromise.resolve(promise).then((value) => {
                    if(!isSettled) {
                        isSettled = true;
                        resolve(value);
                    }
                }, reason => {
                    if(!isSettled) {
                        isSettled = true;
                        reject(reason);
                    }
                })
            })
        })
    }

    static any(promises) {
        return new CustomPromise((resolve, reject) => {
            const errors = [];
            let count = 0;

            if(!Array.isArray(promises)) {
                reject(new TypeError("promises is not a type of Array"));
                return;
            }
            
            if(promises.length === 0) {
                reject(new AggregateError([], "No promises were provided"));
                return;
            }

            let resolved = false

            promises.forEach(promise => {
                CustomPromise.resolve(promise).then( value => {
                    if(!resolved) {
                        resolved = true;
                        resolve(value);
                    }
                },
                reason => {
                    errors.push(reason);
                    count++;

                    if(count === promises.length && !resolved)
                        reject(new AggregateError(errors, "All promises were rejected"));
                })
            })
        })
    }
}

const myPromise = () => {
    
}

// myPromise().then(() => {
//     console.log("From then");
//     throw new Error("Intentinal error")
// }).catch((error) => {
//     console.log("In catch");
//     // return "Returing from catch"
// }).then((value) => {
//     console.log(`From second then, value: ${value}`)
// })


/**
 * Promise.all
 * Promise.allSettle
 * Promise.race
 * Promise.any
 */