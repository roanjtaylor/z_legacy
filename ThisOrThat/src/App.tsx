import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { HomePage } from './pages/HomePage';
import { SetupPage } from './pages/SetupPage';
import { ComparePage } from './pages/ComparePage';
import { ResultsPage } from './pages/ResultsPage';
import { ReviewPage } from './pages/ReviewPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { DatasetBranchPage } from './pages/DatasetBranchPage';

function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:branch" element={<SetupPage />} />
          <Route path="/:branch/play" element={<ComparePage />} />
          <Route path="/:branch/results" element={<ResultsPage />} />
          {/* Curator-only, dev builds only. */}
          {import.meta.env.DEV && <Route path="/review/:branch" element={<ReviewPage />} />}
          {import.meta.env.DEV && <Route path="/datasets" element={<DatasetsPage />} />}
          {import.meta.env.DEV && <Route path="/datasets/:branch" element={<DatasetBranchPage />} />}
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}

export default App;
