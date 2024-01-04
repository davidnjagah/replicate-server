class HttpError extends Error {
    code: number;

    constructor(message: string, errorCode: number) {
        super(message); // Call the constructor of the parent class Error
        this.code = errorCode;
    }
}

export default HttpError;
