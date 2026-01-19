export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  // 디버깅용 로그
  console.log('API Key exists:', !!apiKey);
  console.log('Message received:', message);

  // 메시지 검증
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // API 키 검증
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not set in Vercel' });
  }

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    const data = await response.json();

    // Groq API 응답 에러 처리
    if (!response.ok) {
      console.error('Groq API error:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Groq API request failed',
      });
    }

    // 정상 응답
    return res.status(200).json({
      reply: data.choices[0].message.content,
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
