import { serializeError } from 'serialize-error';
import { formatBytes } from '@/utils/format-bytes';
import { getConstrainedDimensions } from '@/utils/get-constrained-dimensions';
import { type WorkerRequestMessage, type WorkerResponseMessage } from './types';

type CustomWorkerGlobalScope = {
  postMessage(message: WorkerResponseMessage): void;
};

/**
 * Processes an image file by resizing it to a constrained width
 * and height then returning the processed image file.
 *
 * @param image The image file to process.
 */
const processImage = async (image: File) => {
  console.time('Worker::processImage');

  // Convert the image file to an ImageBitmap.
  const bitmap = await createImageBitmap(image);

  // Determine the constrained dimensions to use.
  const { width, height } = getConstrainedDimensions(
    bitmap.width,
    bitmap.height,
  );

  // Use the OffscreenCanvas API to draw the image onto a sized canvas.
  const offscreenCanvas = new OffscreenCanvas(width, height);
  const ctx = offscreenCanvas.getContext('2d');
  ctx?.drawImage(bitmap, 0, 0, width, height);

  // Export the the canvas content to a Blob with slightly reduced quality.
  const canvasBlob = await offscreenCanvas.convertToBlob({
    type: image.type,
    quality: 0.8,
  });

  // Create a new File instance from the canvas Blob.
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

/**
 * Listens for messages from the main thread and processes the
 * them accordingly and posting the result back
 *
 * 'PROCESS_IMAGE'   - Triggers the image processing functionality.
 *                     Processed image is sent back to the main thread.
 */
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

// Notify the main thread that the worker is ready to process messages.
(self as CustomWorkerGlobalScope).postMessage({ type: 'WORKER_READY' });
