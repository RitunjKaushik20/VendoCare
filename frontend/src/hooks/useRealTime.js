
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axiosConfig';

export const usePolling = (fetchFn, interval = 10000, enabled = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(enabled);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      console.error('Polling error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  const startPolling = useCallback(() => {
    if (!isPolling) {
      setIsPolling(true);
    }
  }, [isPolling]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  
  useEffect(() => {
    if (isPolling && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPolling, enabled, interval, fetchData]);

  return {
    data,
    loading,
    error,
    isPolling,
    refetch,
    startPolling,
    stopPolling,
  };
};

export const useLiveDashboardStats = (interval = 10000) => {
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/vendor/dashboard/live-stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching live stats:', error);
      throw error;
    }
  }, []);

  return usePolling(fetchStats, interval);
};

export const useLiveNotifications = (interval = 30000) => {
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/vendor/dashboard/notifications');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }, []);

  return usePolling(fetchNotifications, interval);
};

export const useUnreadCount = (interval = 10000) => {
  const fetchUnread = useCallback(async () => {
    try {
      const response = await api.get('/vendor/dashboard/notifications/unread-count');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }, []);

  return usePolling(fetchUnread, interval);
};

export const useAutoRefresh = (fetchFn, options = {}) => {
  const {
    interval = 60000,
    enabled = true,
    refetchOnFocus = true,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      console.error('Refresh error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  
  useEffect(() => {
    if (!enabled) return;

    refresh();

    const pollInterval = setInterval(refresh, interval);

    
    const handleFocus = () => {
      if (refetchOnFocus) {
        refresh();
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchFn, interval, enabled, refetchOnFocus, refresh]);

  return { data, loading, error, refresh };
};

export default {
  usePolling,
  useLiveDashboardStats,
  useLiveNotifications,
  useUnreadCount,
  useAutoRefresh,
};

