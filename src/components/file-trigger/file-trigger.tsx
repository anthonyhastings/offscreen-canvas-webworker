import { useEffect, useRef, useState } from 'react';

export type FileTriggerProps = React.PropsWithChildren<{
  /** Callback triggered when file input changes. */
  onFilesAdded: (fileList: FileList) => void;
  /** Denotes the desired method of attaching a file to the input. */
  type: 'select' | 'capture';
}>;

/** Renders a button that interacts with a visually hidden file input. */
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

  /**
   * Resets the file input after the files are given to the parent component.
   * This needs to occur in a separate call stack from the parent callback
   * being triggered else the parent component receives an empty file list.
   */
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
