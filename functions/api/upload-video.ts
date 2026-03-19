/**
 * 면접 영상 업로드 API (Cloudflare R2)
 * - Multipart upload 지원
 * - 영상 메타데이터 저장 (D1)
 * - 고유 파일명 생성
 */

interface UploadRequest {
  sessionId: string;
  userId?: string;
  filename?: string;
  contentType?: string;
  size?: number;
  duration?: number;
}

export const onRequest: PagesFunction<{ R2: R2Bucket; DB: D1Database }> = async (context) => {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await context.request.formData();
    const videoFile = formData.get('video') as File;
    const sessionId = formData.get('sessionId') as string;
    const userId = formData.get('userId') as string || 'anonymous';
    const duration = parseInt(formData.get('duration') as string || '0');
    
    if (!videoFile) {
      return new Response(JSON.stringify({ error: 'No video file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // R2 버킷 확인
    if (!context.env.R2) {
      console.warn('⚠️ R2 bucket not configured, saving metadata only');
      
      // R2 없이도 메타데이터는 저장
      const recordingId = await saveRecordingMetadata(
        context.env.DB,
        sessionId,
        userId,
        null,
        videoFile.name,
        videoFile.type,
        videoFile.size,
        duration
      );
      
      return new Response(JSON.stringify({
        success: true,
        recordingId,
        message: 'Video metadata saved (R2 not configured)',
        size: videoFile.size
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 고유 파일명 생성
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = videoFile.name.split('.').pop() || 'webm';
    const key = `interviews/${userId}/${sessionId}_${timestamp}_${randomId}.${extension}`;

    // R2에 업로드
    const arrayBuffer = await videoFile.arrayBuffer();
    await context.env.R2.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: videoFile.type
      },
      customMetadata: {
        sessionId,
        userId,
        uploadedAt: new Date().toISOString()
      }
    });

    console.log(`✅ Video uploaded to R2: ${key} (${(videoFile.size / 1024 / 1024).toFixed(2)} MB)`);

    // D1에 메타데이터 저장
    const recordingId = await saveRecordingMetadata(
      context.env.DB,
      sessionId,
      userId,
      key,
      videoFile.name,
      videoFile.type,
      videoFile.size,
      duration
    );

    return new Response(JSON.stringify({
      success: true,
      recordingId,
      key,
      size: videoFile.size,
      sizeMB: (videoFile.size / 1024 / 1024).toFixed(2),
      message: 'Video uploaded successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Video upload error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Upload failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * 녹화 메타데이터 저장
 */
async function saveRecordingMetadata(
  db: D1Database,
  sessionId: string,
  userId: string,
  r2Key: string | null,
  filename: string,
  contentType: string,
  size: number,
  duration: number
): Promise<string> {
  const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    await db.prepare(`
      INSERT INTO interview_recordings 
      (recording_id, session_id, user_id, r2_key, filename, content_type, size, duration, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      recordingId,
      sessionId,
      userId,
      r2Key,
      filename,
      contentType,
      size,
      duration
    ).run();
    
    console.log(`✅ Recording metadata saved: ${recordingId}`);
    return recordingId;
    
  } catch (error) {
    console.error('❌ Failed to save recording metadata:', error);
    throw error;
  }
}
