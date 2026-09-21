import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#252522]">
      <Navbar />

      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;