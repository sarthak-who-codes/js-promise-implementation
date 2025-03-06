class CustomPromise {
    constructor(executor) {
        this.promiseChain = [];
        this.handleError = () => {};

        this.onResolve = this.onResolve.bind(this);
        this.onReject = this.onReject.bind(this);

        executor(this.onResolve, this.onReject);
    };

    then(handleSuccess) {
        this.promiseChain.push(handleSuccess);

        return this;
    }

    catch(handleError) {
        this.handleError = handleError;

        return this;
    }

    onResolve(value) {
        let storedValue = value;

        try {
            this.promiseChain.forEach(nextFunc => {
                storedValue = nextFunc(storedValue);
            })
        } catch (error) {
            this.onReject(error);
        }
    }

    onReject(error) {
        this.handleError(error);
    }
}

const makeApiCall = () => {
    return new CustomPromise((resolve, reject) => {
        setTimeout(() => {
            if(Math.random() > 0.5)
                resolve(100);
            else
                reject({
                    error: "Something bad happend",
                    status: 401,
                })
        }, 2000)
    })
}

makeApiCall()
    .then(() => { console.log("In 1st then") })
    .then(() => console.log("In 2nd then"))
    .catch((error) => { console.log(`Error catched: ${JSON.stringify(error)}`) });