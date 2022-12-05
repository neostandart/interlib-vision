namespace MasterDetail {
    "use strict";


     // TSLint на это ругается (хотя всё работает) - а как правильно?
   // tslint:disable-next-line:callable-types
    export interface IEventHandler<TArgs> { (sender: any, args: TArgs): void; }


    export class EventNest<TArgs> {
        // Заглушка для ситуац. когда ожидаемый объект источник события - отсутствует
        public static getStub(): EventNest<any> {
            return new EventNest(null);
        }

        private _sender: any;
        private _handlers: IEventHandler<TArgs>[] = [];

        constructor(sender: any) {
            this._sender = sender;
        }

        public subscribe(handler: IEventHandler<TArgs>): void {
            // Один и тотже обраб. дважды и т.д. не подпишется.
            if (this._handlers.indexOf(handler) < 0) {
                this._handlers.push(handler);
            }
        }

        public unsubscribe(handler: IEventHandler<TArgs>): void {
            let index: number = this._handlers.indexOf(handler);
            if (index >= 0) {
                this._handlers.splice(index, 1);
            }
        }

        // Насколько тут правильные this и т.п. - пока не ясно!
        public raise(args: TArgs): void {
            this._handlers.forEach((handler: IEventHandler<TArgs>) => {
                handler(this._sender, args);
            });
        }
    }


} // namespace MasterDetailApp
