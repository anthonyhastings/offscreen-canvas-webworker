import { serializeError } from 'serialize-error';
import { formatBytes } from '@/utils/format-bytes';
import { getConstrainedDimensions } from '@/utils/get-constrained-dimensions';
import { type WorkerRequestMessage, type WorkerResponseMessage } from './types';

type CustomWorkerGlobalScope = {
  postMessage(message: WorkerResponseMessage): void;
};

const processImage = async (image: File) => {
  console.time('Worker::processImage');
  const bitmap = await createImageBitmap(image);

  const { width, height } = getConstrainedDimensions(
    bitmap.width,
    bitmap.height,
  );

  const offscreenCanvas = new OffscreenCanvas(width, height);
  const ctx = offscreenCanvas.getContext('2d');
  ctx?.drawImage(bitmap, 0, 0, width, height);

  const canvasBlob = await offscreenCanvas.convertToBlob({
    type: image.type,
    quality: 0.8,
  });

  const processedImage = new File([canvasBlob!], image.name, {
    type: image.type,
  });

  console.timeEnd('Worker::processImage');

  console.group('Original Image:');
  console.table({
    dimensions: `${bitmap.width}x${bitmap.height}`,
    size: formatBytes(image.size),
    type: image.type,
  });
  console.groupEnd();

  console.group('Processed Image:');
  console.table({
    dimensions: `${width}x${height}`,
    size: formatBytes(processedImage.size),
    type: processedImage.type,
  });
  console.groupEnd();

  return processedImage;
};

self.addEventListener(
  'message',
  async (event: MessageEvent<WorkerRequestMessage>) => {
    console.log('Worker::onMessage:', event.data);

    switch (event.data.type) {
      case 'PROCESS_IMAGE': {
        try {
          (self as CustomWorkerGlobalScope).postMessage({
            type: 'IMAGE_PROCESSED',
            id: event.data.id,
            message: await processImage(event.data.payload),
          });
        } catch (err) {
          (self as CustomWorkerGlobalScope).postMessage({
            type: 'IMAGE_PROCESSED',
            id: event.data.id,
            error: serializeError(err),
          });
        }

        break;
      }
      default: {
        console.log(`${self.name} -- Unknown message type:`, event.data);
        break;
      }
    }
  },
);

(self as CustomWorkerGlobalScope).postMessage({ type: 'WORKER_READY' });
