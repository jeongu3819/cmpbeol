import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import AlarmGuidePage from "../pages/AlarmGuidePage";
import AlarmGuideDetailPage from "../pages/AlarmGuideDetailPage";
import AlarmGuideFormPage from "../pages/AlarmGuideFormPage";
import InterlockGuidePage from "../pages/InterlockGuidePage";
import InterlockGuideDetailPage from "../pages/InterlockGuideDetailPage";
import InterlockGuideFormPage from "../pages/InterlockGuideFormPage";
import ImportPage from "../pages/ImportPage";
import SettingsPage from "../pages/SettingsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/alarms" replace />} />

        <Route path="/alarms" element={<AlarmGuidePage />} />
        <Route path="/alarms/new" element={<AlarmGuideFormPage />} />
        <Route path="/alarms/:id" element={<AlarmGuideDetailPage />} />
        <Route path="/alarms/:id/edit" element={<AlarmGuideFormPage />} />

        <Route path="/interlocks" element={<InterlockGuidePage />} />
        <Route path="/interlocks/new" element={<InterlockGuideFormPage />} />
        <Route path="/interlocks/:id" element={<InterlockGuideDetailPage />} />
        <Route
          path="/interlocks/:id/edit"
          element={<InterlockGuideFormPage />}
        />

        <Route path="/import" element={<ImportPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="*" element={<Navigate to="/alarms" replace />} />
      </Route>
    </Routes>
  );
}
