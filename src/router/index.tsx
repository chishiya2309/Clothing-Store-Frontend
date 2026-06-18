import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import AdminLayout from '../components/layout/AdminLayout'
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import VerifyEmail from '../pages/VerifyEmail'
import NotFound from '../pages/NotFound'
import AdminRoute from './AdminRoute'
import AdminDashboard from '../pages/admin/AdminDashboard'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'verify-email', element: <VerifyEmail /> },
      // Thêm các route khác ở đây
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
          { index: true, element: <AdminDashboard /> }
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