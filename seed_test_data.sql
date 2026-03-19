-- ========================================
-- 테스트 데이터 생성 스크립트
-- ========================================

-- 1. 구직자 7명 생성
INSERT INTO users (id, email, password_hash, name, phone, user_type, created_at) VALUES
('jobseeker001', 'kim.minjun@test.com', '$2a$10$test.hashed.password.001', '김민준', '010-1111-0001', 'jobseeker', datetime('now', '-30 days')),
('jobseeker002', 'lee.seoyeon@test.com', '$2a$10$test.hashed.password.002', '이서연', '010-1111-0002', 'jobseeker', datetime('now', '-25 days')),
('jobseeker003', 'park.jihoon@test.com', '$2a$10$test.hashed.password.003', '박지훈', '010-1111-0003', 'jobseeker', datetime('now', '-20 days')),
('jobseeker004', 'choi.yuna@test.com', '$2a$10$test.hashed.password.004', '최유나', '010-1111-0004', 'jobseeker', datetime('now', '-15 days')),
('jobseeker005', 'jung.minho@test.com', '$2a$10$test.hashed.password.005', '정민호', '010-1111-0005', 'jobseeker', datetime('now', '-10 days')),
('jobseeker006', 'kang.sohee@test.com', '$2a$10$test.hashed.password.006', '강소희', '010-1111-0006', 'jobseeker', datetime('now', '-5 days')),
('jobseeker007', 'song.taehyung@test.com', '$2a$10$test.hashed.password.007', '송태형', '010-1111-0007', 'jobseeker', datetime('now', '-3 days'));

-- 2. 구인자 3명 생성
INSERT INTO users (id, email, password_hash, name, phone, user_type, business_registration_verified, created_at) VALUES
('employer001', 'cafe.owner@test.com', '$2a$10$test.hashed.password.101', '김카페', '010-2222-0001', 'employer', 1, datetime('now', '-60 days')),
('employer002', 'cvs.owner@test.com', '$2a$10$test.hashed.password.102', '이편의', '010-2222-0002', 'employer', 1, datetime('now', '-50 days')),
('employer003', 'restaurant.owner@test.com', '$2a$10$test.hashed.password.103', '박식당', '010-2222-0003', 'employer', 1, datetime('now', '-40 days'));

-- 3. 공고 10개 생성
INSERT INTO jobs (id, user_id, title, company_name, job_type, hourly_wage, address, region, latitude, longitude, description, work_hours, work_days, is_urgent, status, views, created_at) VALUES
('job001', 'employer001', '스타벅스 강남점 바리스타 모집', '스타벅스 강남역점', 'cafe', 12000, '서울특별시 강남구 강남대로 지하 396', '서울 강남구', 37.4979, 127.0276, '스타벅스 강남역점에서 함께 일할 열정적인 바리스타를 찾습니다. 1시간 체험을 통해 카페 업무를 경험해보세요!', '09:00-18:00', '월,화,수,목,금', 1, 'active', 45, datetime('now', '-7 days')),
('job002', 'employer002', 'GS25 홍대입구점 편의점 알바', 'GS25 홍대입구점', 'cvs', 10500, '서울특별시 마포구 양화로 188', '서울 마포구', 37.5572, 126.9226, '홍대 근처 편의점에서 아르바이트 모집합니다. 밤 시간대 근무 가능하신 분 환영!', '22:00-06:00', '월,수,금,토,일', 1, 'active', 67, datetime('now', '-6 days')),
('job003', 'employer003', '본죽 강남점 주방보조 및 서빙', '본죽&비빔밥카페 강남점', 'restaurant', 11000, '서울특별시 강남구 테헤란로 152', '서울 강남구', 37.4987, 127.0303, '본죽 매장에서 주방보조 및 서빙 업무를 담당할 분을 찾습니다. 친절하고 성실하신 분!', '11:00-15:00', '월,화,수,목,금', 0, 'active', 34, datetime('now', '-5 days')),
('job004', 'employer001', '이디야커피 신촌점 카페 알바', '이디야커피 신촌역점', 'cafe', 10500, '서울특별시 서대문구 신촌로 83', '서울 서대문구', 37.5551, 126.9368, '이디야커피에서 주말 근무 가능하신 분을 모집합니다. 경험자 우대!', '14:00-20:00', '토,일', 0, 'active', 28, datetime('now', '-4 days')),
('job005', 'employer002', 'CU 부산대점 편의점 직원', 'CU 부산대학교점', 'cvs', 10300, '부산광역시 금정구 부산대학로63번길 2', '부산 금정구', 35.2317, 129.0837, '부산대 근처 CU에서 오후 시간대 근무할 분을 찾습니다.', '14:00-22:00', '월,화,수,목,금,토,일', 0, 'active', 19, datetime('now', '-3 days')),
('job006', 'employer003', 'BBQ 대구점 치킨 배달 및 홀', 'BBQ 대구수성점', 'restaurant', 11500, '대구광역시 수성구 달구벌대로 2397', '대구 수성구', 35.8303, 128.6303, 'BBQ에서 배달 및 홀 서빙을 함께 할 분을 모집합니다. 오토바이 운전 가능하신 분 우대!', '17:00-23:00', '월,화,수,목,금,토,일', 1, 'active', 52, datetime('now', '-2 days')),
('job007', 'employer001', '투썸플레이스 판교점 카페 직원', '투썸플레이스 판교테크노밸리점', 'cafe', 12500, '경기도 성남시 분당구 판교역로 166', '경기 성남시', 37.3954, 127.1114, '투썸플레이스에서 디저트 제조 및 카페 업무를 담당할 분을 찾습니다.', '10:00-18:00', '월,화,수,목,금', 0, 'active', 41, datetime('now', '-1 days')),
('job008', 'employer002', '다이소 종로점 판매직', '다이소 종로3가점', 'retail', 10500, '서울특별시 종로구 종로 193', '서울 종로구', 37.5701, 126.9915, '다이소 매장에서 진열 및 판매 업무를 담당할 분을 모집합니다.', '13:00-21:00', '화,수,목,금,토', 0, 'active', 36, datetime('now', '-1 days')),
('job009', 'employer003', '맥도날드 잠실점 크루 모집', '맥도날드 잠실역점', 'fastfood', 11000, '서울특별시 송파구 올림픽로 240', '서울 송파구', 37.5133, 127.1000, '맥도날드에서 함께 일할 크루를 모집합니다. 청결하고 친절한 분!', '06:00-14:00', '월,화,수,목,금,토,일', 0, 'active', 61, datetime('now')),
('job010', 'employer001', '올리브영 강남점 뷰티 어드바이저', '올리브영 강남중앙점', 'retail', 13000, '서울특별시 강남구 강남대로 지하 396', '서울 강남구', 37.4979, 127.0276, '올리브영에서 고객 상담 및 매장 관리를 담당할 뷰티 어드바이저를 모집합니다.', '11:00-20:00', '화,수,목,금,토', 1, 'active', 73, datetime('now'));

-- 4. AI 면접 결과 7개 생성 (다양한 등급)
INSERT INTO interview_results (interview_id, user_id, job_type, final_grade, total_score, reliability_score, job_fit_score, service_mind_score, logistics_score, recommendation, one_liner, strengths, concerns, critical_fail, critical_reason, interview_duration, question_count, created_at) VALUES
('interview001', 'jobseeker001', 'cafe', 'S', 95, 35, 29, 24, 7, '적극 추천', '카페 업무에 최적화된 인재입니다', '뛰어난 서비스 마인드, 책임감, 빠른 학습 능력', '', 0, '', 18, 15, datetime('now', '-29 days')),
('interview002', 'jobseeker002', 'cvs', 'A', 88, 33, 27, 21, 7, '추천', '편의점 업무에 적합한 성실한 인재', '성실함, 꼼꼼함, 시간 약속 준수', '야간 근무 경험 부족', 0, '', 16, 14, datetime('now', '-24 days')),
('interview003', 'jobseeker003', 'restaurant', 'A', 86, 32, 26, 22, 6, '추천', '음식점 서빙에 적합한 활발한 인재', '친절함, 빠른 대응, 체력 우수', '주방 업무 경험 부족', 0, '', 17, 15, datetime('now', '-19 days')),
('interview004', 'jobseeker004', 'cafe', 'B', 78, 29, 23, 19, 7, '조건부 추천', '카페 업무를 배우려는 열정이 있음', '배우려는 의지, 긍정적 태도', '경험 부족, 업무 스피드 개선 필요', 0, '', 15, 13, datetime('now', '-14 days')),
('interview005', 'jobseeker005', 'retail', 'B', 75, 28, 22, 18, 7, '조건부 추천', '소매점 업무를 시작하기 적합', '성실함, 책임감', '고객 응대 경험 부족', 0, '', 14, 12, datetime('now', '-9 days')),
('interview006', 'jobseeker006', 'cvs', 'C', 68, 25, 20, 16, 7, '검토 필요', '편의점 업무 기본 역량은 있음', '시간 약속 준수', '서비스 마인드 부족, 소극적 태도', 0, '', 13, 11, datetime('now', '-4 days')),
('interview007', 'jobseeker007', 'fastfood', 'F', 45, 15, 12, 10, 8, '부적합', '패스트푸드 업무에 적합하지 않음', '출퇴근 거리 가까움', '무책임한 답변, 불성실한 태도, 지각 이력', 1, '근무 태도 및 책임감 부족', 8, 6, datetime('now', '-2 days'));

-- 5. 포인트 거래 내역 생성
INSERT INTO point_transactions (id, user_id, amount, type, description, balance_after, created_at) VALUES
('pt001', 'jobseeker001', 100, 'earn', '회원가입 보너스', 100, datetime('now', '-30 days')),
('pt002', 'jobseeker001', 50, 'earn', 'AI 면접 완료', 150, datetime('now', '-29 days')),
('pt003', 'jobseeker002', 100, 'earn', '회원가입 보너스', 100, datetime('now', '-25 days')),
('pt004', 'jobseeker002', -20, 'spend', '체험 신청', 80, datetime('now', '-20 days')),
('pt005', 'jobseeker003', 100, 'earn', '회원가입 보너스', 100, datetime('now', '-20 days')),
('pt006', 'jobseeker003', 50, 'earn', '체험 완료 보상', 150, datetime('now', '-15 days')),
('pt007', 'jobseeker003', 50, 'earn', '구인자 평가 보너스', 200, datetime('now', '-14 days')),
('pt008', 'jobseeker004', 100, 'earn', '회원가입 보너스', 100, datetime('now', '-15 days')),
('pt009', 'jobseeker004', -50, 'spend', '스타벅스 아메리카노 구매', 50, datetime('now', '-10 days')),
('pt010', 'jobseeker005', 100, 'earn', '회원가입 보너스', 100, datetime('now', '-10 days')),
('pt011', 'jobseeker005', 20, 'earn', 'AI 면접 완료', 120, datetime('now', '-9 days')),
('pt012', 'jobseeker006', 100, 'earn', '회원가입 보너스', 100, datetime('now', '-5 days')),
('pt013', 'jobseeker006', -70, 'spend', '체험 신청 2건', 30, datetime('now', '-3 days')),
('pt014', 'jobseeker007', 100, 'earn', '회원가입 보너스', 100, datetime('now', '-3 days')),
('pt015', 'jobseeker007', -10, 'spend', '체험 신청', 90, datetime('now', '-2 days'));

-- 6. 체험 신청 데이터 생성
INSERT INTO experiences (id, job_id, jobseeker_id, employer_id, status, requested_date, requested_time, message, employer_response, points_used, created_at) VALUES
('exp001', 'job001', 'jobseeker002', 'employer001', 'completed', '2026-02-20', '10:00', '카페 업무를 배우고 싶습니다!', '체험 완료했습니다. 성실하게 잘 해주셨어요!', 10, datetime('now', '-20 days')),
('exp002', 'job002', 'jobseeker003', 'employer002', 'approved', '2026-02-18', '22:00', '편의점 야간 근무 경험하고 싶어요', '체험 날짜에 오시면 됩니다', 10, datetime('now', '-15 days')),
('exp003', 'job003', 'jobseeker006', 'employer003', 'rejected', '2026-02-15', '12:00', '음식점 일 해보고 싶습니다', '죄송합니다. 현재 체험 인원이 마감되었습니다', 10, datetime('now', '-10 days')),
('exp004', 'job006', 'jobseeker006', 'employer003', 'pending', '2026-02-17', '18:00', '치킨집 배달 체험하고 싶어요', '', 10, datetime('now', '-3 days')),
('exp005', 'job009', 'jobseeker007', 'employer003', 'pending', '2026-02-18', '07:00', '맥도날드 크루 해보고 싶습니다', '', 10, datetime('now', '-2 days'));

-- 7. 스토어 구매 내역 생성
INSERT INTO store_purchases (id, user_id, product_id, product_name, product_price, product_icon, product_category, gift_code, status, created_at) VALUES
('purchase001', 'jobseeker004', 1, '스타벅스 아메리카노', 100, '☕', '카페', 'STBK1A2B3C4D5E6F', 'completed', datetime('now', '-10 days')),
('purchase002', 'jobseeker003', 7, '카카오 이모티콘', 50, '💬', '디지털', 'KAKA9X8Y7Z6W5V4U', 'completed', datetime('now', '-8 days'));

-- 8. 알림 데이터 생성
INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at) VALUES
('notif001', 'employer001', 'experience', '새로운 체험 신청', 'job001 공고에 체험 신청이 접수되었습니다.', '{"experience_id":"exp001","job_id":"job001"}', 1, datetime('now', '-20 days')),
('notif002', 'jobseeker002', 'experience', '체험 신청 승인', '체험 신청이 승인되었습니다!', '{"experience_id":"exp001"}', 1, datetime('now', '-19 days')),
('notif003', 'employer002', 'experience', '새로운 체험 신청', 'job002 공고에 체험 신청이 접수되었습니다.', '{"experience_id":"exp002","job_id":"job002"}', 1, datetime('now', '-15 days')),
('notif004', 'jobseeker003', 'experience', '체험 신청 승인', '체험 신청이 승인되었습니다!', '{"experience_id":"exp002"}', 1, datetime('now', '-14 days')),
('notif005', 'jobseeker006', 'experience', '체험 신청 거절', '체험 신청이 거절되었습니다', '{"experience_id":"exp003"}', 0, datetime('now', '-10 days')),
('notif006', 'employer003', 'experience', '새로운 체험 신청', 'job006 공고에 체험 신청이 접수되었습니다.', '{"experience_id":"exp004","job_id":"job006"}', 0, datetime('now', '-3 days')),
('notif007', 'employer003', 'experience', '새로운 체험 신청', 'job009 공고에 체험 신청이 접수되었습니다.', '{"experience_id":"exp005","job_id":"job009"}', 0, datetime('now', '-2 days'));

-- 완료 메시지
SELECT 'Test data generation completed!' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_jobs FROM jobs;
SELECT COUNT(*) as total_interviews FROM interview_results;
SELECT COUNT(*) as total_experiences FROM experiences;
SELECT COUNT(*) as total_point_transactions FROM point_transactions;
SELECT COUNT(*) as total_purchases FROM store_purchases;
SELECT COUNT(*) as total_notifications FROM notifications;
