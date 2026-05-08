// Top-level routes. Redirects to /signin if not authed as STAFF, /orders otherwise.
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuth } from './context/AuthContext.jsx';
import SignInPage from './pages/SignInPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';

export default function App() {
  const { user, hydrating } = useAuth();
  if (hydrating) return <FullscreenLoader />;

  return (
    <Routes>
      <Route path="/signin" element={user ? <Navigate to="/orders" replace /> : <SignInPage />} />
      <Route
        path="/orders"
        element={user && user.role === 'STAFF' ? <OrdersPage /> : <Navigate to="/signin" replace />}
      />
      <Route path="*" element={<Navigate to={user ? '/orders' : '/signin'} replace />} />
    </Routes>
  );
}

function FullscreenLoader() {
  return (
    <div className="fullscreen-loader">
      <div className="spinner" />
      <span>Connecting to the espresso machine…</span>
    </div>
  );
}
