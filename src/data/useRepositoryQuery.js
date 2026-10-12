import { useCallback, useEffect, useState } from 'react';
import { subscribeToRepository } from './repositoryEvents';

export function useRepositoryQuery(load) {
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
      if (current) setResult(value => ({ load, data: value.load === load ? value.data : null, error: error.message || 'Unable to load data.' }));
    });
    return () => { current = false; };
  }, [load, version]);

  useEffect(() => subscribeToRepository(refresh), [refresh]);

  const setData = update => setResult(value => value.load === load
    ? { ...value, data: typeof update === 'function' ? update(value.data) : update }
    : value);
  const data = result.load === load ? result.data : null;
  return { data, setData, error: result.load === load ? result.error : '', loading: data === null, refresh };
}
