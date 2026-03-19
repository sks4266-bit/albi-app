-- 간단한 테스트 데이터 (프로덕션용)

-- 구직자 3명
INSERT INTO users (id, email, password_hash, name, phone, user_type, phone_verified, created_at) VALUES
('test_jobseeker1', 'test1@albi.com', '$2a$10$test.hash.1', '테스트구직자1', '010-1111-0001', 'jobseeker', 1, datetime('now', '-10 days')),
('test_jobseeker2', 'test2@albi.com', '$2a$10$test.hash.2', '테스트구직자2', '010-1111-0002', 'jobseeker', 1, datetime('now', '-8 days')),
('test_jobseeker3', 'test3@albi.com', '$2a$10$test.hash.3', '테스트구직자3', '010-1111-0003', 'jobseeker', 1, datetime('now', '-5 days'));

-- 구인자 2명
INSERT INTO users (id, email, password_hash, name, phone, user_type, business_registration_verified, phone_verified, created_at) VALUES
('test_employer1', 'employer1@albi.com', '$2a$10$test.hash.101', '테스트사장님1', '010-2222-0001', 'employer', 1, 1, datetime('now', '-20 days')),
('test_employer2', 'employer2@albi.com', '$2a$10$test.hash.102', '테스트사장님2', '010-2222-0002', 'employer', 1, 1, datetime('now', '-15 days'));

-- 공고 5개
INSERT INTO jobs (id, user_id, title, company_name, job_type, hourly_wage, address, region, latitude, longitude, description, work_hours, work_days, is_urgent, status, views, created_at) VALUES
('test_job1', 'test_employer1', '스타벅스 강남점 바리스타', '스타벅스', 'cafe', 12000, '서울 강남구', '서울 강남구', 37.4979, 127.0276, '카페 바리스타 모집', '09:00-18:00', '월,화,수,목,금', 1, 'active', 25, datetime('now', '-5 days')),
('test_job2', 'test_employer1', 'GS25 편의점 알바', 'GS25', 'cvs', 10500, '서울 마포구', '서울 마포구', 37.5572, 126.9226, '편의점 직원 모집', '22:00-06:00', '월,수,금,토,일', 0, 'active', 18, datetime('now', '-4 days')),
('test_job3', 'test_employer2', '본죽 강남점 서빙', '본죽', 'restaurant', 11000, '서울 강남구', '서울 강남구', 37.4987, 127.0303, '음식점 서빙 모집', '11:00-15:00', '월,화,수,목,금', 0, 'active', 12, datetime('now', '-3 days')),
('test_job4', 'test_employer2', 'CU 부산대점 편의점', 'CU', 'cvs', 10300, '부산 금정구', '부산 금정구', 35.2317, 129.0837, '편의점 직원 모집', '14:00-22:00', '월,화,수,목,금,토,일', 0, 'active', 8, datetime('now', '-2 days')),
('test_job5', 'test_employer1', '메가커피 홍대점', '메가커피', 'cafe', 11500, '서울 마포구', '서울 마포구', 37.5551, 126.9368, '카페 직원 모집', '14:00-20:00', '토,일', 1, 'active', 30, datetime('now', '-1 days'));

-- AI 면접 결과 3개
INSERT INTO interview_results (interview_id, user_id, job_type, final_grade, total_score, reliability_score, job_fit_score, service_mind_score, logistics_score, recommendation, one_liner, strengths, concerns, critical_fail, critical_reason, interview_duration, question_count, created_at) VALUES
('test_interview1', 'test_jobseeker1', 'cafe', 'A', 88, 33, 27, 21, 7, '추천', '카페 업무에 적합한 인재', '성실함, 책임감', '', 0, '', 16, 14, datetime('now', '-9 days')),
('test_interview2', 'test_jobseeker2', 'cvs', 'B', 75, 28, 22, 18, 7, '조건부 추천', '편의점 업무 가능', '시간 약속 준수', '경험 부족', 0, '', 14, 12, datetime('now', '-7 days')),
('test_interview3', 'test_jobseeker3', 'restaurant', 'A', 86, 32, 26, 22, 6, '추천', '음식점 서빙에 적합', '친절함, 빠른 대응', '', 0, '', 17, 15, datetime('now', '-4 days'));

-- 완료 메시지
SELECT 'Test data inserted successfully!' as message;
SELECT COUNT(*) as total_users FROM users WHERE id LIKE 'test_%';
SELECT COUNT(*) as total_jobs FROM jobs WHERE id LIKE 'test_%';
SELECT COUNT(*) as total_interviews FROM interview_results WHERE interview_id LIKE 'test_%';
