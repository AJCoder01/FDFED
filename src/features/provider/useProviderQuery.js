import { useCallback, useEffect, useState } from 'react';

export function useProviderQuery(load) {
  const [result, setResult] = useState({ load: null, data: null, error: '' });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(value => value + 1), []);

  useEffect(() => {
    let current = true;
    load().then(result => {
      if (current) {
        setResult({ load, data: result, error: '' });
      }
    }).catch(error => {
      if (current) setResult(value => ({ ...value, load, error: error.message || 'Unable to load provider data.' }));
    });
    return () => { current = false; };
  }, [load, version]);

  useEffect(() => {
    const onStorage = event => {
      if (!event.key || event.key.startsWith('servicehub_')) refresh();
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const setData = update => setResult(value => value.load === load
    ? { ...value, data: typeof update === 'function' ? update(value.data) : update }
    : value);
  const data = result.load === load ? result.data : null;
  return { data, setData, error: result.load === load ? result.error : '', loading: data === null, refresh };
}
