import { useNavigate } from 'react-router-dom';
import landingBg from '../assets/Landing-Background.jpg';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        backgroundImage: `url(${landingBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between py-12 px-4">
        {/* Animated Cloud Title */}
        <div className="text-center mt-8">
          <h1 className="cloud-title text-6xl sm:text-7xl md:text-8xl font-bold tracking-wide">
            This Or That
          </h1>
          <p
            className="text-white text-2xl sm:text-3xl mt-4"
            style={{ fontFamily: "'Pacifico', cursive" }}
          >
            Find your favourite.
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* 3D Green Button */}
        <div className="mb-16">
          <button
            onClick={() => navigate('/setup')}
            className="play-button group relative px-12 py-5 text-2xl font-bold text-white rounded-2xl
                       transform transition-all duration-150 ease-out
                       hover:scale-105 active:scale-95 active:translate-y-1
                       focus:outline-none focus:ring-4 focus:ring-green-300/50"
          >
            <span className="relative z-10">Let's Play</span>
          </button>
        </div>
      </div>

      {/* Curate button - bottom right */}
      <button
        onClick={() => navigate('/curate')}
        className="fixed bottom-6 right-6 z-20 w-12 h-12 rounded-full bg-gray-500 hover:bg-gray-600
                   text-white text-3xl font-bold grid place-items-center
                   shadow-lg hover:shadow-xl transition-all duration-200
                   hover:scale-110 active:scale-95"
        aria-label="Add more cars"
      >
        <span className="-mt-1">+</span>
      </button>

      {/* Cloud animation styles */}
      <style>{`
        .cloud-title {
          color: white;
          text-shadow:
            0 0 10px rgba(255, 255, 255, 0.8),
            0 0 20px rgba(255, 255, 255, 0.6),
            0 0 30px rgba(255, 255, 255, 0.5),
            0 0 40px rgba(255, 255, 255, 0.4),
            0 4px 8px rgba(0, 0, 0, 0.2);
          animation: cloudFloat 4s ease-in-out infinite, cloudPulse 3s ease-in-out infinite;
          filter: blur(0.3px);
          letter-spacing: 0.05em;
        }

        @keyframes cloudFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes cloudPulse {
          0%, 100% {
            text-shadow:
              0 0 10px rgba(255, 255, 255, 0.8),
              0 0 20px rgba(255, 255, 255, 0.6),
              0 0 30px rgba(255, 255, 255, 0.5),
              0 0 40px rgba(255, 255, 255, 0.4),
              0 4px 8px rgba(0, 0, 0, 0.2);
          }
          50% {
            text-shadow:
              0 0 15px rgba(255, 255, 255, 1),
              0 0 30px rgba(255, 255, 255, 0.8),
              0 0 45px rgba(255, 255, 255, 0.6),
              0 0 60px rgba(255, 255, 255, 0.5),
              0 4px 8px rgba(0, 0, 0, 0.2);
          }
        }

        .play-button {
          background: linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%);
          box-shadow:
            0 6px 0 #15803d,
            0 8px 15px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .play-button:hover {
          background: linear-gradient(180deg, #86efac 0%, #4ade80 50%, #22c55e 100%);
          box-shadow:
            0 6px 0 #16a34a,
            0 10px 20px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .play-button:active {
          box-shadow:
            0 2px 0 #15803d,
            0 4px 8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
