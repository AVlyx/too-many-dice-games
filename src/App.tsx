import { createBrowserRouter, RouterProvider } from "react-router";
import Home from "./screens/main/Home";
import HorsyMain from "./screens/horsy/HorsyMain";
import HorsyRoom from "./screens/horsy/room/HorsyRoom";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "horsy", element: <HorsyMain /> },
  { path: "horsy/room", element: <HorsyRoom /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
