// Serverless function: fetches published properties from Airtable and returns clean JSON.
// The Airtable token stays server-side (Vercel env var AIRTABLE_TOKEN) — it is never sent to the browser.

const BASE_ID = 'appRwgoLRmhJgHgZF';
const TABLE_ID = 'tbl9lQuhVlLTIALD2';

module.exports = async (req, res) => {
  const token = process.env.AIRTABLE_TOKEN;

  if (!token) {
    res.status(500).json({ error: 'Missing AIRTABLE_TOKEN environment variable' });
    return;
  }

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=${encodeURIComponent('{Publicado}=1')}&pageSize=100`;
    const airtableRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!airtableRes.ok) {
      res.status(502).json({ error: 'Airtable request failed', status: airtableRes.status });
      return;
    }

    const data = await airtableRes.json();

    const properties = (data.records || []).map((record) => {
      const f = record.fields || {};
      return {
        id: record.id,
        titulo: f['Título'] || '',
        descripcion: f['Descripción'] || '',
        precioUF: typeof f['Precio (UF)'] === 'number' ? f['Precio (UF)'] : null,
        tamano: typeof f['Tamaño'] === 'number' ? f['Tamaño'] : null,
        unidad: f['Unidad'] || 'm²',
        categoria: f['Categoría'] || '',
        operacion: f['Operación'] || '',
        comuna: f['Comuna'] || '',
        region: f['Región'] || '',
        imagenes: Array.isArray(f['Imágenes']) ? f['Imágenes'].map((a) => a.url) : [],
      };
    });

    // Cache at the edge for 5 minutes so repeat visits/filters don't hammer Airtable's API.
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({ properties });
  } catch (err) {
    res.status(500).json({ error: 'Unexpected error fetching catálogo' });
  }
};
