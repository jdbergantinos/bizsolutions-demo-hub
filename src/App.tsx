import { lazy, Suspense, type ComponentType } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { HomePage } from "./pages/HomePage";
import { EmptyState } from "./components/common/EmptyState";
import { PageLoader } from "./components/common/PageLoader";

// Every screen except Home is loaded on demand so the first paint and each
// app update download only what is needed. Pages use named exports, so this
// helper adapts them to React.lazy. Vite emits one chunk per import() call;
// the service worker precaches all of them, so offline navigation still works.
function lazyPage<K extends string, M extends Record<K, ComponentType<any>>>(
  load: () => Promise<M>,
  name: K,
) {
  return lazy(() => load().then((m) => ({ default: m[name] })));
}

const IndustriesPage = lazyPage(() => import("./pages/IndustriesPage"), "IndustriesPage");
const IndustryDetailPage = lazyPage(() => import("./pages/IndustryDetailPage"), "IndustryDetailPage");
const ServiceDetailPage = lazyPage(() => import("./pages/ServiceDetailPage"), "ServiceDetailPage");
const DemoModulesPage = lazyPage(() => import("./pages/DemoModulesPage"), "DemoModulesPage");
const ModuleDemoPage = lazyPage(() => import("./pages/DemoRunnerPage"), "ModuleDemoPage");
const ServiceDemoPage = lazyPage(() => import("./pages/DemoRunnerPage"), "ServiceDemoPage");
const SolutionsPage = lazyPage(() => import("./pages/SolutionsPage"), "SolutionsPage");
const PresentationPage = lazyPage(() => import("./pages/PresentationPage"), "PresentationPage");
const ProfilesPage = lazyPage(() => import("./pages/ProfilesPage"), "ProfilesPage");
const FavoritesPage = lazyPage(() => import("./pages/FavoritesPage"), "FavoritesPage");
const SettingsPage = lazyPage(() => import("./pages/SettingsPage"), "SettingsPage");
const PricingListPage = lazyPage(() => import("./pricing/pages/PricingListPage"), "PricingListPage");
const PricingConfiguratorPage = lazyPage(() => import("./pricing/pages/PricingConfiguratorPage"), "PricingConfiguratorPage");
const EstimateViewPage = lazyPage(() => import("./pricing/pages/EstimateViewPage"), "EstimateViewPage");
const PricingAdminPage = lazyPage(() => import("./pricing/pages/PricingAdminPage"), "PricingAdminPage");
const DiscoveryPage = lazyPage(() => import("./discovery/pages/DiscoveryPage"), "DiscoveryPage");
const ProblemScannerPage = lazyPage(() => import("./discovery/pages/ProblemScannerPage"), "ProblemScannerPage");
const RecommendationsPage = lazyPage(() => import("./discovery/pages/RecommendationsPage"), "RecommendationsPage");
const WorkflowComparisonPage = lazyPage(() => import("./discovery/pages/WorkflowComparisonPage"), "WorkflowComparisonPage");
const PresentationBuilderPage = lazyPage(() => import("./discovery/pages/PresentationBuilderPage"), "PresentationBuilderPage");
const GuidedPresentationPage = lazyPage(() => import("./discovery/pages/GuidedPresentationPage"), "GuidedPresentationPage");
const ClientIntakePage = lazyPage(() => import("./discovery/pages/ClientIntakePage"), "ClientIntakePage");
const RoiCalculatorPage = lazyPage(() => import("./value/pages/RoiCalculatorPage"), "RoiCalculatorPage");
const PackageComparisonPage = lazyPage(() => import("./value/pages/PackageComparisonPage"), "PackageComparisonPage");
const ScopeBuilderPage = lazyPage(() => import("./value/pages/ScopeBuilderPage"), "ScopeBuilderPage");
const RoadmapPage = lazyPage(() => import("./value/pages/RoadmapPage"), "RoadmapPage");
const MeetingsPage = lazyPage(() => import("./value/pages/MeetingsPage"), "MeetingsPage");
const SummaryPage = lazyPage(() => import("./value/pages/SummaryPage"), "SummaryPage");
const TrustCenterPage = lazyPage(() => import("./toolkit/pages/TrustCenterPage"), "TrustCenterPage");
const IntegrationsPage = lazyPage(() => import("./toolkit/pages/IntegrationsPage"), "IntegrationsPage");
const NotificationSimulatorPage = lazyPage(() => import("./toolkit/pages/NotificationSimulatorPage"), "NotificationSimulatorPage");
const ApprovalShowcasePage = lazyPage(() => import("./toolkit/pages/ApprovalShowcasePage"), "ApprovalShowcasePage");
const DashboardSelectorPage = lazyPage(() => import("./toolkit/pages/DashboardSelectorPage"), "DashboardSelectorPage");
const TemplatesPage = lazyPage(() => import("./toolkit/pages/TemplatesPage"), "TemplatesPage");
const ScenarioLibraryPage = lazyPage(() => import("./toolkit/pages/ScenarioLibraryPage"), "ScenarioLibraryPage");
const ObjectionGuidePage = lazyPage(() => import("./toolkit/pages/ObjectionGuidePage"), "ObjectionGuidePage");
const HistoryPage = lazyPage(() => import("./toolkit/pages/HistoryPage"), "HistoryPage");

export default function App() {
  return (
    // HashRouter keeps deep links working when the PWA is opened from the
    // home screen without a server-side rewrite rule.
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Full-screen guided presentation — outside the app chrome so there
              is no navigation to tap accidentally while presenting. */}
          <Route path="presentation" element={<GuidedPresentationPage />} />
          {/* Client intake — full-screen and outside the app chrome so a client
              filling it in cannot reach pricing, other clients, or settings. */}
          <Route path="intake" element={<ClientIntakePage />} />
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
      </Suspense>
    </HashRouter>
  );
}
