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
import Cart from '../pages/Cart'
import ProductDetail from '../pages/ProductDetail'
import AdminRoute from './AdminRoute'
import AdminDashboard from '../pages/admin/AdminDashboard'
import UserManagement from '../pages/admin/UserManagement'
import BannerManagement from '../pages/admin/BannerManagement'
import ProductManagement from '../pages/admin/ProductManagement'
import OrderManagement from '../pages/admin/OrderManagement'
import CouponManagement from '../pages/admin/CouponManagement'
import Settings from '../pages/admin/Settings'
import CollectionManagement from '../pages/admin/CollectionManagement'
import InventoryReport from '../pages/admin/InventoryReport'
import ReviewManagement from '../pages/admin/ReviewManagement'
import AccountLayout from '../components/layout/AccountLayout'
import Profile from '../pages/Profile'
import Addresses from '../pages/Addresses'
import Membership from '../pages/Membership'
import Wishlist from '../pages/Wishlist'
import OrderHistory from '../pages/OrderHistory'
import OrderDetail from '../pages/OrderDetail'
import ProtectedRoute from './ProtectedRoute'
import CategoryProducts from '../pages/CategoryProducts'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'category/:slug', element: <CategoryProducts /> },
      { path: 'search', element: <CategoryProducts /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'cart', element: <Cart /> },
      { path: 'product/:slug', element: <ProductDetail /> },
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
              { path: 'orders', element: <OrderHistory /> },
              { path: 'orders/:orderCode', element: <OrderDetail /> },
              { path: 'membership', element: <Membership /> },
              { path: 'favorites', element: <Wishlist /> },
              // Thêm các trang quản lý tài khoản khác (orders, ...) ở đây
            ]
          }
        ]
      }
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute allowedRoles={['admin']} />,
    children: [
      {
        path: '',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <UserManagement /> },
          { path: 'settings', element: <Settings /> }
        ]
      }
    ]
  },
  {
    path: '/staff',
    element: <AdminRoute allowedRoles={['staff']} />,
    children: [
      {
        path: '',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'products', element: <ProductManagement /> },
          { path: 'collections', element: <CollectionManagement /> },
          { path: 'inventory', element: <InventoryReport /> },
          { path: 'orders', element: <OrderManagement /> },
          { path: 'reviews', element: <ReviewManagement /> },
          { path: 'coupons', element: <CouponManagement /> },
          { path: 'banners', element: <BannerManagement /> },
          { path: 'settings', element: <Settings /> }
        ]
      }
    ]
  },
  { path: '*', element: <NotFound /> },
])

export default function Router() {
  return <RouterProvider router={router} />
}
