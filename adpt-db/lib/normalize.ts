import { Place } from "@/components/Nearby-store/types";

export function getPlaceLat(place: Place): number | null {
  return (
    place.latitude ??
    place.geocodes?.main?.latitude ??
    place.geocodes?.roof?.latitude ??
    null
  );
}

export function getPlaceLon(place: Place): number | null {
  return (
    place.longitude ??
    place.geocodes?.main?.longitude ??
    place.geocodes?.roof?.longitude ??
    null
  );
}

export function getPlaceAddress(place: Place): string {
  const loc = place.location;
  const formatted = loc?.formatted_address ?? loc?.address ?? "";
  const fallback = [loc?.locality, loc?.region, loc?.country]
    .filter(Boolean)
    .join(", ");
  return formatted || fallback || "Address not available";
}

export function getCategoryText(place: Place): string {
  return (place.categories || [])
    .map((cat) => cat.name)
    .filter(Boolean)
    .join(", ");
}

export function buildExportRows(places: Place[]) {
  return places.map((place, index) => {
    const distance = place.distance ?? 0;
    return {
      "No.": index + 1,
      Name: place.name ?? "Unknown",
      Address: getPlaceAddress(place),
      Categories: getCategoryText(place),
      "Distance (m)": distance,
      "Distance (km)": Number((distance / 1000).toFixed(2)),
      Latitude: getPlaceLat(place) ?? "",
      Longitude: getPlaceLon(place) ?? "",
      Telephone: place.tel ?? "N/A"
    };
  });
}

export function formatDistance(distance?: number): string {
  if (!distance && distance !== 0) return "";
  return `${distance} m (${(distance / 1000).toFixed(2)} km)`;
}