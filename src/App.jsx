import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import LGUPortal from "./pages/LGUPortal";
import BarangayPortal from "./pages/BarangayPortal";
import CollectionStaffPortal from "./pages/CollectionStaffPortal";

export default function App() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-900">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/lgu" element={<LGUPortal />} />
        <Route path="/barangay" element={<BarangayPortal />} />
        <Route path="/collector" element={<CollectionStaffPortal />} />
      </Routes>
    </div>
  );
}