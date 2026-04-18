import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getBackendBaseUrl } from '../../utils/backendBaseUrl';

const LocationMapEmbed = ({
  location,
  coordinates,
  heightClassName = "h-72",
  className = "",
}) => {
  const parseCoordinate = (value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const trimmedLocation = (location || "").trim();
  const apiBaseUrl = getBackendBaseUrl();
  const hasLocationText = trimmedLocation.length > 0;
  const isRemoteLocation = /(^remote$|\bremote\b)/i.test(trimmedLocation);
  const lat = parseCoordinate(coordinates?.lat);
  const lng = parseCoordinate(coordinates?.lng);
  const [resolvedCoordinates, setResolvedCoordinates] = useState(
    lat !== null && lng !== null ? { lat, lng } : null,
  );
  const [isResolvingCoordinates, setIsResolvingCoordinates] = useState(false);

  useEffect(() => {
    if (lat !== null && lng !== null) {
      setResolvedCoordinates({ lat, lng });
      setIsResolvingCoordinates(false);
      return;
    }
    setResolvedCoordinates(null);
  }, [lat, lng]);

  useEffect(() => {
    if (lat !== null && lng !== null) return;
    if (!hasLocationText || isRemoteLocation) return;

    let cancelled = false;
    const controller = new AbortController();

    const resolveFromLocation = async () => {
      try {
        setIsResolvingCoordinates(true);
        const response = await fetch(
          `${apiBaseUrl}/api/geocode?q=${encodeURIComponent(trimmedLocation)}&limit=1`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const firstResult = data?.data?.[0];
        const resolvedLat = parseCoordinate(firstResult?.lat);
        const resolvedLng = parseCoordinate(firstResult?.lon ?? firstResult?.lng);

        if (!cancelled && resolvedLat !== null && resolvedLng !== null) {
          setResolvedCoordinates({ lat: resolvedLat, lng: resolvedLng });
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.warn("Failed to resolve map coordinates from location", error);
        }
      } finally {
        if (!cancelled) {
          setIsResolvingCoordinates(false);
        }
      }
    };

    resolveFromLocation();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiBaseUrl, hasLocationText, isRemoteLocation, lat, lng, trimmedLocation]);

  const hasCoordinates =
    resolvedCoordinates &&
    resolvedCoordinates.lat !== null &&
    resolvedCoordinates.lng !== null;

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
          ) : isResolvingCoordinates ? (
            <>
              <p className="text-base font-semibold text-gray-800">Locating map preview...</p>
              <p className="mt-1 text-sm text-gray-600">
                Finding coordinates for <span className="font-medium">{trimmedLocation}</span>.
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-gray-800">Location added</p>
              <p className="mt-1 text-sm text-gray-600">
                <span className="font-medium">{trimmedLocation}</span>
              </p>
              {isRemoteLocation ? (
                <p className="mt-2 text-sm text-gray-600">
                  Remote jobs do not have a fixed map pin.
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-600">
                  Click <span className="font-medium">Pin This Location</span> to generate exact map coordinates.
                </p>
              )}
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

  const position = [resolvedCoordinates.lat, resolvedCoordinates.lng];

  return (
    <div className={`rounded-xl border border-gray-200 overflow-hidden bg-white relative z-0 ${className}`}>
      <div className="px-4 py-2.5 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Map Preview</p>
        <p className="text-sm text-gray-700 truncate">{trimmedLocation || "Pinned Location"}</p>
      </div>
      <div className={`${heightClassName} relative z-0`}>
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