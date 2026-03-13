import { BrowserRouter, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import ArchitecturePage from "./pages/ArchitecturePage";
import ProposalSubmitPage from "./pages/ProposalSubmitPage";
import PublicWallPage from "./pages/PublicWallPage";
import RetrospectivePage from "./pages/RetrospectivePage";
import SuccessPage from "./pages/SuccessPage";
import TrackDetailPage from "./pages/TrackDetailPage";
import TrackLookupPage from "./pages/TrackLookupPage";
import VentSubmitPage from "./pages/VentSubmitPage";
import AdminFeedbackDetailPage from "./pages/admin/AdminFeedbackDetailPage";
import AdminFeedbackListPage from "./pages/admin/AdminFeedbackListPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminPublicWallPage from "./pages/admin/AdminPublicWallPage";
import LoungeLandingPage from "./pages/lounge/LoungeLandingPage";
import LoungeRoomPage from "./pages/lounge/LoungeRoomPage";
import LoungeTicketPage from "./pages/lounge/LoungeTicketPage";
import ExecutiveRegisterPage from "./pages/lounge/ExecutiveRegisterPage";
import ExecutiveLoginPage from "./pages/lounge/ExecutiveLoginPage";
import ExecutiveLoungePage from "./pages/lounge/ExecutiveLoungePage";
import TenantAdminLoginPage from "./pages/lounge/TenantAdminLoginPage";
import TenantLoungeAdminPage from "./pages/lounge/TenantLoungeAdminPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
        <Route path="/retrospective" element={<RetrospectivePage />} />
        <Route path="/submit/vent" element={<VentSubmitPage />} />
        <Route path="/submit/proposal" element={<ProposalSubmitPage />} />
        <Route path="/success/:threadCode" element={<SuccessPage />} />
        <Route path="/track" element={<TrackLookupPage />} />
        <Route path="/track/:threadCode" element={<TrackDetailPage />} />
        <Route path="/wall" element={<PublicWallPage />} />
        <Route path="/t/:tenantSlug/lounge" element={<LoungeLandingPage />} />
        <Route path="/t/:tenantSlug/lounge/:eventId/ticket" element={<LoungeTicketPage />} />
        <Route path="/t/:tenantSlug/lounge/:eventId/room" element={<LoungeRoomPage />} />
        <Route path="/t/:tenantSlug/executive/register" element={<ExecutiveRegisterPage />} />
        <Route path="/t/:tenantSlug/executive/login" element={<ExecutiveLoginPage />} />
        <Route path="/t/:tenantSlug/executive/lounge" element={<ExecutiveLoungePage />} />
        <Route path="/t/:tenantSlug/admin/login" element={<TenantAdminLoginPage />} />
        <Route path="/t/:tenantSlug/admin/lounge-events" element={<TenantLoungeAdminPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/feedbacks" element={<AdminFeedbackListPage />} />
        <Route path="/admin/feedbacks/:feedbackId" element={<AdminFeedbackDetailPage />} />
        <Route path="/admin/public-wall" element={<AdminPublicWallPage />} />
      </Routes>
    </BrowserRouter>
  );
}
