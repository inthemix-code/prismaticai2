import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
import { QueryPage } from './pages/QueryPage';
import { ResultsPage } from './pages/ResultsPage';
import { PromptLabPage } from './pages/PromptLabPage';
import { LabResultsPage } from './pages/LabResultsPage';
import { Toaster } from 'sonner';
import './App.css';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<QueryPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/lab" element={<PromptLabPage />} />
        <Route path="/lab/:sessionId" element={<LabResultsPage />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AnimatedRoutes />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0F1420',
              border: '1px solid #1f2937',
              color: '#e5e7eb',
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  );
}

export default App;