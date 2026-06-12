import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import NotFound from '../pages/NotFound'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      // Thêm các route khác ở đây
    ],
  },
  { path: '*', element: <NotFound /> },
])

export default function Router() {
  return <RouterProvider router={router} />
}