export const canCaptureFile = () => {
  return document.createElement('input').capture !== undefined;
};
