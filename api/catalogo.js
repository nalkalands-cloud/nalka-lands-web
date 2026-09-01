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

  // Field IDs (from list_tables_for_base) — stable even if the client renames a field's label.
  const FIELDS = {
    titulo: 'fldq37Ssx0tFytaVj',
    descripcion: 'fldzFeBnS5BmzrMET',
    precio: 'fldM0AKN3g5ElWjNd',
    tamano: 'fldjjkEzjgqbiUqOW',
    unidad: 'fldtO0gHD1SEtWNnh',
    categoria: 'fldJ7DC216FKKUSSG',
    operacion: 'fld5gb0B8ulmu5tob',
    comuna: 'fldKmzMSW5XlWgjaT',
    region: 'fldOf0UsUEvQiDTxc',
    imagenes: 'fldcv38plX3QKhOqK',
    publicado: 'fldtQFoowtjAwN7Ji',
    moneda: 'fldx89KFQGuP4j7hY',
    estadoPrecio: 'fldd9C1DymgzZGwYd',
    precioMax: 'fldKjyvAXlV9KQnSO',
    periodoArriendo: 'fld01vjFpNf0BrDin',
    tamanoMax: 'flds7AshfY0fQBKtR',
  };

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=${encodeURIComponent('{Publicado}=1')}&pageSize=100&returnFieldsByFieldId=true`;
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
        titulo: f[FIELDS.titulo] || '',
        descripcion: f[FIELDS.descripcion] || '',
        precioUF: typeof f[FIELDS.precio] === 'number' ? f[FIELDS.precio] : null,
        precioMax: typeof f[FIELDS.precioMax] === 'number' ? f[FIELDS.precioMax] : null,
        moneda: f[FIELDS.moneda] || 'UF',
        estadoPrecio: f[FIELDS.estadoPrecio] || 'Definido',
        periodoArriendo: f[FIELDS.periodoArriendo] || '',
        tamano: typeof f[FIELDS.tamano] === 'number' ? f[FIELDS.tamano] : null,
        tamanoMax: typeof f[FIELDS.tamanoMax] === 'number' ? f[FIELDS.tamanoMax] : null,
        unidad: f[FIELDS.unidad] || 'm²',
        categoria: f[FIELDS.categoria] || '',
        operacion: f[FIELDS.operacion] || '',
        comuna: f[FIELDS.comuna] || '',
        region: f[FIELDS.region] || '',
        imagenes: Array.isArray(f[FIELDS.imagenes]) ? f[FIELDS.imagenes].map((a) => a.url) : [],
      };
    });

    // Cache at the edge for 5 minutes so repeat visits/filters don't hammer Airtable's API.
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({ properties });
  } catch (err) {
    res.status(500).json({ error: 'Unexpected error fetching catálogo' });
  }
};
