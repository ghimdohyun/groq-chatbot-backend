export default async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  const groqApiKey = process.env.GROQ_API_KEY;

  // 🔥 DEBUG: 환경변수 확인
  console.log('API Key exists:', !!groqApiKey);
  console.log('API Key starts with gsk_:', groqApiKey?.startsWith('gsk_'));
  console.log('API Key length:', groqApiKey?.length);

  if (!message || !groqApiKey) {
    return res.status(400).json({ 
      error: 'Missing message or API key',
      hasKey: !!groqApiKey,
      hasMessage: !!message
    });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', data);
      return res.status(response.status).json({ 
        error: data.error?.message || 'Groq API error',
        status: response.status
      });
    }

    const reply = data.choices[0]?.message?.content || 'No response received';

    return res.status(200).json({
      choices: [
        {
          message: {
            content: reply,
          },
        },
      ],
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
