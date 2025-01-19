const MAX_DIMENSION = 2040;

/**
 * Get the constrained dimensions of an image while maintaining the aspect ratio.
 *
 * If both the original width and height are within the maximum dimension, the
 * original dimensions are returned. Otherwise, the dimensions are scaled down
 * to fit within the maximum dimension while maintaining the aspect ratio.
 *
 * @param originalWidth - The original width of the image.
 * @param originalHeight - The original height of the image.
 */
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
