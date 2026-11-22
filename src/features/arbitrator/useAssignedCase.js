import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectDisputes,
  selectSupportLoading,
  selectSupportError,
  fetchDisputesThunk,
} from '../../store/slices/supportSlice';

export function useAssignedCase() {
  const dispatch = useDispatch();
  const cases = useSelector(selectDisputes);
  const loading = useSelector(selectSupportLoading);
  const error = useSelector(selectSupportError);
  const [params, setParams] = useSearchParams();

  const refresh = useCallback(() => {
    dispatch(fetchDisputesThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchDisputesThunk());
  }, [dispatch]);

  const requestedId = params.get('caseId');
  const caseId = requestedId || cases.find(item => !item.ruling)?.id || cases[0]?.id;

  useEffect(() => {
    if (!requestedId && caseId) setParams({ caseId }, { replace: true });
  }, [requestedId, caseId, setParams]);

  return {
    loading,
    error,
    refresh,
    cases,
    caseId,
    selectedCase: cases.find(item => item.id === caseId),
    selectCase: id => setParams({ caseId: id })
  };
}
