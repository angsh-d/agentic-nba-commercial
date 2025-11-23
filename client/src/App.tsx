import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import HCPDetail from "@/pages/HCPDetail";
import InvestigationHub from "@/pages/InvestigationHub";
import StrategiesPage from "@/pages/StrategiesPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/hcp/:id/investigate" component={InvestigationHub} />
      <Route path="/hcp/:id/strategies" component={StrategiesPage} />
      <Route path="/hcp/:id" component={HCPDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
