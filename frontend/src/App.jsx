import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import UserLayout from '@/components/layout/UserLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// 페이지 단위 코드 스플리팅 (React 설계서 7장)
const LoginPage = lazy(() => import('@/pages/Login'));
const RegisterPage = lazy(() => import('@/pages/Register'));
const SurveyPage = lazy(() => import('@/pages/Survey'));
const ResultPage = lazy(() => import('@/pages/Result'));
const MyPage = lazy(() => import('@/pages/MyPage'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route element={<UserLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/surveys/p" element={<SurveyPage type="P" />} />
              <Route path="/surveys/c" element={<SurveyPage type="C" />} />
              <Route path="/results/:resultId" element={<ResultPage />} />
              <Route path="/mypage" element={<MyPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
