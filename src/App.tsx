import { createBrowserRouter, RouterProvider } from "react-router";
import Home from "./screens/main/Home";
import HorsyMain from "./screens/horsy/HorsyMain";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "horsy", element: <HorsyMain /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
