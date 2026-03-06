import SPRTable from "@/components/SPRTable";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {!user && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            <LogIn size={16} /> Iniciar Sesión
          </button>
        </div>
      )}
      <SPRTable />
    </>
  );
};

export default Index;
