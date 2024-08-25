import { serializeError } from 'serialize-error';

export type WorkerRequestMessage = {
  type: 'PROCESS_IMAGE';
  id: string;
  payload: File;
};

export type WorkerResponseMessage =
  | { type: 'WORKER_READY' }
  | ({ type: 'IMAGE_PROCESSED'; id: string } & (
      | { error: ReturnType<typeof serializeError>; message?: never }
      | { error?: never; message: File }
    ));

export type MessageQueueEntry = {
  message: WorkerRequestMessage;
  resolve: (image: File) => void;
  reject: (reason?: unknown) => void;
};
