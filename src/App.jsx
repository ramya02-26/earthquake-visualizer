import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CoreMap from "./pages/CoreMap";

function Home() {
  return (
    <div
      className="relative flex flex-col-reverse md:flex-row items-center justify-between h-screen w-screen overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/backg.jpg')" }}
    >
      {/* Left side: Content */}
      <div className="relative z-10 flex flex-col items-start text-left text-white px-8 sm:px-12 md:px-16 py-8 md:py-0 w-full md:w-5/12">
        {/* Bright Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-[2.5rem] lg:text-6xl font-extrabold mb-5 drop-shadow-[0_0_25px_rgba(0,255,200,0.9)] animate-fadeIn">
          Earthquake Visualizer
        </h1>

        {/* Extended Subtitle & Description */}
        <p className="text-base sm:text-lg md:text-[1.05rem] lg:text-xl max-w-full md:max-w-xl mb-7 text-emerald-200 animate-fadeIn leading-relaxed">
          Track global seismic activity in real time with immersive visuals that
          bring science to life. <br />
          <span className="text-cyan-300 font-semibold">
            Explore earthquakes across the world, understand their magnitude,
            depth, and impact instantly —
          </span>{" "}
          all while learning how our planet shifts beneath our feet.
        </p>

        {/* Learn More Points */}
        <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base md:text-[0.95rem] lg:text-lg text-emerald-100 mb-8 animate-fadeIn">
          <li>🌍 Discover live earthquake hotspots across continents</li>
          <li>📊 Filter and compare seismic data by region & magnitude</li>
          <li>⚡ Learn how tectonic shifts create natural events</li>
          <li>🛡️ Awareness for preparedness & disaster resilience</li>
        </ul>

        {/* Enhanced Button */}
        <Link
          to="/core"
          className="px-8 sm:px-10 py-3 sm:py-4 text-lg rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-600 to-green-700 transform transition-all duration-300 shadow-lg shadow-emerald-900/60 hover:scale-110 hover:shadow-[0_0_30px_rgba(0,255,200,0.9)]"
        >
          View Earthquake Map
        </Link>
      </div>

      {/* Right side: Video */}
      <div className="relative w-full md:w-7/12 h-64 sm:h-96 md:h-full flex items-center justify-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-100"
        >
          <source src="/v2.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Overlay for blending */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/40"></div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/core" element={<CoreMap />} />
      </Routes>
    </Router>
  );
}
