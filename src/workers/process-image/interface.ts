import { nanoid } from 'nanoid';
import { deserializeError } from 'serialize-error';
import {
  type MessageQueueEntry,
  type WorkerRequestMessage,
  type WorkerResponseMessage,
} from './types';

let isWebWorkerReady = false;

// A map of message IDs to message queue entries.
const messageQueue = new Map<string, MessageQueueEntry>();

interface CustomWorker extends Worker {
  postMessage(message: WorkerRequestMessage): void;
}

// Creates a new worker instance with the worker script URL (loaded dynamically).
const webWorker = new Worker(new URL('./worker.ts', import.meta.url), {
  name: 'ProcessImageWorker',
  type: 'module',
}) as CustomWorker;

/**
 * Logs an entry into the message queue map then sends a message
 * to the worker to start processing the image. The postMessage
 * method natively handles queueing messages with the worker.
 *
 * @param payload
 */
export const sendMessage = async (
  payload: Omit<WorkerRequestMessage, 'id'>,
) => {
  return new Promise((resolve, reject) => {
    const messageId = nanoid();
    const message = { id: messageId, ...payload };

    messageQueue.set(messageId, {
      message,
      reject,
      resolve,
    });

    console.log(
      'ProcessImageWorkerInterface::sendMessage -- Message Added:',
      messageQueue,
    );

    if (isWebWorkerReady) {
      webWorker.postMessage(message);
    }
  });
};

/**
 * Listens for messages from the worker and resolves or rejects
 * the corresponding promise in the message queue accordingly.
 *
 * 'WORKER_READY'    - The worker is ready to process messages.
 *                     Any queued messages get sent to the worker.
 *
 * 'IMAGE_PROCESSED' - The worker has processed the image and the
 *                     corresponding promise in the message queue
 *                     gets resolved or rejected accordingly.\
 */
webWorker.addEventListener(
  'message',
  (event: MessageEvent<WorkerResponseMessage>) => {
    console.log('ProcessImageWorkerInterface::onMessage', event.data);

    switch (event.data.type) {
      case 'WORKER_READY': {
        isWebWorkerReady = true;

        messageQueue.forEach((entry) => {
          webWorker.postMessage(entry.message);
        });

        break;
      }
      case 'IMAGE_PROCESSED': {
        const message = messageQueue.get(event.data.id);
        if (!message) return;

        messageQueue.delete(event.data.id);
        console.log(
          'ProcessImageWorkerInterface::onMessage -- Message Removed:',
          messageQueue,
        );

        if (event.data.error) {
          message.reject(deserializeError(event.data.error));
        } else {
          message.resolve(event.data.message);
        }

        break;
      }
      default: {
        console.error(
          'ProcessImageWorkerInterface::onMessage -- Unknown message type:',
          event.data,
        );

        break;
      }
    }
  },
);

/**
 * Logs any errors that occur within the worker.
 */
webWorker.addEventListener('error', (error) => {
  console.error('ProcessImageWorkerInterface::onError', error);
});
