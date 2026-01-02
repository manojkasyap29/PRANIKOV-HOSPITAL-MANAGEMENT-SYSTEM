import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Appointments from "./pages/Appointments";
import Prescriptions from "./pages/Prescriptions";
import VideoConsultation from "./pages/VideoConsultation";
import Pharmacy from "./pages/Pharmacy";
import { DashboardLayout } from '@/components/DashboardLayout';
import Profile from './pages/Profile';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Cart from './pages/Cart';
  import Checkout from '@/pages/Checkout';
  import Payment from '@/pages/Payment';
  import Orders from '@/pages/Orders';
  import OrderDetail from '@/pages/OrderDetail';
  import AdminUsers from '@/pages/AdminUsers';
  import AdminOrders from '@/pages/AdminOrders';
  import AdminPharmacy from '@/pages/AdminPharmacy';
  import AdminAppointments from '@/pages/AdminAppointments';
  import AdminAnalytics from '@/pages/AdminAnalytics';
  import AdminSettings from '@/pages/AdminSettings';
  import Assistants from '@/pages/Assistants';
import ProductDetail from './pages/ProductDetail';
import HealthRecords from './pages/HealthRecords';
import FindDoctors from './pages/FindDoctors';
import DoctorDetail from './pages/DoctorDetail';
import DoctorRecords from './pages/DoctorRecords';


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Appointments />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/prescriptions"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Prescriptions />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/video-consultation"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <VideoConsultation />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacy"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Pharmacy />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Profile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Patients />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PatientDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Cart />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Checkout />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/:orderId"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Payment />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Orders />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <OrderDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AdminUsers />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AdminOrders />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pharmacy"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AdminPharmacy />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AdminAppointments />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AdminAnalytics />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AdminSettings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/assistants"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Assistants />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/pharmacy/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ProductDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/health-records"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <HealthRecords />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctors"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <FindDoctors />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctors/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DoctorDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/records"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DoctorRecords />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
