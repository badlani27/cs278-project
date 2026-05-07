import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { Protected } from "./components/Protected";
import { BoardDetailPage } from "./pages/BoardDetailPage";
import { BoardNewPage } from "./pages/BoardNewPage";
import { BoardRemixPage } from "./pages/BoardRemixPage";
import { FeedPage } from "./pages/FeedPage";
import { LoginPage } from "./pages/LoginPage";
import { MePage } from "./pages/MePage";
import { ProfilePage } from "./pages/ProfilePage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<FeedPage />} />
        <Route path="/boards/:id" element={<BoardDetailPage />} />
        <Route path="/users/:id" element={<ProfilePage />} />
        <Route path="/me" element={<MePage />} />
        <Route
          path="/boards/new"
          element={
            <Protected>
              <BoardNewPage />
            </Protected>
          }
        />
        <Route
          path="/boards/:id/remix"
          element={
            <Protected>
              <BoardRemixPage />
            </Protected>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
