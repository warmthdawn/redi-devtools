import { bindCallback, bufferTime, fromEvent, Observable, Subject, windowTime } from "rxjs";
import { BridgeCommands } from "./consts";
import { BridgeCommand, BridgeCommandArgsMap } from "./types";

export interface MessageAdapter {
    send<T extends BridgeCommands>(cmd: T, payload: BridgeCommandArgsMap[T]): void;
    listen(handler: <T extends BridgeCommands>(cmd: T, payload: BridgeCommandArgsMap[T]) => void): void;
}




export class Bridge {
    constructor(private _adapter: MessageAdapter) {
        const remoteMessage = bindCallback(_adapter.listen)()

        const selfMessage = new Subject<[cmd: BridgeCommands, payload: BridgeCommand]>();

        selfMessage.subscribe(([cmd, payload])=>{
            _adapter.send(cmd, payload);
        })
    }


}