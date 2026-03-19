-- 자유게시판 테이블
CREATE TABLE IF NOT EXISTS board_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_popular INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 게시글 인덱스
CREATE INDEX IF NOT EXISTS idx_board_posts_created_at ON board_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_posts_user_id ON board_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_board_posts_popular ON board_posts(is_popular, created_at DESC);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS board_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id TEXT,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES board_posts(id) ON DELETE CASCADE
);

-- 댓글 인덱스
CREATE INDEX IF NOT EXISTS idx_board_comments_post_id ON board_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_board_comments_user_id ON board_comments(user_id);

-- 좋아요 테이블
CREATE TABLE IF NOT EXISTS board_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES board_posts(id) ON DELETE CASCADE
);

-- 좋아요 인덱스
CREATE INDEX IF NOT EXISTS idx_board_likes_post_user ON board_likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_board_likes_user ON board_likes(user_id);

-- 신고 테이블
CREATE TABLE IF NOT EXISTS board_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK(target_type IN ('post', 'comment')),
  target_id INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK(reason IN ('spam', 'abuse', 'inappropriate', 'other')),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 신고 인덱스
CREATE INDEX IF NOT EXISTS idx_board_reports_reporter ON board_reports(reporter_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_board_reports_target ON board_reports(target_type, target_id);
