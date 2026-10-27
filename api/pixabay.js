// Vercel Serverless Function: Pixabay API 프록시
// API Key는 Vercel 환경변수 PIXABAY_API_KEY 에서만 읽어요. (브라우저/코드에 노출되지 않음)
module.exports = async (req, res) => {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'PIXABAY_API_KEY 환경변수가 설정되지 않았어요.' });
  }

  const q = String(req.query.q || '').trim().slice(0, 100);
  if (!q) {
    return res.status(400).json({ error: '검색어를 입력하세요.' });
  }
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 50);

  const url = 'https://pixabay.com/api/?' + new URLSearchParams({
    key,
    q,
    page,
    per_page: 10,
    image_type: 'photo',
    lang: 'ko',
    safesearch: 'true'
  });

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Pixabay 요청 실패 (' + upstream.status + ')' });
    }
    const data = await upstream.json();
    const hits = (data.hits || []).map(h => ({
      id: h.id,
      src: h.webformatURL,
      tags: h.tags,
      user: h.user,
      pageURL: h.pageURL
    }));
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json({ totalHits: data.totalHits || 0, hits });
  } catch (err) {
    return res.status(502).json({ error: 'Pixabay 서버에 연결하지 못했어요.' });
  }
};
