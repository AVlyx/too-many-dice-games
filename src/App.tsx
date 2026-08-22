import { createBrowserRouter, RouterProvider } from "react-router";
import Home from "./screens/main/Home";
import BackgammonMain from "./screens/backgammon/BackgammonMain";
import HorsyMain from "./screens/horsy/HorsyMain";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "backgammon", element: <BackgammonMain /> },
  { path: "horsy", element: <HorsyMain /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
