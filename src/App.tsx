import { createBrowserRouter, RouterProvider } from "react-router";
import Home from "./screens/main/Home";
import HorsyMain from "./screens/horsy/HorsyMain";
import HorsyRoom from "./screens/horsy/room/HorsyRoom";
import BackgammonMain from "./screens/backgammon/BackgammonMain";
import BackgammonRoom from "./screens/backgammon/room/BackgammonRoom";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "horsy", element: <HorsyMain /> },
  { path: "horsy/room", element: <HorsyRoom /> },
  { path: "backgammon", element: <BackgammonMain /> },
  { path: "backgammon/room", element: <BackgammonRoom /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
