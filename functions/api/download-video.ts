/**
 * 면접 영상 다운로드 API (Cloudflare R2)
 * - R2에서 영상 스트리밍
 * - Range 요청 지원 (부분 다운로드)
 * - 권한 확인
 */

export const onRequest: PagesFunction<{ R2: R2Bucket; DB: D1Database }> = async (context) => {
  if (context.request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(context.request.url);
    const recordingId = url.searchParams.get('id');
    
    if (!recordingId) {
      return new Response(JSON.stringify({ error: 'Recording ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // R2 확인
    if (!context.env.R2) {
      return new Response(JSON.stringify({ error: 'R2 storage not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // D1에서 메타데이터 조회
    const recording = await context.env.DB
      .prepare('SELECT * FROM interview_recordings WHERE recording_id = ?')
      .bind(recordingId)
      .first();

    if (!recording) {
      return new Response(JSON.stringify({ error: 'Recording not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!recording.r2_key) {
      return new Response(JSON.stringify({ error: 'Video file not available' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // R2에서 영상 가져오기
    const object = await context.env.R2.get(recording.r2_key as string);

    if (!object) {
      return new Response(JSON.stringify({ error: 'Video file not found in storage' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Range 요청 처리
    const range = context.request.headers.get('Range');
    
    if (range) {
      // Range 요청 지원 (비디오 스트리밍용)
      const rangeMatch = range.match(/bytes=(\d+)-(\d*)/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1]);
        const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : object.size - 1;
        const length = end - start + 1;

        return new Response(object.body, {
          status: 206,
          headers: {
            'Content-Type': recording.content_type as string,
            'Content-Range': `bytes ${start}-${end}/${object.size}`,
            'Content-Length': length.toString(),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000'
          }
        });
      }
    }

    // 전체 파일 반환
    return new Response(object.body, {
      status: 200,
      headers: {
        'Content-Type': recording.content_type as string,
        'Content-Length': object.size.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': `inline; filename="${recording.filename}"`
      }
    });

  } catch (error: any) {
    console.error('❌ Video download error:', error);
    
    return new Response(JSON.stringify({
      error: error.message || 'Download failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
