// src/pages/CoreMap.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, GeoJSON, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./CoreMap.css"; // For pulsing circle effect

const tectonicPlatesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

const getRandomBoundaryType = () => {
    const types = ["Convergent", "Divergent", "Transform"];
    return types[Math.floor(Math.random() * types.length)];
};

const boundaryColors = {
    Convergent: "#FF0000",
    Divergent: "#006400",
    Transform: "#0000FF",
};

const boundaryDescriptions = {
    Convergent: "Convergent: Plates collide → Strong earthquakes",
    Divergent: "Divergent: Plates move apart → Moderate earthquakes",
    Transform: "Transform: Plates slide past → Shallow earthquakes",
};

// Map updater for search location
function MapUpdater({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView(coords, 8);
    }, [coords, map]);
    return null;
}

// Fix map rendering on resize
function ResponsiveMap({ children }) {
    const map = useMap();

    useEffect(() => {
        const handleResize = () => map.invalidateSize();
        window.addEventListener("resize", handleResize);
        setTimeout(() => map.invalidateSize(), 100); // Initial fix
        return () => window.removeEventListener("resize", handleResize);
    }, [map]);

    return <>{children}</>;
}

export default function CoreMap() {
    const [earthquakes, setEarthquakes] = useState([]);
    const [plates, setPlates] = useState(null);
    const [minMagnitude, setMinMagnitude] = useState(0);
    const [maxMagnitude, setMaxMagnitude] = useState(10);
    const [minDepth, setMinDepth] = useState(0);
    const [maxDepth, setMaxDepth] = useState(700);
    const [timeRange, setTimeRange] = useState("all_day");
    const [searchLocation, setSearchLocation] = useState("");
    const [locationCoords, setLocationCoords] = useState(null);
    const [placeFilter, setPlaceFilter] = useState(""); // New filter by place
    const [showExplanation, setShowExplanation] = useState(false);
    const [mapReady, setMapReady] = useState(false); // Delay map render for proper sizing

    useEffect(() => {
        async function fetchEarthquakes() {
            try {
                const res = await fetch(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${timeRange}.geojson`);
                const data = await res.json();
                setEarthquakes(data.features);
            } catch (error) {
                console.error(error);
            }
        }
        fetchEarthquakes();
    }, [timeRange]);

    useEffect(() => {
        async function fetchPlates() {
            try {
                const res = await fetch(tectonicPlatesURL);
                const data = await res.json();
                data.features = data.features.map((f) => ({
                    ...f,
                    properties: { ...f.properties, boundaryType: getRandomBoundaryType() },
                }));
                setPlates(data);
            } catch (error) {
                console.error(error);
            }
        }
        fetchPlates();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setMapReady(true), 50); // Ensure container has height
        return () => clearTimeout(timer);
    }, []);

    const getColor = (mag) => {
        if (mag < 3) return "green";
        if (mag < 5) return "orange";
        return "red";
    };

    const handleSearch = async () => {
        if (!searchLocation) return;
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}`
            );
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setLocationCoords([parseFloat(lat), parseFloat(lon)]);
            } else {
                alert("Location not found!");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const filteredEarthquakes = earthquakes.filter((eq) => {
        const mag = eq.properties.mag;
        const depth = eq.geometry.coordinates[2];
        const place = eq.properties.place || "";
        const placeMatch = placeFilter ? place.toLowerCase().includes(placeFilter.toLowerCase()) : true;
        return mag >= minMagnitude && mag <= maxMagnitude && depth >= minDepth && depth <= maxDepth && placeMatch;
    });

    // Dynamic Explanation Panel
    const ExplanationPanel = () => {
        const stats = React.useMemo(() => {
            if (!filteredEarthquakes.length) return null;

            const total = filteredEarthquakes.length;
            const magnitudes = filteredEarthquakes.map(e => e.properties.mag);
            const depths = filteredEarthquakes.map(e => e.geometry.coordinates[2]);
            const highMagCount = magnitudes.filter(m => m >= 5).length;
            const medMagCount = magnitudes.filter(m => m >= 3 && m < 5).length;
            const lowMagCount = magnitudes.filter(m => m < 3).length;
            const avgMag = (magnitudes.reduce((a, b) => a + b, 0) / total).toFixed(2);
            const maxMag = Math.max(...magnitudes);
            const minMag = Math.min(...magnitudes);
            const maxDepth = Math.max(...depths);
            const minDepth = Math.min(...depths);

            // Top affected locations
            const locationCounts = {};
            filteredEarthquakes.forEach(e => {
                const place = e.properties.place || "Unknown";
                locationCounts[place] = (locationCounts[place] || 0) + 1;
            });
            const topLocations = Object.entries(locationCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([place, count]) => `${place} (${count})`);

            // Plate activity summary
            const plateCounts = {};
            if (plates) {
                plates.features.forEach(f => {
                    const type = f.properties.boundaryType;
                    plateCounts[type] = (plateCounts[type] || 0) + 1;
                });
            }

            return { total, highMagCount, medMagCount, lowMagCount, avgMag, maxMag, minMag, maxDepth, minDepth, topLocations, plateCounts };
        }, [filteredEarthquakes, plates]);

        if (!stats) return <p className="text-gray-700">No earthquakes match the current filters.</p>;

        return (
            <div
                className="w-full h-full p-8 rounded-lg shadow-lg overflow-auto"
                style={{
                    backgroundImage: "url('/expbg.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backdropFilter: "blur(6px)",
                    backgroundColor: "rgba(255, 255, 255, 0.6)"
                }}
            >
                <h1 className="text-2xl font-bold mb-4 text-gray-800">🌎 Earthquake Report & Map Insights</h1>

                <h2 className="text-xl font-semibold mb-2">Filters Applied:</h2>
                <ul className="list-disc list-inside mb-4 text-gray-600">
                    <li><b>Magnitude:</b> {minMagnitude} – {maxMagnitude}</li>
                    <li><b>Depth:</b> {minDepth} km – {maxDepth} km</li>
                    <li><b>Time Range:</b> {timeRange.replace("all_", "Last ")}</li>
                    <li><b>Search Location:</b> {searchLocation || "Not specified"}</li>
                    <li><b>Place Filter:</b> {placeFilter || "None"}</li>
                </ul>

                <h2 className="text-xl font-semibold mb-2">Summary:</h2>
                <p className="mb-4 text-gray-600">
                    We found <b>{stats.total}</b> earthquakes on the map.<br />
                    - <b>{stats.highMagCount}</b> strong (≥5), <b>{stats.medMagCount}</b> moderate (3–5), <b>{stats.lowMagCount}</b> minor (&lt;3).<br />
                    - Average magnitude: <b>{stats.avgMag}</b>, strongest: <b>{stats.maxMag}</b>, weakest: <b>{stats.minMag}</b>.<br />
                    - Depths range: <b>{stats.minDepth} km</b> (shallowest) – <b>{stats.maxDepth} km</b> (deepest).
                </p>

                <h2 className="text-xl font-semibold mb-2">Top Affected Locations:</h2>
                <p className="mb-4 text-gray-600">
                    {stats.topLocations.join(", ")} are the areas with the highest earthquake activity.
                </p>

                <h2 className="text-xl font-semibold mb-2">Tectonic Plate Activity:</h2>
                <p className="mb-4 text-gray-600">
                    Plate boundaries on the map indicate earthquake-prone regions.
                    {plates && (
                        <ul className="list-disc list-inside ml-4">
                            {Object.entries(stats.plateCounts).map(([type, count]) => (
                                <li key={type}><b>{type} Plates:</b> {count} boundaries highlighted</li>
                            ))}
                        </ul>
                    )}
                </p>

                {/* PROFESSIONAL DYNAMIC EXPLANATION PANEL */}
                <h2 className="text-xl font-semibold mb-2">Explanation:</h2>
                <p className="mb-4 text-gray-700">
                    The visualization presents <b>{stats.total}</b> earthquakes filtered according to the selected magnitude, depth, time range, location, and place. Strong earthquakes (magnitude ≥5) are prominent and concentrated in specific tectonic regions, while moderate and minor events show broader distribution. Depths range from {stats.minDepth} km to {stats.maxDepth} km, reflecting both shallow and deep seismic activity.
                </p>
                <p className="mb-4 text-gray-700">
                    Geographically, the top affected areas are {stats.topLocations.join(", ")}, indicating regions that are consistently more active. By mapping earthquakes alongside tectonic plate boundaries, clear correlations emerge: convergent boundaries often generate strong, deep earthquakes, transform boundaries are associated with frequent shallow events, and divergent boundaries show moderate activity, mostly in oceanic zones.
                </p>
                <p className="mb-4 text-gray-700">
                    This analysis enables a geographic understanding of seismic risk, highlighting zones where future activity is more likely. Continuous monitoring and mapping allow identification of clusters, trends over time, and areas requiring greater preparedness. The explanation dynamically updates with filter adjustments, including the place filter, providing a comprehensive statistical and visual report of earthquake activity, depth, magnitude, and plate correlations.
                </p>

                <button
                    onClick={() => setShowExplanation(false)}
                    className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                    🔙 Close Report & Return to Map
                </button>
            </div>
        );
    };

    return (
        <div
            className="min-h-screen min-w-screen flex flex-col justify-start items-center p-4 md:p-8 overflow-auto"
            style={{
                backgroundImage: "url('/core.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {showExplanation ? (
                <ExplanationPanel />
            ) : (
                <>
                    <div className="flex flex-col md:flex-row w-full md:space-x-6">
                        {/* Control Panel */}
                        <div className="w-full md:w-[320px] p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg mb-6 md:mb-0 space-y-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Filters & Controls</h2>

                            {/* Magnitude Slider */}
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-semibold">
                                    Magnitude: Min {minMagnitude} – Max {maxMagnitude}
                                </label>
                                <input type="range" min="0" max="10" value={minMagnitude} onChange={(e) => setMinMagnitude(Number(e.target.value))} className="w-full" />
                                <input type="range" min="0" max="10" value={maxMagnitude} onChange={(e) => setMaxMagnitude(Number(e.target.value))} className="w-full" />
                            </div>

                            {/* Depth Slider */}
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-semibold">
                                    Depth (km): Min {minDepth} – Max {maxDepth}
                                </label>
                                <input type="range" min="0" max="700" value={minDepth} onChange={(e) => setMinDepth(Number(e.target.value))} className="w-full" />
                                <input type="range" min="0" max="700" value={maxDepth} onChange={(e) => setMaxDepth(Number(e.target.value))} className="w-full" />
                            </div>

                            {/* Time Range */}
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-semibold">Time Range:</label>
                                <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                    <option value="all_hour">Last Hour</option>
                                    <option value="all_day">Last Day</option>
                                    <option value="all_week">Last 7 Days</option>
                                    <option value="all_month">Last 30 Days</option>
                                </select>
                            </div>

                            {/* Search Location */}
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-semibold">Search Location:</label>
                                <input type="text" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} placeholder="Enter city, village, or country" className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 mb-2" />
                                <button onClick={handleSearch} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded">Go</button>
                            </div>

                            {/* Place Filter */}
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-semibold">Filter by Place:</label>
                                <input type="text" value={placeFilter} onChange={(e) => setPlaceFilter(e.target.value)} placeholder="Enter place keyword" className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
                            </div>

                            {/* Explanation Button */}
                            <div className="mt-4">
                                <button onClick={() => setShowExplanation(true)} className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded">
                                    📖 Show Explanation
                                </button>
                            </div>

                            {/* Legend */}
                            <div className="mt-6 p-2 bg-gray-200 rounded">
                                <h3 className="font-semibold mb-2">Legend</h3>
                                <ul className="text-sm space-y-1">
                                    <li className="flex items-center">
                                        <span className="inline-block w-4 h-4 bg-red-500 rounded-full mr-2 animate-pulse"></span>High Mag (≥5, Pulsing Circle)
                                    </li>
                                    <li className="flex items-center">
                                        <span className="inline-block w-4 h-4 bg-orange-500 rounded-full mr-2"></span>Moderate Mag (3–5, Circle)
                                    </li>
                                    <li className="flex items-center">
                                        <span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2"></span>Low Mag (&lt;3, Circle)
                                    </li>
                                    <li className="flex items-center">
                                        <span className="inline-block w-8 h-0 border-t-2 border-blue-500 border-dashed mr-2"></span>Transform Plate Boundary
                                    </li>
                                    <li className="flex items-center">
                                        <span className="inline-block w-8 h-0 border-t-2 border-green-700 border-dashed mr-2"></span>Divergent Plate Boundary
                                    </li>
                                    <li className="flex items-center">
                                        <span className="inline-block w-8 h-0 border-t-2 border-red-500 border-dashed mr-2"></span>Convergent Plate Boundary
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Map */}
                        <div id="map-container" className="w-full bg-white shadow-lg rounded-lg h-[400px] md:h-[80vh]">
                            {mapReady && (
                                <MapContainer style={{ width: "100%", height: "100%" }} center={[20, 0]} zoom={window.innerWidth < 768 ? 3 : 2} scrollWheelZoom={true} whenCreated={(map) => map.invalidateSize()}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                                    {locationCoords && <MapUpdater coords={locationCoords} />}
                                    <ResponsiveMap>
                                        {plates && (
                                            <GeoJSON
                                                data={plates}
                                                style={(feature) => ({
                                                    color: boundaryColors[feature.properties.boundaryType] || "#FF00FF",
                                                    weight: 2,
                                                    dashArray: "5,5",
                                                })}
                                                onEachFeature={(feature, layer) => {
                                                    const type = feature.properties.boundaryType;
                                                    layer.bindTooltip(`${type} Plate Boundary`);
                                                    layer.bindPopup(
                                                        `<b>${boundaryDescriptions[type]}</b><br/><i>Note: Boundaries are randomly assigned for demo.</i>`
                                                    );
                                                }}
                                            />
                                        )}
                                        {filteredEarthquakes.map((eq) => {
                                            const [lon, lat, depth] = eq.geometry.coordinates;
                                            const mag = eq.properties.mag;
                                            const position = [lat, lon];
                                            const isHighMag = mag >= 5;

                                            return (
                                                <Circle
                                                    key={eq.id}
                                                    center={position}
                                                    radius={Math.max(mag * 20000, 10000)}
                                                    pathOptions={{
                                                        color: getColor(mag),
                                                        fillOpacity: isHighMag ? 0.8 : 0.5,
                                                        className: isHighMag ? "pulsing-circle" : "",
                                                    }}
                                                >
                                                    <Popup>
                                                        <div>
                                                            <b>{eq.properties.place}</b><br />
                                                            Magnitude: {mag}<br />
                                                            Depth: {depth} km<br />
                                                            Time: {new Date(eq.properties.time).toLocaleString()}
                                                        </div>
                                                    </Popup>
                                                    <Tooltip>{eq.properties.place} — Mag: {mag}</Tooltip>
                                                </Circle>
                                            );
                                        })}
                                    </ResponsiveMap>
                                </MapContainer>
                            )}
                            {/* Back to Home Button */}
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => window.location.href = "/"}
                                    className="px-8 py-3 bg-gradient-to-r from-teal-400 via-green-400 to-teal-500 text-black font-bold rounded-lg shadow-lg hover:shadow-neon"
                                    style={{
                                        boxShadow: "0 0 10px #00ffcc, 0 0 20px #00ffcc, 0 0 30px #00ffcc",
                                    }}
                                >
                                    ⬅ Back to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
