/**
 * KV에 공고 데이터 시드
 * 실행: node seed-jobs.js
 */

const jobsData = {
  "cafe": [
    {
      "id": "cafe_001",
      "title": "스타벅스 바리스타 모집 (신입/경력)",
      "company": "스타벅스 강남점",
      "location": "서울 강남구 역삼동",
      "salary": "시급 10,500원 ~ 13,000원",
      "description": "고객에게 최상의 커피 경험을 제공할 바리스타를 모집합니다. 체계적인 교육 프로그램과 복리후생을 제공합니다.",
      "requirements": "• 커피에 대한 열정\n• 고객 응대 능력\n• 성실하고 책임감 있는 분\n• 주 5일 근무 가능자\n• 신입 환영",
      "url": "https://www.saramin.co.kr/zf_user/search?searchword=스타벅스+바리스타",
      "source": "사람인",
      "keywords": ["카페", "바리스타", "커피"],
      "category": "cafe"
    },
    {
      "id": "cafe_002",
      "title": "카페 홀 서빙 및 주방보조 (알바)",
      "company": "투썸플레이스 역삼점",
      "location": "서울 강남구 역삼동",
      "salary": "시급 10,000원 ~ 12,000원",
      "description": "친절한 서비스와 깨끗한 매장 관리를 담당할 직원을 모집합니다. 주 3~5일 근무 가능.",
      "requirements": "• 친절하고 밝은 성격\n• 고객 응대 경험 우대\n• 주 3일 이상 근무 가능\n• 평일/주말 협의 가능\n• 신입 가능",
      "url": "https://www.alba.co.kr/search/list?keyword=카페+서빙",
      "source": "알바몬",
      "keywords": ["카페", "서빙", "홀서빙"],
      "category": "cafe"
    },
    {
      "id": "cafe_003",
      "title": "이디야커피 오픈 스태프 급구",
      "company": "이디야커피 선릉점",
      "location": "서울 강남구 선릉역",
      "salary": "시급 11,000원",
      "description": "신규 오픈 매장으로 오픈 스태프를 모집합니다. 깨끗하고 쾌적한 근무환경.",
      "requirements": "• 오픈 초기 함께 성장할 의지\n• 카페 근무 경험 우대\n• 책임감 있는 분\n• 장기 근무 가능자 우대",
      "url": "https://www.jobkorea.co.kr/Search/?stext=이디야커피",
      "source": "잡코리아",
      "keywords": ["카페", "커피", "오픈스태프"],
      "category": "cafe"
    }
  ],
  "cvs": [
    {
      "id": "cvs_001",
      "title": "CU 편의점 야간 알바 모집",
      "company": "CU 강남역점",
      "location": "서울 강남구 강남역",
      "salary": "시급 12,000원 (야간 1.5배)",
      "description": "야간 시간대 근무할 성실한 직원을 모집합니다. 혼자서도 매장 운영 가능한 분 환영.",
      "requirements": "• 성실하고 책임감 있는 분\n• 야간 근무 가능 (22:00~06:00)\n• 장기 근무 가능자 우대\n• 편의점 경험자 우대",
      "url": "https://www.alba.co.kr/search/list?keyword=CU+편의점",
      "source": "알바몬",
      "keywords": ["편의점", "CU", "야간알바"],
      "category": "cvs"
    },
    {
      "id": "cvs_002",
      "title": "GS25 주간 아르바이트",
      "company": "GS25 역삼점",
      "location": "서울 강남구 역삼동",
      "salary": "시급 10,000원",
      "description": "주간 시간대 근무할 밝고 성실한 직원을 모집합니다. 주 3~4일 근무.",
      "requirements": "• 밝고 친절한 성격\n• 고객 응대 능력\n• 주 3일 이상 근무 가능\n• 신입 환영",
      "url": "https://www.saramin.co.kr/zf_user/search?searchword=GS25",
      "source": "사람인",
      "keywords": ["편의점", "GS25", "주간알바"],
      "category": "cvs"
    },
    {
      "id": "cvs_003",
      "title": "세븐일레븐 오픈/마감 알바",
      "company": "세븐일레븐 서초점",
      "location": "서울 서초구",
      "salary": "시급 10,500원",
      "description": "오픈 또는 마감 시간대 근무 가능한 직원 모집. 2개월 이상 장기 근무자 우대.",
      "requirements": "• 오픈(06:00~14:00) 또는 마감(14:00~22:00)\n• 장기 근무 가능자\n• 편의점 경험 우대\n• 성실한 근무 태도",
      "url": "https://www.jobkorea.co.kr/Search/?stext=세븐일레븐",
      "source": "잡코리아",
      "keywords": ["편의점", "세븐일레븐", "오픈마감"],
      "category": "cvs"
    }
  ],
  "restaurant": [
    {
      "id": "restaurant_001",
      "title": "외식업체 홀서빙 및 주방보조",
      "company": "아웃백 스테이크하우스",
      "location": "서울 강남구",
      "salary": "시급 11,000원 + 팁",
      "description": "고급 레스토랑에서 근무할 홀서빙 직원을 모집합니다. 체계적인 교육과 좋은 근무환경.",
      "requirements": "• 서빙 경험자 우대 (신입 가능)\n• 친절하고 적극적인 태도\n• 주 4일 이상 근무 가능\n• 팀워크 중시",
      "url": "https://www.saramin.co.kr/zf_user/search?searchword=외식+서빙",
      "source": "사람인",
      "keywords": ["레스토랑", "서빙", "외식업"],
      "category": "restaurant"
    },
    {
      "id": "restaurant_002",
      "title": "한식당 주방보조 구인",
      "company": "한일관 본점",
      "location": "서울 중구",
      "salary": "월급 250만원",
      "description": "전통 한식당에서 주방보조 업무를 담당할 직원을 모집합니다. 식사 및 기숙사 제공.",
      "requirements": "• 주방 경험자 우대\n• 체력이 좋은 분\n• 위생관념이 투철한 분\n• 장기 근무 희망자",
      "url": "https://www.alba.co.kr/search/list?keyword=한식당+주방",
      "source": "알바몬",
      "keywords": ["한식당", "주방보조", "월급"],
      "category": "restaurant"
    },
    {
      "id": "restaurant_003",
      "title": "이탈리안 레스토랑 홀매니저",
      "company": "빕스 강남점",
      "location": "서울 강남구",
      "salary": "월급 280만원 ~ 320만원",
      "description": "매장 운영 및 직원 관리를 담당할 홀매니저를 모집합니다. 정규직 전환 가능.",
      "requirements": "• 외식업 경력 1년 이상\n• 리더십 및 관리 능력\n• 고객 응대 능력\n• 정규직 전환 가능",
      "url": "https://www.jobkorea.co.kr/Search/?stext=레스토랑+매니저",
      "source": "잡코리아",
      "keywords": ["레스토랑", "매니저", "정규직"],
      "category": "restaurant"
    }
  ],
  "retail": [
    {
      "id": "retail_001",
      "title": "의류매장 판매사원 모집",
      "company": "유니클로 강남점",
      "location": "서울 강남구",
      "salary": "시급 10,500원",
      "description": "의류 판매 및 매장 관리를 담당할 직원을 모집합니다. 직원 할인 혜택 제공.",
      "requirements": "• 판매 경험자 우대 (신입 환영)\n• 패션에 관심 있는 분\n• 친절하고 적극적인 성격\n• 주 5일 근무 가능",
      "url": "https://www.saramin.co.kr/zf_user/search?searchword=의류+판매",
      "source": "사람인",
      "keywords": ["매장", "판매", "의류"],
      "category": "retail"
    },
    {
      "id": "retail_002",
      "title": "화장품 매장 뷰티어드바이저",
      "company": "올리브영 역삼점",
      "location": "서울 강남구 역삼동",
      "salary": "시급 11,000원 + 인센티브",
      "description": "고객 상담 및 제품 판매를 담당할 뷰티어드바이저를 모집합니다.",
      "requirements": "• 화장품/뷰티 관심자\n• 고객 상담 능력\n• 밝고 친절한 성격\n• 판매 경험 우대",
      "url": "https://www.alba.co.kr/search/list?keyword=올리브영",
      "source": "알바몬",
      "keywords": ["화장품", "뷰티", "판매"],
      "category": "retail"
    },
    {
      "id": "retail_003",
      "title": "편집샵 매장관리 직원",
      "company": "ABC마트 강남점",
      "location": "서울 강남구",
      "salary": "월급 240만원",
      "description": "신발/패션 제품 판매 및 재고 관리를 담당할 직원 모집. 정규직 전환 가능.",
      "requirements": "• 판매 경험 1년 이상\n• 재고 관리 능력\n• 책임감 있는 근무 태도\n• 정규직 전환 가능",
      "url": "https://www.jobkorea.co.kr/Search/?stext=편집샵+매장",
      "source": "잡코리아",
      "keywords": ["매장관리", "판매", "정규직"],
      "category": "retail"
    }
  ],
  "fastfood": [
    {
      "id": "fastfood_001",
      "title": "맥도날드 크루 모집",
      "company": "맥도날드 강남역점",
      "location": "서울 강남구 강남역",
      "salary": "시급 10,500원",
      "description": "고객 주문 접수, 조리, 서빙 등 매장 운영 전반을 담당할 크루를 모집합니다.",
      "requirements": "• 밝고 친절한 성격\n• 빠른 업무 처리 능력\n• 주 3일 이상 근무 가능\n• 신입 환영",
      "url": "https://www.saramin.co.kr/zf_user/search?searchword=맥도날드",
      "source": "사람인",
      "keywords": ["패스트푸드", "맥도날드", "크루"],
      "category": "fastfood"
    },
    {
      "id": "fastfood_002",
      "title": "버거킹 주방 조리 직원",
      "company": "버거킹 역삼점",
      "location": "서울 강남구 역삼동",
      "salary": "시급 11,000원",
      "description": "버거 조리 및 주방 업무를 담당할 직원을 모집합니다. 체계적인 교육 제공.",
      "requirements": "• 주방 경험자 우대 (신입 가능)\n• 빠른 업무 처리 능력\n• 위생관념이 투철한 분\n• 주 4일 이상 근무 가능",
      "url": "https://www.alba.co.kr/search/list?keyword=버거킹",
      "source": "알바몬",
      "keywords": ["패스트푸드", "버거킹", "조리"],
      "category": "fastfood"
    },
    {
      "id": "fastfood_003",
      "title": "KFC 매장관리 사원",
      "company": "KFC 서초점",
      "location": "서울 서초구",
      "salary": "월급 260만원",
      "description": "매장 운영 및 직원 관리를 담당할 매니저를 모집합니다. 정규직 전환 가능.",
      "requirements": "• 외식업 경력 6개월 이상\n• 매장 관리 능력\n• 리더십\n• 정규직 전환 가능",
      "url": "https://www.jobkorea.co.kr/Search/?stext=KFC",
      "source": "잡코리아",
      "keywords": ["패스트푸드", "KFC", "매니저"],
      "category": "fastfood"
    }
  ]
};

console.log('📦 공고 데이터 생성 완료!');
console.log(`총 ${Object.keys(jobsData).length}개 카테고리`);
Object.entries(jobsData).forEach(([category, jobs]) => {
  console.log(`  - ${category}: ${jobs.length}개 공고`);
});

console.log('\n다음 명령어로 KV에 업로드하세요:');
Object.entries(jobsData).forEach(([category, jobs]) => {
  console.log(`npx wrangler kv:key put "jobs:${category}" '${JSON.stringify(jobs)}' --namespace-id a04e3f82aa4c4f0c92551599b30ac018`);
});
