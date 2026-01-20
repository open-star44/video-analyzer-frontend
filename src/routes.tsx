import {createBrowserRouter} from "react-router-dom";
import RootLayout from "@/pages/Layout.tsx";
import ErrorPage from "@/pages/errorpage.tsx";
import Home from "@/pages/home.tsx";
import Dashboard from "@/pages/dashboard.tsx";
import PrivateRoute from "@/pages/private-route.tsx";

export const router = createBrowserRouter([
    {
        path: '',
        element: <RootLayout />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: '/',
                element: <Home />,
            },
            {
                path: '/dashboard',
                element: <Dashboard />,
            },
            {
                path:'',
                element: <PrivateRoute />,
                children: [
                    {
                        path: '/dashboard',
                        element: <Dashboard />
                    }
                ]
            },
        ]
    }
])
