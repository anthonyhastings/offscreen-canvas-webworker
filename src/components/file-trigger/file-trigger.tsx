import { useEffect, useRef, useState } from 'react';

export type FileTriggerProps = React.PropsWithChildren<{
  onFilesAdded: (fileList: FileList) => void;
  type: 'select' | 'capture';
}>;

export const FileTrigger = ({
  children,
  onFilesAdded,
  type,
}: FileTriggerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shouldReset, setShouldReset] = useState(false);

  const onFileChanged = ((evt) => {
    if (evt.target.files) onFilesAdded(evt.target.files);
    setShouldReset(true);
  }) satisfies React.ChangeEventHandler<HTMLInputElement>;

  // This side-effect is deliberately placed here to reset the file input
  // only after the files have been given to the parent component. Without
  // this, the parent component would receive an empty file list.
  useEffect(() => {
    if (!shouldReset) return;
    fileInputRef!.current!.value = '';
    setShouldReset(false);
  }, [shouldReset]);

  return (
    <>
      <button onClick={() => fileInputRef.current?.click()}>{children}</button>
      <input
        accept="image/*"
        multiple
        onChange={onFileChanged}
        ref={fileInputRef}
        style={{ display: 'none' }}
        type="file"
        {...(type === 'capture' && { capture: 'environment' })}
      />
    </>
  );
};
