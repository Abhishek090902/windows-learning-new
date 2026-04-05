  import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Compass } from "lucide-react";
import AppStatusPage from "@/components/status/AppStatusPage";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <AppStatusPage
      code="404"
      badge="Page Missing"
      title="This route wandered off the map."
      description="The page you tried to open does not exist, may have moved, or the link might be outdated. The rest of the platform is still available."
      accentClass="bg-[radial-gradient(circle,rgba(59,130,246,0.28),rgba(255,255,255,0))]"
      icon={<Compass className="h-7 w-7" />}
      details={
        <>
          <span className="font-medium text-slate-900">Requested path:</span>{' '}
          <span className="font-mono text-[13px]">{location.pathname}</span>
        </>
      }
      primaryAction={{ label: "Back to Homepage", to: "/" }}
      secondaryAction={{ label: "Browse Mentors", to: "/mentors" }}
    />
  );
};

export default NotFound;
