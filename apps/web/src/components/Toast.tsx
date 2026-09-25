import { useToast } from '../store/toast';

export function Toast() {
  const { message, visible } = useToast();
  return (
    <div className={visible ? 'toast show' : 'toast'} role="status" aria-live="polite">
      {message}
    </div>
  );
}
