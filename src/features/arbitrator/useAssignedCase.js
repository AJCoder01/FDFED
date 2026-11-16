import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDisputes } from '../../data/apiRepository';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';

export function useAssignedCase() {
  const [params, setParams] = useSearchParams();
  const query = useRepositoryQuery(getDisputes);
  const cases = query.data || [];
  const requestedId = params.get('caseId');
  const caseId = requestedId || cases.find(item => !item.ruling)?.id || cases[0]?.id;
  useEffect(() => {
    if (!requestedId && caseId) setParams({ caseId }, { replace: true });
  }, [requestedId, caseId, setParams]);
  return { ...query, cases, caseId, selectedCase: cases.find(item => item.id === caseId), selectCase: id => setParams({ caseId: id }) };
}
