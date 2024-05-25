import { ZKGeoPoint, ZKThreePointPolygon } from 'zklocus';

export async function POST(request) {
  const coordinates = await request.json();
  console.log('coordinates', coordinates)
  const { latitude, longitude } = coordinates;

//   try {
//     const zkGeoPoint = new ZKGeoPoint(latitude, longitude);
//     const polygon = await ZKThreePointPolygon(
//       { latitude: 52.49501, longitude: 13.44574 },
//       { latitude: 52.49401, longitude: 13.44416 },
//       { latitude: 52.49122, longitude: 13.44984 },
//       { latitude: 52.49271, longitude: 13.45210 }
//     );

//     const proof = await zkGeoPoint.Prove.inPolygon(polygon);

//     return new Response(JSON.stringify({ proof }), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   } catch (error) {
//     console.error('Error generating locus proof:', error);
//     return new Response(JSON.stringify({ error: 'An error occurred while generating the locus proof.' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
}