import * as mitt from 'mitt';

export class EventEmitter<T extends Record<string, any>> {
    protected emitter: mitt.Emitter<T> = (mitt.default as any)();

    on = this.emitter.on.bind(this.emitter);
    off = this.emitter.off.bind(this.emitter);
    emit = this.emitter.emit.bind(this.emitter);
}