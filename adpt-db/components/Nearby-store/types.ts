export type PlaceCategory = {
  name?: string;
};

export type PlaceLocation = {
  formatted_address?: string;
  address?: string;
  locality?: string;
  region?: string;
  country?: string;
};

export type PlaceGeocode = {
  main?: {
    latitude?: number;
    longitude?: number;
  };
  roof?: {
    latitude?: number;
    longitude?: number;
  };
};

export type Place = {
  fsq_id?: string;
  name?: string;
  distance?: number;
  tel?: string;
  location?: PlaceLocation;
  categories?: PlaceCategory[];
  geocodes?: PlaceGeocode;
  latitude?: number;
  longitude?: number;
};