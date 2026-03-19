/**
 * 버전 확인용 테스트 엔드포인트
 */

interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return new Response(JSON.stringify({
    version: '2.0.0-gpt4',
    timestamp: new Date().toISOString(),
    features: ['GPT-4 Dynamic Questions', 'Aptitude Test Integration'],
    env: {
      hasOpenAIKey: !!context.env.OPENAI_API_KEY,
      openAIBaseURL: context.env.OPENAI_BASE_URL || 'not set'
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
