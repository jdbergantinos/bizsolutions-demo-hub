import { HashRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { HomePage } from "./pages/HomePage";
import { IndustriesPage } from "./pages/IndustriesPage";
import { IndustryDetailPage } from "./pages/IndustryDetailPage";
import { ServiceDetailPage } from "./pages/ServiceDetailPage";
import { DemoModulesPage } from "./pages/DemoModulesPage";
import { ModuleDemoPage, ServiceDemoPage } from "./pages/DemoRunnerPage";
import { SolutionsPage } from "./pages/SolutionsPage";
import { PresentationPage } from "./pages/PresentationPage";
import { ProfilesPage } from "./pages/ProfilesPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { EmptyState } from "./components/common/EmptyState";

export default function App() {
  return (
    // HashRouter keeps deep links working when the PWA is opened from the
    // home screen without a server-side rewrite rule.
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="industries" element={<IndustriesPage />} />
          <Route path="industries/:industryId" element={<IndustryDetailPage />} />
          <Route path="services/:serviceId" element={<ServiceDetailPage />} />
          <Route path="demos" element={<DemoModulesPage />} />
          <Route path="demo/module/:moduleType" element={<ModuleDemoPage />} />
          <Route path="demo/:serviceId" element={<ServiceDemoPage />} />
          <Route path="solutions" element={<SolutionsPage />} />
          <Route path="present" element={<PresentationPage />} />
          <Route path="profiles" element={<ProfilesPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="*"
            element={<EmptyState icon="CircleHelp" title="Page not found" message="Use the navigation below to get back on track." />}
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}
