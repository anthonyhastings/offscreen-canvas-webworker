import { formatBytes } from '@/utils/format-bytes';

export type PhotoGalleryItemProps = {
  id: string;
  onDeletePhoto: (photoId: string) => void;
  originalPhoto: File;
  originalDimensions: string;
  processedDimensions: string | null;
  processedPhoto: File | null;
  processedPhotoURL: string | null;
};

export const PhotoGalleryItem = ({
  id,
  onDeletePhoto,
  originalPhoto,
  originalDimensions,
  processedDimensions,
  processedPhoto,
  processedPhotoURL,
}: PhotoGalleryItemProps) => {
  if (!processedPhoto || !processedPhotoURL) return 'Loading...';

  return (
    <div className="photo-gallery-item">
      <img className="photo-gallery-item__thumbnail" src={processedPhotoURL} />

      <table className="photo-gallery-item__table">
        <tbody>
          <tr>
            <th scope="row">Original:</th>
            <td>{formatBytes(originalPhoto.size)}</td>
          </tr>
          <tr>
            <th scope="row">Processed:</th>
            <td>{formatBytes(processedPhoto.size)}</td>
          </tr>
        </tbody>
        <caption>File size comparison</caption>
      </table>

      <table className="photo-gallery-item__table">
        <tbody>
          <tr>
            <th scope="row">Original:</th>
            <td>{originalDimensions}</td>
          </tr>
          <tr>
            <th scope="row">Processed:</th>
            <td>{processedDimensions}</td>
          </tr>
        </tbody>
        <caption>Dimensions comparison</caption>
      </table>

      <button
        className="photo-gallery-item__cta"
        onClick={() => onDeletePhoto(id)}
      >
        Delete
      </button>
    </div>
  );
};
