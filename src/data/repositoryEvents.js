export const DATA_CHANGED = 'servicehub:data-changed';

export function subscribeToRepository(listener) {
  const onStorage = event => {
    if (!event.key || event.key.startsWith('servicehub_')) listener();
  };
  window.addEventListener(DATA_CHANGED, listener);
  window.addEventListener('storage', onStorage);
  window.addEventListener('focus', listener);
  return () => {
    window.removeEventListener(DATA_CHANGED, listener);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('focus', listener);
  };
}
