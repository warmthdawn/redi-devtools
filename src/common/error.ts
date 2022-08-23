export class RediDevError extends Error {
    constructor(msg: string, public obj?: any) {
        super(`[redi-dev] ${msg}`)
    }
}