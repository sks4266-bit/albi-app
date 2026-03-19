/**
 * AI 면접관 음성 생성 API (TTS) - 다국어 지원
 * 한국어, 영어, 중국어 지원
 */

export const onRequestPost = async (context: any) => {
  try {
    const { text, voice, language = 'ko' } = await context.request.json();
    
    if (!text) {
      return new Response(JSON.stringify({
        success: false,
        error: '텍스트가 필요합니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 언어별 음성 선택
    const voiceMap: { [key: string]: string } = {
      'ko': voice || 'alloy',  // 한국어 친화적
      'en': voice || 'nova',    // 영어 원어민
      'zh': voice || 'shimmer'  // 중국어 친화적
    };

    const selectedVoice = voiceMap[language] || 'alloy';

    // OpenAI TTS 사용
    const apiKey = context.env.OPENAI_API_KEY;
    
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: selectedVoice,
        input: text,
        speed: 1.0
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS API error: ${response.status}`);
    }

    // 오디오 데이터를 Base64로 변환
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );

    return new Response(JSON.stringify({
      success: true,
      audio: `data:audio/mpeg;base64,${base64Audio}`,
      text,
      language,
      voice: selectedVoice
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[InterviewerVoice] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || '음성 생성 실패'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
