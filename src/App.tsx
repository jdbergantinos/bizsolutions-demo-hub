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
import { PricingListPage } from "./pricing/pages/PricingListPage";
import { PricingConfiguratorPage } from "./pricing/pages/PricingConfiguratorPage";
import { EstimateViewPage } from "./pricing/pages/EstimateViewPage";
import { PricingAdminPage } from "./pricing/pages/PricingAdminPage";
import { DiscoveryPage } from "./discovery/pages/DiscoveryPage";
import { ProblemScannerPage } from "./discovery/pages/ProblemScannerPage";
import { RecommendationsPage } from "./discovery/pages/RecommendationsPage";
import { WorkflowComparisonPage } from "./discovery/pages/WorkflowComparisonPage";
import { PresentationBuilderPage } from "./discovery/pages/PresentationBuilderPage";
import { GuidedPresentationPage } from "./discovery/pages/GuidedPresentationPage";
import { RoiCalculatorPage } from "./value/pages/RoiCalculatorPage";
import { PackageComparisonPage } from "./value/pages/PackageComparisonPage";
import { ScopeBuilderPage } from "./value/pages/ScopeBuilderPage";
import { RoadmapPage } from "./value/pages/RoadmapPage";
import { MeetingsPage } from "./value/pages/MeetingsPage";
import { SummaryPage } from "./value/pages/SummaryPage";
import { TrustCenterPage } from "./toolkit/pages/TrustCenterPage";
import { IntegrationsPage } from "./toolkit/pages/IntegrationsPage";
import { NotificationSimulatorPage } from "./toolkit/pages/NotificationSimulatorPage";
import { ApprovalShowcasePage } from "./toolkit/pages/ApprovalShowcasePage";
import { DashboardSelectorPage } from "./toolkit/pages/DashboardSelectorPage";
import { TemplatesPage } from "./toolkit/pages/TemplatesPage";
import { ScenarioLibraryPage } from "./toolkit/pages/ScenarioLibraryPage";
import { ObjectionGuidePage } from "./toolkit/pages/ObjectionGuidePage";
import { HistoryPage } from "./toolkit/pages/HistoryPage";
import { EmptyState } from "./components/common/EmptyState";

export default function App() {
  return (
    // HashRouter keeps deep links working when the PWA is opened from the
    // home screen without a server-side rewrite rule.
    <HashRouter>
      <Routes>
        {/* Full-screen guided presentation — outside the app chrome so there
            is no navigation to tap accidentally while presenting. */}
        <Route path="presentation" element={<GuidedPresentationPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="industries" element={<IndustriesPage />} />
          <Route path="industries/:industryId" element={<IndustryDetailPage />} />
          <Route path="services/:serviceId" element={<ServiceDetailPage />} />
          <Route path="demos" element={<DemoModulesPage />} />
          <Route path="demo/module/:moduleType" element={<ModuleDemoPage />} />
          <Route path="demo/:serviceId" element={<ServiceDemoPage />} />
          <Route path="discovery" element={<DiscoveryPage />} />
          <Route path="problem-scanner" element={<ProblemScannerPage />} />
          <Route path="solution-recommendations" element={<RecommendationsPage />} />
          <Route path="workflow-comparison" element={<WorkflowComparisonPage />} />
          <Route path="presentation-builder" element={<PresentationBuilderPage />} />
          <Route path="roi" element={<RoiCalculatorPage />} />
          <Route path="packages" element={<PackageComparisonPage />} />
          <Route path="scope" element={<ScopeBuilderPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="summary" element={<SummaryPage />} />
          <Route path="trust" element={<TrustCenterPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="notifications" element={<NotificationSimulatorPage />} />
          <Route path="approvals-showcase" element={<ApprovalShowcasePage />} />
          <Route path="dashboard-selector" element={<DashboardSelectorPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="scenario-library" element={<ScenarioLibraryPage />} />
          <Route path="objections" element={<ObjectionGuidePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="pricing" element={<PricingListPage />} />
          <Route path="pricing/new" element={<PricingConfiguratorPage />} />
          <Route path="pricing/estimate/:estimateId" element={<EstimateViewPage />} />
          <Route path="pricing/admin" element={<PricingAdminPage />} />
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
