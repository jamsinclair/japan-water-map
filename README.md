# Japan Water & Toilet Map

An interactive map displaying drinking water fountains and public toilets across all 47 Japanese prefectures.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to view the map

## Data Collection

Water fountain and toilet location data is sourced from OpenStreetMap using the Overpass API. Run the data fetching script to update locations:

```bash
node scripts/fetch-water-features.js
```

This script queries OpenStreetMap for:
- `amenity=drinking_water` (water fountains)
- `amenity=toilets` (public toilets)

Data is saved as GeoJSON files in `public/data/` for each prefecture.

## Tech Stack

- **Frontend**: Preact
- **Mapping**: MapLibre GL JS
- **Map Tiles**: [Stadia Maps](https://stadiamaps.com/products/maps/) (works on localhost; requires account and domain allowlisting for deployment)
- **Data**: OpenStreetMap via Overpass API
- **Styling**: Tailwind CSS

## License

MIT
