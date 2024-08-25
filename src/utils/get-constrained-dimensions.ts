const MAX_DIMENSION = 2040;

export const getConstrainedDimensions = (
  originalWidth: number,
  originalHeight: number,
) => {
  if (originalWidth <= MAX_DIMENSION && originalHeight <= MAX_DIMENSION) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  return originalWidth > originalHeight
    ? { width: MAX_DIMENSION, height: MAX_DIMENSION / aspectRatio }
    : { width: MAX_DIMENSION * aspectRatio, height: MAX_DIMENSION };
};
