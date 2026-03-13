import { BrowserRouter, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import ArchitecturePage from "./pages/ArchitecturePage";
import ProposalSubmitPage from "./pages/ProposalSubmitPage";
import PublicWallPage from "./pages/PublicWallPage";
import SuccessPage from "./pages/SuccessPage";
import TrackDetailPage from "./pages/TrackDetailPage";
import TrackLookupPage from "./pages/TrackLookupPage";
import VentSubmitPage from "./pages/VentSubmitPage";
import AdminFeedbackDetailPage from "./pages/admin/AdminFeedbackDetailPage";
import AdminFeedbackListPage from "./pages/admin/AdminFeedbackListPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminPublicWallPage from "./pages/admin/AdminPublicWallPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
        <Route path="/submit/vent" element={<VentSubmitPage />} />
        <Route path="/submit/proposal" element={<ProposalSubmitPage />} />
        <Route path="/success/:threadCode" element={<SuccessPage />} />
        <Route path="/track" element={<TrackLookupPage />} />
        <Route path="/track/:threadCode" element={<TrackDetailPage />} />
        <Route path="/wall" element={<PublicWallPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/feedbacks" element={<AdminFeedbackListPage />} />
        <Route path="/admin/feedbacks/:feedbackId" element={<AdminFeedbackDetailPage />} />
        <Route path="/admin/public-wall" element={<AdminPublicWallPage />} />
      </Routes>
    </BrowserRouter>
  );
}
