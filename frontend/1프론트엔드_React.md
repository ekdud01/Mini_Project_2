# 미니 프로젝트 가이드 (상세버전)

## 목차
1. [BackEnd 설계 가이드]
2. [FrontEnd 설계 가이드]
3. [프로젝트 작성 순서 및 9일 타임테이블]
4. [프로젝트 평가 및 배점표]

---

## 2. FrontEnd 설계 가이드

### 2.1 화면 설계서 가이드

#### 2.1.1 와이어프레임/프로토타이핑 도구

**Figma**
* https://www.figma.com/ko-kr/

```
장점:
 완전 무료 (개인/팀 사용)
 웹 브라우저에서 실행 (설치 불필요)
 실시간 협업 (구글 독스처럼 동시 편집)
 개발자 친화적 (CSS 코드 자동 생성)
 풍부한 무료 템플릿 및 UI 키트
 컴포넌트 시스템 (디자인 시스템 구축 가능)
 프로토타이핑 기능
 한국어 지원

단점:
 인터넷 연결 필요
 복잡한 기능은 학습 곡선 존재

사용법:
1. figma.com 접속 후 무료 계정 생성
2. "Design file" 생성
3. 좌측 도구 모음으로 도형, 텍스트 추가
4. 컴포넌트 생성으로 재사용 가능한 UI 요소 제작
5. 프로토타이핑으로 화면 간 연결
```
**대안 도구들**
```
Sketch:
- https://www.sketch.com/blog/how-to-create-a-wireframe/
- 장점: Mac에서 뛰어난 성능
- 단점: Mac 전용, 유료

Balsamiq:
- https://balsamiq.com/
- 장점: 빠른 와이어프레임 제작
- 단점: 기능 제한적, 디자인보다는 구조 설계용

draw.io (현재 diagrams.net):
- https://www.drawio.com/
- 장점: 완전 무료, 간단한 와이어프레임
- 단점: 디자인 기능 부족
```
#### 2.1.1 와이어프레임/프로토타이핑 도구

**Chakra UI**
* https://chakra-ui.com/
  - **간단한 API**: 직관적이고 배우기 쉬운 prop 기반 스타일링
  - **빠른 개발**: 최소한의 설정으로 바로 사용 가능
  - **좋은 기본값**: 접근성과 반응형을 기본으로 지원
  - **작은 번들 크기**: 필요한 컴포넌트만 import 가능

**설치 방법:**
```bash
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
```

**Material-UI (MUI)**
* https://mui.com/material-ui/
-  Google Material Design 기반으로 일관성 있는 디자인, 많이 사용되는 라이브러리, 풍부한 컴포넌트와 문서

**React Bootstrap**
* https://react-bootstrap.netlify.app/
-  Bootstrap에 익숙한 개발자들이 쉽게 사용, 반응형 디자인 우수

**Mantine**
* https://mantine.dev/
-  모던한 디자인, 다크테마 지원, 풍부한 hooks 제공, 좋은 성능

**shadcn/ui**
* https://ui.shadcn.com/
- Tailwind CSS 기반, 복사-붙여넣기 방식으로 완전한 커스터마이징 가능, 모던한 디자인

#### 2.1.3 화면 설계 단계별 가이드

**STEP 1: 사이트맵 작성**
```
도서관 시스템 사이트맵 예시:

1. 사용자 영역 (React)
   ├── 메인 페이지 (/)
   ├── 로그인/회원가입 (/auth)
   │   ├── 로그인 (/auth/login)
   │   └── 회원가입 (/auth/register)
   ├── 도서 검색/목록 (/books)
   │   ├── 도서 목록 (/books)
   │   ├── 도서 상세 (/books/{id})
   │   └── 도서 검색 결과 (/books/search)
   ├── 내 정보 (/my)
   │   ├── 내 정보 (/my/profile)
   │   ├── 대출 현황 (/my/loans)
   │   ├── 대출 이력 (/my/history)
   │   └── 예약 현황 (/my/reservations)
   └── 공지사항 (/notices)

2. 관리자 영역 (Thymeleaf)
   ├── 관리자 로그인 (/admin/login)
   ├── 대시보드 (/admin/dashboard)
   ├── 회원 관리 (/admin/members)
   │   ├── 회원 목록 (/admin/members)
   │   ├── 회원 상세 (/admin/members/{id})
   │   └── 회원 등록 (/admin/members/new)
   ├── 도서 관리 (/admin/books)
   │   ├── 도서 목록 (/admin/books)
   │   ├── 도서 등록 (/admin/books/new)
   │   └── 도서 수정 (/admin/books/{id}/edit)
   ├── 대출 관리 (/admin/loans)
   │   ├── 대출 승인 대기 (/admin/loans/pending)
   │   ├── 대출 현황 (/admin/loans/current)
   │   └── 연체 관리 (/admin/loans/overdue)
   └── 통계 (/admin/statistics)
```

**STEP 2: 와이어프레임 작성**

각 페이지의 기본 레이아웃을 간단한 도형으로 표현합니다.

```
도서 목록 페이지 와이어프레임 예시:

┌─────────────────────────────────────────────┐
│ Header (로고, 네비게이션, 사용자 정보)          │
├─────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────┐ │
│ │             │ │                         │ │
│ │   검색 박스  │ │    카테고리 필터          │ │
│ │             │ │                         │ │
│ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────┤
│ 도서 목록 (카드 형태로 배치)                   │
│ ┌───────┐ ┌───────┐  ┌───────┐ ┌───────┐    │
│ │ 도서1  │ │ 도서2 │  │ 도서3  │ │ 도서4  │    │
│ │ 이미지 │ │ 이미지 │  │ 이미지 │ │ 이미지 │   │
│ │ 제목   │ │ 제목   │ │ 제목   │ │ 제목   │   │
│ │ 저자   │ │ 저자   │ │ 저자   │ │ 저자   │   │
│ │ 상태   │ │ 상태   │ │ 상태   │ │ 상태   │   │
│ └───────┘ └───────┘  └───────┘ └───────┘   │
├─────────────────────────────────────────────┤
│ 페이지네이션 (< 1 2 3 4 5 >)                  │
├─────────────────────────────────────────────┤
│ Footer (연락처, 운영시간 등)                   │
└─────────────────────────────────────────────┘
```

**STEP 3: UI 플로우 설계**

사용자의 주요 동선을 시각화합니다.

```
도서 대출 플로우 예시:

메인 페이지 → 도서 검색 → 도서 목록 → 도서 상세
    ↓            ↓          ↓         ↓
로그인 확인 ← 로그인 페이지 ← 대출 신청 버튼 클릭
    ↓
대출 신청 확인 모달
    ↓
대출 신청 완료 → 내 대출 현황 페이지
```

#### 2.1.3 Figma를 활용한 실제 화면 설계

**1. 디자인 시스템 구축**
```
Color Palette:
- Primary: #1976d2 (파란색 - 신뢰성)
- Secondary: #388e3c (초록색 - 성공)
- Error: #d32f2f (빨간색 - 에러)
- Warning: #f57c00 (주황색 - 경고)
- Background: #f5f5f5 (연한 회색)
- Surface: #ffffff (흰색)
- Text Primary: #212121 (진한 회색)
- Text Secondary: #757575 (회색)

Typography:
- Heading 1: 32px, Bold
- Heading 2: 24px, Bold
- Heading 3: 20px, Semi-Bold
- Body 1: 16px, Regular
- Body 2: 14px, Regular
- Caption: 12px, Regular

Spacing:
- Micro: 4px
- Small: 8px
- Medium: 16px
- Large: 24px
- XL: 32px
- XXL: 48px

Border Radius:
- Small: 4px
- Medium: 8px
- Large: 12px
- Round: 50%
```

**2. 컴포넌트 라이브러리 설계**
```
기본 컴포넌트:
- Button (Primary, Secondary, Text)
- Input (Text, Email, Password, Search)
- Card (기본, 이미지 포함)
- Modal (확인, 알림, 폼)
- Navigation (Header, Sidebar)
- Badge (상태 표시)
- Pagination
- Table
- Loading Spinner

복합 컴포넌트:
- BookCard (도서 카드)
- MemberInfo (회원 정보)
- LoanStatus (대출 상태)
- SearchBar (검색 바)
- FilterPanel (필터 패널)
```

### 2.2 React 컴포넌트 설계 가이드

#### 2.2.1 React UI 라이브러리 상세 비교

**Material-UI (MUI)**
```
장점:
 가장 인기 있는 라이브러리 (GitHub 90k+ 스타)
 Google Material Design 기반의 일관된 디자인
 100개 이상의 풍부한 컴포넌트
 TypeScript 완벽 지원
 커뮤니티가 활발하여 문제 해결 용이
 테마 시스템으로 전체 디자인 일관성 유지
 접근성(Accessibility) 준수
 상세한 문서 및 예제

단점:
 번들 크기가 큰 편
 Material Design 스타일에 제약

설치 및 사용:
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material  # 아이콘 사용시

기본 사용 예시:
import { Button, TextField, Card } from '@mui/material';
```

**대안 UI 라이브러리들**
```
Chakra UI:
- 장점: 간단하고 모듈형, 빠른 개발
- 단점: 컴포넌트 수 제한적
- 적합한 프로젝트: 빠른 프로토타이핑

Ant Design:
- 장점: 엔터프라이즈급 컴포넌트, 풍부한 기능
- 단점: 중국 스타일, 커스터마이징 어려움
- 적합한 프로젝트: 관리자 대시보드, 백오피스

React Bootstrap:
- 장점: Bootstrap 친숙함, 가벼움
- 단점: 구식 디자인, 제한적 기능
- 적합한 프로젝트: 기존 Bootstrap 경험자

Mantine:
- 장점: 현대적 디자인, 풍부한 기능
- 단점: 상대적으로 새로운 라이브러리
- 적합한 프로젝트: 모던 웹 애플리케이션
```

#### 2.2.2 컴포넌트 아키텍처 설계

**1. 컴포넌트 분류 체계**
```
src/
├── components/
│   ├── common/              # 재사용 가능한 공통 컴포넌트
│   │   ├── Button/
│   │   │   ├── index.js
│   │   │   ├── Button.jsx
│   │   │   └── Button.styles.js
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Loading/
│   │   └── ErrorBoundary/
│   ├── layout/              # 레이아웃 관련 컴포넌트
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── Sidebar/
│   │   └── Layout/
│   ├── features/            # 기능별 컴포넌트
│   │   ├── auth/
│   │   │   ├── LoginForm/
│   │   │   ├── RegisterForm/
│   │   │   └── AuthGuard/
│   │   ├── books/
│   │   │   ├── BookCard/
│   │   │   ├── BookList/
│   │   │   ├── BookDetail/
│   │   │   └── BookSearch/
│   │   ├── loans/
│   │   │   ├── LoanCard/
│   │   │   ├── LoanList/
│   │   │   └── LoanStatus/
│   │   └── members/
│   └── pages/               # 페이지 컴포넌트
│       ├── HomePage/
│       ├── BooksPage/
│       ├── LoginPage/
│       └── MyPage/
```

**2. 컴포넌트 설계 원칙**

```javascript
//  책임 원칙 - 하나의 컴포넌트는 하나의 역할만
// 나쁜 예: 여러 기능이 섞인 컴포넌트
const BadBookComponent = () => {
  // 도서 데이터 fetch, 검색, 필터링, 렌더링 모두 처리
  return (
    <div>
      {/* 검색 폼 */}
      {/* 필터 옵션 */}
      {/* 도서 목록 */}
      {/* 페이지네이션 */}
    </div>
  );
};

// 좋은 예: 각 기능을 별도 컴포넌트로 분리
con BooksPage = () => {
  return (
    <div>
      <BookSearch />
      <BookFilter />
      <BookList />
      <Pagination />
    </div>
  );
};
```

**3. Props 설계 가이드**

```javascript
// PropTypes 정의 (또는 TypeScript 사용)
import PropTypes from 'prop-types';

const BookCard = ({ 
  book, 
  onLoanRequest, 
  onReservation, 
  showActions = true,
  size = 'medium',
  className = '' 
}) => {
  return (
    <Card className={`book-card book-card--${size} ${className}`}>
      <CardMedia
        component="img"
        height="200"
        image={book.imageUrl || '/images/no-image.png'}
        alt={book.title}
      />
      <CardContent>
        <Typography variant="h6" component="h3">
          {book.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {book.author}
        </Typography>
        <Chip 
          label={book.isAvailable ? '대출가능' : '대출중'} 
          color={book.isAvailable ? 'success' : 'default'}
          size="small"
        />
      </CardContent>
      {showActions && (
        <CardActions>
          <Button 
            size="small" 
            onClick={() => onLoanRequest(book.id)}
            disabled={!book.isAvailable}
          >
            대출신청
          </Button>
          <Button 
            size="small" 
            onClick={() => onReservation(book.id)}
            disabled={book.isAvailable}
          >
            예약
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

BookCard.propTypes = {
  book: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    isAvailable: PropTypes.bool.isRequired
  }).isRequired,
  onLoanRequest: PropTypes.func,
  onReservation: PropTypes.func,
  showActions: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string
};
```

**4. 상태 관리 전략**

```javascript
// 로컬 상태 vs 전역 상태 구분
// 로컬 상태 사용 예시 (컴포넌트 내부에서만 사용)
consBookSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const results = await searchBooks(searchTerm);
      onSearchResults(results);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="도서명, 저자명을 입력하세요"
        fullWidth
      />
      <Button 
        onClick={handleSearch}
        disabled={isLoading}
        variant="contained"
      >
        {isLoading ? <CircularProgress size={20} /> : '검색'}
      </Button>
    </Box>
  );
};
//  전역 상태 사용 예시 (여러 컴포넌트에서 공유)
// Redux toolkit 사용
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProfile, selectUser } from '../store/slices/authSlice';

const UserProfile = () => {
  const dispatch = useDispatch();
  const { user, isLoading, error } = useSelector(selectUser);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">{user.name}</Typography>
        <Typography color="text.secondary">
          회원번호: {user.memberNumber}
        </Typography>
        <Typography color="text.secondary">
          대출 가능: {user.maxLoanCount - user.currentLoanCount}권
        </Typography>
      </CardContent>
    </Card>
  );
};
```

#### 2.2.3 MUI 컴포넌트 활용 예시

**1. 기본 설정 및 테마**

```javascript
// theme.js - 전체 애플리케이션 테마 설정
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#388e3c',
      light: '#66bb6a',
      dark: '#2e7d32',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#f57c00',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Noto Sans KR"',
      '"Segoe UI"',
      'Roboto',
      'sans-serif'
    ].join(','),
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

export default theme;

// App.js
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* 애플리케이션 컴포넌트들 */}
    </ThemeProvider>
  );
}
```

**2. 도서 목록 컴포넌트 구현**

```javascript
// BookList.jsx
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Skeleton,
  Alert
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { bookService } from '../services/bookService';
import { useAuth } from '../hooks/useAuth';

const BookList = ({ searchParams, onBookSelect }) => {
  const { user } = useAuth();
  
  const {
    data: books,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['books', searchParams],
    queryFn: () => bookService.getBooks(searchParams),
    keepPreviousData: true
  });

  const loanMutation = useMutation({
    mutationFn: bookService.requestLoan,
    onSuccess: () => {
      refetch();
      // 성공 메시지 표시
    },
    onError: (error) => {
      // 에러 메시지 표시
    }
  });

  const handleLoanRequest = (bookId) => {
    if (!user) {
      // 로그인 유도
      return;
    }
    loanMutation.mutate({ bookId, memberId: user.id });
  };

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[...Array(8)].map((_, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card>
              <Skeleton variant="rectangular" height={200} />
              <CardContent>
                <Skeleton variant="text" height={28} />
                <Skeleton variant="text" height={20} />
                <Skeleton variant="rectangular" width={80} height={24} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        도서 목록을 불러오는 중 오류가 발생했습니다.
        <Button onClick={() => refetch()}>다시 시도</Button>
      </Alert>
    );
  }

  if (!books?.content?.length) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          검색 결과가 없습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {books.content.map((book) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: (theme) => theme.shadows[8],
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease-in-out'
            }}
            onClick={() => onBookSelect(book.id)}
          >
            <CardMedia
              component="img"
              height="200"
              image={book.imageUrl || '/images/no-book-image.png'}
              alt={book.title}
              sx={{ objectFit: 'cover' }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography 
                variant="h6" 
                component="h3" 
                noWrap
                sx={{ mb: 1 }}
              >
                {book.title}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                noWrap
                sx={{ mb: 1 }}
              >
                {book.author}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ mb: 2, display: 'block' }}
              >
                {book.publisher} • {book.publicationDate}
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Chip 
                  label={book.isAvailable ? '대출가능' : '대출중'} 
                  color={book.isAvailable ? 'success' : 'default'}
                  size="small"
                />
                {book.category && (
                  <Chip 
                    label={book.category.name}
                    variant="outlined"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            </CardContent>
            <CardActions sx={{ pt: 0 }}>
              <Button 
                size="small" 
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoanRequest(book.id);
                }}
                disabled={!book.isAvailable || loanMutation.isLoading}
                fullWidth
              >
                {book.isAvailable ? '대출신청' : '예약하기'}
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default BookList;
```

**3. 검색 및 필터 컴포넌트**

```javascript
// BookSearchFilter.jsx
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

const BookSearchFilter = ({ onSearch, onFilterChange, categories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    categories: [],
    availability: 'all',
    sortBy: 'title',
    sortOrder: 'asc'
  });

  const handleSearch = () => {
    onSearch({
      search: searchTerm,
      ...filters
    });
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCategoryToggle = (categoryId) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    
    handleFilterChange('categories', newCategories);
  };

  const clearFilters = () => {
    const clearedFilters = {
      categories: [],
      availability: 'all',
      sortBy: 'title',
      sortOrder: 'asc'
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* 검색 바 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="도서명, 저자명, ISBN을 입력하세요"
          fullWidth
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleSearch}>
                <SearchIcon />
              </IconButton>
            )
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button 
          onClick={handleSearch}
          variant="contained"
          sx={{ minWidth: 100 }}
        >
          검색
        </Button>
      </Box>

      {/* 필터 아코디언 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            상세 필터
            {(filters.categories.length > 0 || filters.availability !== 'all') && (
              <Chip 
                label={`${filters.categories.length + (filters.availability !== 'all' ? 1 : 0)}개 필터 적용`}
                size="small"
                color="primary"
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
            {/* 카테고리 필터 */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                카테고리
              </Typography>
              <FormGroup>
                {categories.map((category) => (
                  <FormControlLabel
                    key={category.id}
                    control={
                      <Checkbox
                        checked={filters.categories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                      />
                    }
                    label={category.name}
                  />
                ))}
              </FormGroup>
            </Box>

            {/* 대출 가능 여부 필터 */}
            <Box>
              <FormControl fullWidth>
                <InputLabel>대출 상태</InputLabel>
                <Select
                  value={filters.availability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  label="대출 상태"
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="available">대출가능</MenuItem>
                  <MenuItem value="unavailable">대출중</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* 정렬 옵션 */}
            <Box>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <InputLabel>정렬 기준</InputLabel>
                <Select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  label="정렬 기준"
                >
                  <MenuItem value="title">제목</MenuItem>
                  <MenuItem value="author">저자</MenuItem>
                  <MenuItem value="publicationDate">출간일</MenuItem>
                  <MenuItem value="popularity">인기도</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>정렬 순서</InputLabel>
                <Select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  label="정렬 순서"
                >
                  <MenuItem value="asc">오름차순</MenuItem>
                  <MenuItem value="desc">내림차순</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* 필터 초기화 버튼 */}
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Button 
              onClick={clearFilters}
              variant="outlined"
              startIcon={<ClearIcon />}
            >
              필터 초기화
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* 적용된 필터 태그 */}
      {(filters.categories.length > 0 || filters.availability !== 'all') && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filters.categories.map(categoryId => {
            const category = categories.find(c => c.id === categoryId);
            return (
              <Chip
                key={categoryId}
                label={category?.name}
                onDelete={() => handleCategoryToggle(categoryId)}
                color="primary"
                variant="outlined"
              />
            );
          })}
          {filters.availability !== 'all' && (
            <Chip
              label={filters.availability === 'available' ? '대출가능' : '대출중'}
              onDelete={() => handleFilterChange('availability', 'all')}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default BookSearchFilter;
```
