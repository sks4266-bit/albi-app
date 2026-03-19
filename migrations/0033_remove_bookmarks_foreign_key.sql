-- ============================================
-- bookmarks 테이블 FOREIGN KEY 제약 제거
-- (Mock 데이터도 북마크 가능하도록)
-- ============================================

-- 1. 기존 bookmarks 테이블 백업
CREATE TABLE IF NOT EXISTS bookmarks_backup AS SELECT * FROM bookmarks;

-- 2. 기존 bookmarks 테이블 삭제
DROP TABLE IF EXISTS bookmarks;

-- 3. 새로운 bookmarks 테이블 생성 (FOREIGN KEY 없이)
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, job_id)
);

-- 4. 백업 데이터 복원
INSERT INTO bookmarks (id, user_id, job_id, created_at)
SELECT id, user_id, job_id, created_at 
FROM bookmarks_backup;

-- 5. 백업 테이블 삭제
DROP TABLE IF EXISTS bookmarks_backup;

-- 6. 인덱스 재생성
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_job ON bookmarks(job_id);
