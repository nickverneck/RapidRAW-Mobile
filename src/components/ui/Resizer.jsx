import clsx from 'clsx';

const Resizer = ({ onMouseDown, direction }) => (
  <div
    onMouseDown={onMouseDown}
    className={clsx(
      'flex-shrink-0 bg-transparent z-10',
      { 'w-2 cursor-col-resize': direction === 'vertical', 'h-2 cursor-row-resize': direction === 'horizontal' }
    )}
  />
);

export default Resizer;