/**
 * SEO 최적화 유틸리티
 * 구조화된 데이터, 메타 태그, Open Graph
 */

class SEOManager {
    constructor() {
        this.defaultMeta = {
            siteName: 'Albi AI',
            title: 'Albi - AI 취업 면접 & 멘토링',
            description: 'AI 기반 면접 연습과 취업 멘토링. 음성 멘토링, 포트폴리오 관리, AI 교정까지 한번에.',
            keywords: 'AI 면접, 취업 준비, AI 멘토, 음성 멘토링, 이력서 교정, 자기소개서, 포트폴리오',
            author: 'Albi',
            image: '/static/og-image.png',
            url: 'https://albi.kr',
            type: 'website',
            locale: 'ko_KR'
        };
    }

    /**
     * 페이지별 메타 데이터
     */
    getPageMeta(page) {
        const pages = {
            home: {
                title: '🚀 Albi - AI 취업 면접 & 멘토링',
                description: 'GPT-5 기반 AI 면접관과 실전 연습. 음성 멘토링, 포트폴리오 빌더, AI 교정까지. 월 4,900원으로 완벽한 취업 준비.',
                keywords: 'AI 면접, 모의 면접, 취업 준비, AI 멘토, 면접 연습, 취업 컨설팅'
            },
            chat: {
                title: 'AI 면접 연습 - Albi',
                description: '실전같은 AI 면접 시뮬레이션. 15단계 구조화된 질문과 GPT-5 피드백으로 완벽 준비.',
                keywords: 'AI 면접, 모의 면접, 면접 연습, 면접 질문, 면접 준비'
            },
            'mentor-chat': {
                title: 'AI 멘토 상담 - Albi',
                description: '24시간 AI 취업 멘토. 이력서, 자소서, 면접 준비 무엇이든 물어보세요.',
                keywords: 'AI 멘토, 취업 상담, 커리어 컨설팅, 이력서 첨삭, 자소서 피드백'
            },
            'voice-mentor': {
                title: '음성 멘토링 - Albi',
                description: '음성으로 대화하는 AI 멘토. 실시간 STT/TTS로 자연스러운 상담.',
                keywords: '음성 멘토링, 음성 상담, AI 음성 채팅, STT, TTS'
            },
            portfolio: {
                title: '포트폴리오 빌더 - Albi',
                description: 'AI가 평가하는 스마트 포트폴리오. 이력서, 자기소개서, 프로젝트 관리를 한곳에서.',
                keywords: '포트폴리오, 이력서, 자기소개서, 프로젝트, AI 평가'
            },
            proofread: {
                title: 'AI 문서 교정 - Albi',
                description: '맞춤법, 문법, 논리성까지 AI가 완벽 교정. 이력서, 자소서, 논문 모두 가능.',
                keywords: 'AI 교정, 맞춤법 검사, 문법 검사, 이력서 첨삭, 자소서 첨삭'
            },
            assignments: {
                title: '과제 제출 & 피드백 - Albi',
                description: '면접 준비 과제를 제출하고 AI의 상세한 피드백을 받으세요.',
                keywords: '면접 과제, AI 피드백, 과제 제출, 면접 준비'
            },
            payment: {
                title: '구독 결제 - Albi',
                description: '월 4,900원으로 모든 기능 무제한. Toss Payments 안전 결제.',
                keywords: '구독, 결제, 멤버십, Toss Payments'
            },
            'growth-dashboard': {
                title: '성장 대시보드 - Albi',
                description: '내 면접 실력과 성장을 한눈에. 데이터 기반 개인화 리포트.',
                keywords: '성장 분석, 대시보드, 면접 통계, 실력 향상'
            }
        };

        return pages[page] || this.defaultMeta;
    }

    /**
     * 메타 태그 업데이트
     */
    updateMeta(page) {
        const meta = this.getPageMeta(page);
        
        // Title
        document.title = meta.title || this.defaultMeta.title;
        
        // Description
        this.setMetaTag('description', meta.description || this.defaultMeta.description);
        
        // Keywords
        this.setMetaTag('keywords', meta.keywords || this.defaultMeta.keywords);
        
        // Open Graph
        this.setMetaProperty('og:title', meta.title || this.defaultMeta.title);
        this.setMetaProperty('og:description', meta.description || this.defaultMeta.description);
        this.setMetaProperty('og:image', this.defaultMeta.image);
        this.setMetaProperty('og:url', `${this.defaultMeta.url}${window.location.pathname}`);
        this.setMetaProperty('og:type', this.defaultMeta.type);
        this.setMetaProperty('og:site_name', this.defaultMeta.siteName);
        this.setMetaProperty('og:locale', this.defaultMeta.locale);
        
        // Twitter Card
        this.setMetaTag('twitter:card', 'summary_large_image');
        this.setMetaTag('twitter:title', meta.title || this.defaultMeta.title);
        this.setMetaTag('twitter:description', meta.description || this.defaultMeta.description);
        this.setMetaTag('twitter:image', this.defaultMeta.image);
        
        // Canonical URL
        this.setCanonicalURL(`${this.defaultMeta.url}${window.location.pathname}`);
    }

    /**
     * 메타 태그 설정
     */
    setMetaTag(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    /**
     * 메타 property 설정
     */
    setMetaProperty(property, content) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    /**
     * Canonical URL 설정
     */
    setCanonicalURL(url) {
        let link = document.querySelector('link[rel="canonical"]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'canonical';
            document.head.appendChild(link);
        }
        link.href = url;
    }

    /**
     * 구조화된 데이터 (Schema.org JSON-LD)
     */
    addStructuredData(type, data) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        
        let structuredData;
        
        switch (type) {
            case 'website':
                structuredData = {
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    'name': this.defaultMeta.siteName,
                    'url': this.defaultMeta.url,
                    'description': this.defaultMeta.description,
                    'potentialAction': {
                        '@type': 'SearchAction',
                        'target': `${this.defaultMeta.url}/search?q={search_term_string}`,
                        'query-input': 'required name=search_term_string'
                    }
                };
                break;
                
            case 'organization':
                structuredData = {
                    '@context': 'https://schema.org',
                    '@type': 'Organization',
                    'name': this.defaultMeta.siteName,
                    'url': this.defaultMeta.url,
                    'logo': `${this.defaultMeta.url}/static/icon-512.png`,
                    'description': this.defaultMeta.description,
                    'contactPoint': {
                        '@type': 'ContactPoint',
                        'contactType': 'Customer Service',
                        'email': 'support@albi.kr'
                    }
                };
                break;
                
            case 'product':
                structuredData = {
                    '@context': 'https://schema.org',
                    '@type': 'Product',
                    'name': 'Albi AI 멘토 프리미엄',
                    'description': 'AI 면접 연습과 취업 멘토링 구독 서비스',
                    'brand': {
                        '@type': 'Brand',
                        'name': 'Albi AI'
                    },
                    'offers': {
                        '@type': 'Offer',
                        'price': '4900',
                        'priceCurrency': 'KRW',
                        'availability': 'https://schema.org/InStock',
                        'priceValidUntil': '2027-12-31',
                        'url': `${this.defaultMeta.url}/payment`
                    }
                };
                break;
                
            case 'breadcrumb':
                structuredData = {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    'itemListElement': data
                };
                break;
                
            case 'faq':
                structuredData = {
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    'mainEntity': data
                };
                break;
                
            default:
                structuredData = data;
        }
        
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
    }

    /**
     * Breadcrumb 생성
     */
    addBreadcrumb(items) {
        const breadcrumbData = items.map((item, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'name': item.name,
            'item': item.url
        }));
        
        this.addStructuredData('breadcrumb', breadcrumbData);
    }

    /**
     * FAQ 추가
     */
    addFAQ(faqs) {
        const faqData = faqs.map(faq => ({
            '@type': 'Question',
            'name': faq.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': faq.answer
            }
        }));
        
        this.addStructuredData('faq', faqData);
    }

    /**
     * 페이지 초기화
     */
    initPage(page) {
        // 메타 태그 업데이트
        this.updateMeta(page);
        
        // 홈페이지인 경우 구조화된 데이터 추가
        if (page === 'home' || !page) {
            this.addStructuredData('website');
            this.addStructuredData('organization');
        }
        
        // 결제 페이지인 경우 Product 스키마
        if (page === 'payment') {
            this.addStructuredData('product');
        }
    }
}

// 초기화
const seoManager = new SEOManager();

// 페이지 로드 시 자동 초기화
if (typeof window !== 'undefined') {
    window.SEOManager = seoManager;
    
    // 현재 페이지 감지
    document.addEventListener('DOMContentLoaded', () => {
        const path = window.location.pathname.replace('/', '').replace('.html', '');
        seoManager.initPage(path || 'home');
    });
}
