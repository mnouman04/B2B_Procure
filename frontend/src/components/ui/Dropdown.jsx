import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

/** Click-outside dropdown used by the header account menu and notifications. */
export const Dropdown = ({ trigger, children, align = 'end', width = 'w-72', className }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={clsx('relative', className)}>
      {trigger({ open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) })}
      {open && (
        <div
          className={clsx(
            'absolute top-[calc(100%+8px)] z-40 rounded-xl border border-line bg-white shadow-panel animate-slide-up',
            align === 'end' ? 'end-0' : 'start-0',
            width,
          )}
        >
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
};
