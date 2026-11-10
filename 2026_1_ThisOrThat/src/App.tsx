import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { MusicProvider } from './context/MusicContext';
import { MiniMusicPlayer } from './components/common/MiniMusicPlayer';
import { HomePage } from './pages/HomePage';
import { SetupPage } from './pages/SetupPage';
import { GamePage } from './pages/GamePage';
import { ResultsPage } from './pages/ResultsPage';
import { CurationPage } from './pages/CurationPage';

function App() {
  return (
    <MusicProvider>
      <MiniMusicPlayer />
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/curate" element={<CurationPage />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </MusicProvider>
  );
}

export default App;
