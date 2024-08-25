import { nanoid } from 'nanoid';
import { useEffect, useRef, useState } from 'react';
import { FileTrigger, type FileTriggerProps } from '@/components/file-trigger';
import {
  PhotoGalleryItem,
  type PhotoGalleryItemProps,
} from '@/components/photo-gallery-item';
import { canCaptureFile } from '@/utils/can-capture-file';
import { sendMessage } from '@/workers/process-image/interface';
import './app.css';

const isCaptureSupported = canCaptureFile();

type PhotoStack = Map<
  string,
  {
    originalPhoto: File;
    originalDimensions: string;
    processedDimensions: string | null;
    processedPhoto: File | null;
    processedPhotoURL: string | null;
  }
>;

export const App = () => {
  const [photoStack, setPhotoStack] = useState<PhotoStack>(() => new Map());

  const photoStackRef = useRef(photoStack);

  const [shouldProcessImage, setShouldProcessImage] = useState(true);

  const onFilesAdded = ((fileList: FileList) => {
    if (!shouldProcessImage) {
      return Array.from(fileList).forEach(async (file) => {
        const originalBitmap = await createImageBitmap(file);

        setPhotoStack((photoStack) => {
          const clonedStack = new Map(photoStack);

          clonedStack.set(nanoid(), {
            originalPhoto: file,
            originalDimensions: `${originalBitmap.width}x${originalBitmap.height}`,
            processedDimensions: `${originalBitmap.width}x${originalBitmap.height}`,
            processedPhoto: file,
            processedPhotoURL: URL.createObjectURL(file),
          });

          return clonedStack;
        });
      });
    }

    Array.from(fileList).forEach(async (file) => {
      const id = nanoid();

      setPhotoStack((photoStack) => {
        const clonedStack = new Map(photoStack);

        clonedStack.set(id, {
          originalPhoto: file,
          originalDimensions: '',
          processedDimensions: null,
          processedPhoto: null,
          processedPhotoURL: null,
        });

        return clonedStack;
      });

      const processedImage = (await sendMessage({
        type: 'PROCESS_IMAGE',
        payload: file,
      })) as File;

      const originalBitmap = await createImageBitmap(file);
      const processedBitmap = await createImageBitmap(processedImage);

      setPhotoStack((photoStack) => {
        const clonedStack = new Map(photoStack);

        clonedStack.set(id, {
          originalPhoto: file,
          originalDimensions: `${originalBitmap.width}x${originalBitmap.height}`,
          processedDimensions: `${processedBitmap.width}x${processedBitmap.height}`,
          processedPhoto: processedImage,
          processedPhotoURL: URL.createObjectURL(processedImage),
        });

        return clonedStack;
      });
    });
  }) satisfies FileTriggerProps['onFilesAdded'];

  const onDeletePhoto = ((id: string) => {
    setPhotoStack((prevStack) => {
      const photoForRemoval = prevStack.get(id);
      if (!photoForRemoval) return prevStack;

      const clonedStack = new Map(prevStack);
      clonedStack.delete(id);

      if (photoForRemoval.processedPhotoURL) {
        URL.revokeObjectURL(photoForRemoval.processedPhotoURL);
      }

      return clonedStack;
    });
  }) satisfies PhotoGalleryItemProps['onDeletePhoto'];

  // Update our internal ref every time the photo stack changes
  useEffect(() => {
    photoStackRef.current = photoStack;
  }, [photoStack]);

  // When this component unmounts, cycle through the ref and revoke any object URLs
  // This clean is implemented in this way so that it doesn't run every time the photo stack changes
  // which would cause us to revoke the object URLs of every entry every time a photo is added or deleted
  useEffect(() => {
    return () => {
      photoStackRef.current?.forEach((photo) => {
        if (photo.processedPhotoURL) {
          URL.revokeObjectURL(photo.processedPhotoURL);
        }
      });
    };
  }, []);

  return (
    <div className="wrapper">
      <div className="processing-controls">
        <label htmlFor="should-process-image">
          <input
            checked={shouldProcessImage}
            id="should-process-image"
            onChange={(event) => setShouldProcessImage(event.target.checked)}
            type="checkbox"
          />
          Process Image via Web Worker?
        </label>
      </div>

      <div className="capture-controls">
        <FileTrigger onFilesAdded={onFilesAdded} type="select">
          Select Photo
        </FileTrigger>

        {isCaptureSupported && (
          <FileTrigger onFilesAdded={onFilesAdded} type="capture">
            Capture Photo
          </FileTrigger>
        )}
      </div>

      <div className="photo-gallery">
        {Array.from(photoStack.entries()).map(([id, photo]) => (
          <PhotoGalleryItem
            id={id}
            key={id}
            onDeletePhoto={onDeletePhoto}
            originalDimensions={photo.originalDimensions}
            originalPhoto={photo.originalPhoto}
            processedDimensions={photo.processedDimensions}
            processedPhoto={photo.processedPhoto}
            processedPhotoURL={photo.processedPhotoURL}
          />
        ))}
      </div>
    </div>
  );
};
