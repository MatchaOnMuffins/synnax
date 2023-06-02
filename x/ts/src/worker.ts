interface TypedWorkerMessage {
  type: string;
  payload: any;
}

export class RoutedWorker {
  send: Send;
  children: Map<string, TypedWorker<any>>;

  constructor(send: Send) {
    this.send = send;
    this.children = new Map();
  }

  handle({ data }: { data: TypedWorkerMessage }): void {
    const handler = this.children.get(data.type)?.handler;
    if (handler == null) console.warn(`No handler for ${data.type}`);
    else handler(data.payload);
  }

  route<RQ, RS = RQ>(type: string): TypedWorker<RQ, RS> {
    const send = typedSend(type, this.send);
    const t = new TypedWorker<RQ, RS>(send);
    this.children.set(type, t);
    return t;
  }
}

type Handler = (payload: any) => void;
type Send = (payload: any, transfer?: Transferable[]) => void;

const typedSend =
  (type: string, send: Send): Send =>
  (payload: any, transfer?: Transferable[]) => {
    return send({ type, payload }, transfer);
  };

export class TypedWorker<RQ, RS = RQ> {
  private readonly _send: Send;
  handler: Handler | null;

  constructor(send: Send) {
    this._send = send;
    this.handler = null;
  }

  send(payload: RQ, transfer: Transferable[] = []): void {
    this._send(payload, transfer);
  }

  handle(callback: (payload: RS) => void): void {
    this.handler = callback;
  }
}