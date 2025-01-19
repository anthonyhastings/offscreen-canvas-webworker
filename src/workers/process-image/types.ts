import { serializeError } from 'serialize-error';

/** Message being sent from the main thread to the worker. */
export type WorkerRequestMessage = {
  /** The type of work the worker needs to action. */
  type: 'PROCESS_IMAGE';
  /** ID that correlates the file to promise callbacks in the main thread's message queue. */
  id: string;
  /** The image to process. */
  payload: File;
};

/** Message being sent from the worker back to the main thread. */
export type WorkerResponseMessage =
  /** Indicates the worker is ready to process images. */
  | { type: 'WORKER_READY' }
  /** Indicates image processing is complete and returns the image if successful or the error. */
  | ({ type: 'IMAGE_PROCESSED'; id: string } & (
      | { error: ReturnType<typeof serializeError>; message?: never }
      | { error?: never; message: File }
    ));

/** Correlates a request to the worker and the promises to resolve the job in the queue. */
export type MessageQueueEntry = {
  message: WorkerRequestMessage;
  resolve: (image: File) => void;
  reject: (reason?: unknown) => void;
};
