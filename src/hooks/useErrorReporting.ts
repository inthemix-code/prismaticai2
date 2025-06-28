import { useCallback } from 'react';

interface ErrorReport {
  error: Error;
  errorInfo?: any;
  context?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Custom hook for error reporting and logging
 */
export function useErrorReporting() {
  const reportError = useCallback((report: ErrorReport) => {
    const { error, errorInfo, context, severity = 'medium' } = report;
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Report (${severity})`);
      console.error('Error:', error);
      if (errorInfo) console.error('Error Info:', errorInfo);
      if (context) console.error('Context:', context);
      console.groupEnd();
    }
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      const errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: localStorage.getItem('prism_user_id'),
        severity,
        context,
        errorInfo
      };
      
      // Send to your error reporting service
      fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      }).catch((logError) => {
        console.error('Failed to report error:', logError);
      });
      
      // Also consider integrating with services like:
      // - Sentry: Sentry.captureException(error, { contexts: { custom: context } });
      // - LogRocket: LogRocket.captureException(error);
      // - Bugsnag: Bugsnag.notify(error, event => { event.context = context; });
    }
  }, []);
  
  const reportInfo = useCallback((message: string, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.info('ℹ️ Info:', message, context);
    }
    
    if (process.env.NODE_ENV === 'production') {
      const infoData = {
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userId: localStorage.getItem('prism_user_id'),
        context
      };
      
      fetch('/api/log-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(infoData),
      }).catch(() => {
        // Silently fail for info logs
      });
    }
  }, []);
  
  const reportWarning = useCallback((message: string, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Warning:', message, context);
    }
    
    if (process.env.NODE_ENV === 'production') {
      const warningData = {
        level: 'warning',
        message,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userId: localStorage.getItem('prism_user_id'),
        context
      };
      
      fetch('/api/log-warning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(warningData),
      }).catch(() => {
        // Silently fail for warning logs
      });
    }
  }, []);
  
  return {
    reportError,
    reportInfo,
    reportWarning
  };
}