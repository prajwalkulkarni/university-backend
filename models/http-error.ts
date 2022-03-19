class HttpError extends Error{
    errorCode
    constructor(message:string,errorCode:number){

        super(message)
        this.message = message
        this.errorCode = errorCode
    }
}

module.exports = HttpError