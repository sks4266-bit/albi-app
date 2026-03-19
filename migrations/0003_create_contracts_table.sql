-- 전자계약서 테이블
CREATE TABLE IF NOT EXISTS contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id TEXT UNIQUE NOT NULL,
  
  -- 근로자 정보
  worker_name TEXT NOT NULL,
  worker_birth TEXT,
  worker_phone TEXT,
  worker_address TEXT,
  worker_signature TEXT NOT NULL, -- Base64 이미지
  
  -- 사업주 정보
  employer_company TEXT NOT NULL,
  employer_name TEXT,
  employer_business_number TEXT,
  employer_phone TEXT,
  employer_address TEXT,
  employer_signature TEXT NOT NULL, -- Base64 이미지
  
  -- 근로조건
  work_start_date TEXT NOT NULL,
  work_end_date TEXT,
  work_hours TEXT,
  work_days TEXT,
  hourly_wage INTEGER NOT NULL,
  payment_day TEXT,
  job_description TEXT,
  
  -- 상태 및 메타데이터
  status TEXT DEFAULT 'active', -- active, completed, terminated
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_contract_id ON contracts(contract_id);
CREATE INDEX IF NOT EXISTS idx_worker_name ON contracts(worker_name);
CREATE INDEX IF NOT EXISTS idx_employer_company ON contracts(employer_company);
CREATE INDEX IF NOT EXISTS idx_created_at ON contracts(created_at);
