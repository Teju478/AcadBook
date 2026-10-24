import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './components/Auth.jsx';
import { AdminRegistrationPage, HomePage, InstitutionPortalPage, LoginPage, NotFoundPage, RegistrationPage } from './pages/PublicPages.jsx';
import { AdminBookingsPage, AdminRequestDetailsPage, AdminRequestsPage, AdminResourceEditorPage, AdminResourcesPage, AdminUsersPage, BookingConfirmationPage, BookingRequestPage, BrowseResourcesPage, MyBookingsPage, ProfilePage, ResourceDetailsPage, RoleDashboard } from './pages/WorkspacePages.jsx';

export default function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/portal/:slug" element={<InstitutionPortalPage />} />
    <Route path="/register/user" element={<RegistrationPage role="user" />} />
    <Route path="/register/admin" element={<AdminRegistrationPage />} />
    <Route path="/login/user" element={<LoginPage role="user" />} />
    <Route path="/login/admin" element={<LoginPage role="admin" />} />

    <Route element={<ProtectedRoute role="user" />}>
      <Route path="/user/dashboard" element={<RoleDashboard role="user" />} />
      <Route path="/user/resources" element={<BrowseResourcesPage role="user" />} />
      <Route path="/user/resources/:resourceId" element={<ResourceDetailsPage role="user" />} />
      <Route path="/user/resources/:resourceId/book" element={<BookingRequestPage role="user" />} />
      <Route path="/user/bookings/:bookingId/confirmation" element={<BookingConfirmationPage role="user" />} />
      <Route path="/user/bookings" element={<MyBookingsPage role="user" />} />
      <Route path="/user/profile" element={<ProfilePage role="user" />} />
    </Route>

    <Route element={<ProtectedRoute role="admin" />}>
      <Route path="/admin/dashboard" element={<RoleDashboard role="admin" />} />
      <Route path="/admin/requests" element={<AdminRequestsPage />} />
      <Route path="/admin/requests/:bookingId" element={<AdminRequestDetailsPage />} />
      <Route path="/admin/bookings" element={<AdminBookingsPage />} />
      <Route path="/admin/resources" element={<AdminResourcesPage />} />
      <Route path="/admin/resources/new" element={<AdminResourceEditorPage mode="create" />} />
      <Route path="/admin/resources/:resourceId/edit" element={<AdminResourceEditorPage mode="edit" />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/admin/profile" element={<ProfilePage role="admin" />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes></AuthProvider></BrowserRouter>;
}
