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

    // Newest-added first, so the homepage preview (which just takes the first N)
    // always shows the most recently published listings.
    const records = (data.records || []).sort(
      (a, b) => new Date(b.createdTime) - new Date(a.createdTime)
    );

    const properties = records.map((record) => {
      const f = record.fields || {};
      return {
        id: record.id,
        titulo: f['Título'] || '',
        descripcion: f['Descripción'] || '',
        precioUF: typeof f['Precio (UF)'] === 'number' ? f['Precio (UF)'] : null,
        precioMax: typeof f['Precio Máx'] === 'number' ? f['Precio Máx'] : null,
        moneda: f['Moneda'] || 'UF',
        estadoPrecio: f['Estado del Precio'] || 'Definido',
        periodoArriendo: f['Período de Arriendo'] || '',
        tamano: typeof f['Tamaño'] === 'number' ? f['Tamaño'] : null,
        tamanoMax: typeof f['Tamaño Máx'] === 'number' ? f['Tamaño Máx'] : null,
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
