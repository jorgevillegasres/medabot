interface Props<T extends string | number> {
  items: readonly { value: T; label: string }[];
  isOn: (v: T) => boolean;
  onPick: (v: T) => void;
  label?: string;
  small?: boolean;
}

export function Chips<T extends string | number>({ items, isOn, onPick, label, small }: Props<T>) {
  return (
    <div className={small ? 'chips small' : 'chips'} role="group" aria-label={label}>
      {items.map((it) => (
        <button
          key={String(it.value)}
          type="button"
          className={isOn(it.value) ? 'on' : ''}
          aria-pressed={isOn(it.value)}
          onClick={() => onPick(it.value)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export const asItems = (xs: readonly string[]) => xs.map((x) => ({ value: x, label: x }));
