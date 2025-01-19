/**
 * Checks if the browser supports the capture attribute on input elements.
 *
 * The capture attribute is used to specify that the file input should use
 * the device's camera or microphone.
 */
export const canCaptureFile = () => {
  return document.createElement('input').capture !== undefined;
};
