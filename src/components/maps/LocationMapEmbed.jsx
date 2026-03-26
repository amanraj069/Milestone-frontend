import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const LocationMapEmbed = ({
  location,
  coordinates,
  heightClassName = "h-72",
  className = "",
}) => {
  const trimmedLocation = (location || "").trim();
  const hasLocationText = trimmedLocation.length > 0;
  const hasCoordinates =
    coordinates &&
    Number.isFinite(Number(coordinates.lat)) &&
    Number.isFinite(Number(coordinates.lng));

  if (!hasCoordinates) {
    const mapsSearchUrl = hasLocationText
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(trimmedLocation)}`
      : null;

    return (
      <div
        className={`rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white ${heightClassName} ${className} flex items-center justify-center p-6`}
      >
        <div className="max-w-xl text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
            </svg>
          </div>

          {!hasLocationText ? (
            <>
              <p className="text-base font-semibold text-gray-800">Add a location to preview map</p>
              <p className="mt-1 text-sm text-gray-600">
                Type city or address, then click <span className="font-medium">Pin This Location</span>.
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-gray-800">Location added</p>
              <p className="mt-1 text-sm text-gray-600">
                <span className="font-medium">{trimmedLocation}</span>
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Click <span className="font-medium">Pin This Location</span> to generate exact map coordinates.
              </p>
              {mapsSearchUrl && (
                <a
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Preview search in OpenStreetMap
                </a>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const position = [coordinates.lat, coordinates.lng];

  return (
    <div className={`rounded-xl border border-gray-200 overflow-hidden bg-white ${className}`}>
      <div className="px-4 py-2.5 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Map Preview</p>
        <p className="text-sm text-gray-700 truncate">{trimmedLocation || "Pinned Location"}</p>
      </div>
      <div className={heightClassName}>
        <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position}>
            <Popup>{trimmedLocation || "Pinned Location"}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationMapEmbed;