import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import AdminLayout from '../components/layout/AdminLayout'
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import VerifyEmail from '../pages/VerifyEmail'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import NotFound from '../pages/NotFound'
import AdminRoute from './AdminRoute'
import AdminDashboard from '../pages/admin/AdminDashboard'
import UserManagement from '../pages/admin/UserManagement'
import BannerManagement from '../pages/admin/BannerManagement'
import AccountLayout from '../components/layout/AccountLayout'
import Profile from '../pages/Profile'
import Addresses from '../pages/Addresses'
import Membership from '../pages/Membership'
import ProtectedRoute from './ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'verify-email', element: <VerifyEmail /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      {
        path: 'account',
        element: <ProtectedRoute />,
        children: [
          {
            path: '',
            element: <AccountLayout />,
            children: [
              { path: 'profile', element: <Profile /> },
              { path: 'addresses', element: <Addresses /> },
              { path: 'membership', element: <Membership /> },
              // Thêm các trang quản lý tài khoản khác (orders, ...) ở đây
            ]
          }
        ]
      }
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        path: '',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <UserManagement /> },
          { path: 'banners', element: <BannerManagement /> }
          // Thêm các trang admin khác ở đây (products, orders, customers...)
        ]
      }
    ]
  },
  { path: '*', element: <NotFound /> },
])

export default function Router() {
  return <RouterProvider router={router} />
}