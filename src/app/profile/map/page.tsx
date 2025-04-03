"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

// Set your Mapbox token
mapboxgl.accessToken =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "pk.eyJ1IjoicGV0ZXJ0IiwiYSI6ImNrczBheWdtbzAxemsycG80cTRvNWNnZm0ifQ.dZHxJh9K2QNtsnXm1EKKTg";

export default function MapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationName, setLocationName] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch user data to get location
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const response = await fetch(`/api/user/${session.user.id}`);

          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }

          const data = await response.json();
          setLocationName(data.location || null);
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Failed to load profile data. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [status, session]);

  // Geocode location name to coordinates
  useEffect(() => {
    const geocodeLocation = async () => {
      if (!locationName) {
        setError(
          "No location set in your profile. Please add a location first."
        );
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            locationName
          )}.json?access_token=${mapboxgl.accessToken}`
        );

        if (!response.ok) {
          throw new Error("Failed to geocode location");
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          setLocation({ lat, lng });
        } else {
          throw new Error("Location not found");
        }
      } catch (err) {
        console.error("Error geocoding location:", err);
        setError(
          "Failed to find your location on the map. Please try a different location."
        );
      } finally {
        setLoading(false);
      }
    };

    if (locationName) {
      geocodeLocation();
    }
  }, [locationName]);

  // Initialize map when location is available
  useEffect(() => {
    if (location && mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [location.lng, location.lat],
        zoom: 12,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl());

      // Add marker
      new mapboxgl.Marker()
        .setLngLat([location.lng, location.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>${locationName}</h3>`))
        .addTo(map.current);
    }
  }, [location, locationName]);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Location</h1>
        <Link
          href="/profile"
          className="px-4 py-2 text-indigo-600 hover:text-indigo-800"
        >
          Back to Profile
        </Link>
      </div>

      {error ? (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <div className="mt-2">
            <Link
              href="/profile"
              className="text-red-700 font-medium hover:underline"
            >
              Update your location
            </Link>
          </div>
        </div>
      ) : !location ? (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Trying to locate your position on the map...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div
            ref={mapContainer}
            className="h-[500px] w-full"
            style={{ position: "relative" }}
          />
          <div className="p-4 bg-gray-50">
            <p className="text-gray-700">
              <span className="font-medium">Your location:</span> {locationName}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
