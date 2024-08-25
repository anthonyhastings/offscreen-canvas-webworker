import { nanoid } from 'nanoid';
import { deserializeError } from 'serialize-error';
import {
  type MessageQueueEntry,
  type WorkerRequestMessage,
  type WorkerResponseMessage,
} from './types';

let isWebWorkerReady = false;

const messageQueue = new Map<string, MessageQueueEntry>();

interface CustomWorker extends Worker {
  postMessage(message: WorkerRequestMessage): void;
}

const webWorker = new Worker(new URL('./worker.ts', import.meta.url), {
  name: 'ProcessImageWorker',
  type: 'module',
}) as CustomWorker;

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
      'ProcessImageWorkerInterface::sendWebWorkerMessage -- Message Added:',
      messageQueue,
    );

    if (isWebWorkerReady) {
      webWorker.postMessage(message);
    }
  });
};

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

webWorker.addEventListener('error', (error) => {
  console.error('ProcessImageWorkerInterface::onError', error);
});
