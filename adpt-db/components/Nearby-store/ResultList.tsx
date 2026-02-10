import { Place } from "./types";
import {
  formatDistance,
  getCategoryText,
  getPlaceAddress,
  getPlaceLat,
  getPlaceLon
} from '../../lib/normalize'

export default function ResultsList({ places }: { places: Place[] }) {
  return (
    <div className="results-list">
      {places.map((place, index) => {
        const lat = getPlaceLat(place);
        const lon = getPlaceLon(place);
        const categories = getCategoryText(place);
        return (
          <details key={place.fsq_id ?? `${place.name}-${index}`} className="card">
            <summary>
              <span className="index">{index + 1}.</span>
              <span className="name">{place.name ?? "Unknown"}</span>
              <span className="distance">
                {formatDistance(place.distance)}
              </span>
            </summary>
            <div className="card-body">
              <div>
                <span className="label">Address</span>
                <span>{getPlaceAddress(place)}</span>
              </div>
              {categories ? (
                <div>
                  <span className="label">Categories</span>
                  <span>{categories}</span>
                </div>
              ) : null}
              {lat !== null && lon !== null ? (
                <div>
                  <span className="label">Coordinates</span>
                  <span>
                    {lat}, {lon}
                  </span>
                </div>
              ) : null}
              <div>
                <span className="label">Telephone</span>
                <span>{place.tel ?? "N/A"}</span>
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}