import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import GuidesPage from "../pages/GuidesPage";
import GuideFormPage from "../pages/GuideFormPage";
import GuideDetailPage from "../pages/GuideDetailPage";
import ImportPage from "../pages/ImportPage";
import SettingsPage from "../pages/SettingsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/guides" replace />} />

        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/guides/new" element={<GuideFormPage />} />
        <Route path="/guides/:id" element={<GuideDetailPage />} />
        <Route path="/guides/:id/edit" element={<GuideFormPage />} />

        <Route path="/import" element={<ImportPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="*" element={<Navigate to="/guides" replace />} />
      </Route>
    </Routes>
  );
}
