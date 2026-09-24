import { createBrowserRouter } from 'react-router-dom'
import App from './App'

import Home from '../pages/public/Home'
import StudentDashboard from '../pages/student/Dashboard'
import ExcoDashboard from '../pages/exco/Dashboard'
import VPDashboard from '../pages/vp/Dashboard'
import PresidentDashboard from '../pages/president/Dashboard'
import AdminDashboard from '../pages/admin/Dashboard'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'student',
        element: <StudentDashboard />,
      },
      {
        path: 'exco',
        element: <ExcoDashboard />,
      },
      {
        path: 'vp',
        element: <VPDashboard />,
      },
      {
        path: 'president',
        element: <PresidentDashboard />,
      },
      {
        path: 'admin',
        element: <AdminDashboard />,
      },
    ],
  },
])

export default router