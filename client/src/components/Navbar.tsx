import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, Bell, Network, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import saamaLogo from "@assets/image_1763828618655.png";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200 h-16 flex items-center justify-between px-6 transition-all duration-300 support-[backdrop-filter]:bg-white/60">
      {/* Left Section - Logo & Brand */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <img src={saamaLogo} alt="Saama" className="h-6 w-auto object-contain opacity-90" />
          <div className="h-5 w-px bg-gray-300" />
          <span className="text-[17px] font-semibold text-gray-900 tracking-tight">Agentic NBA Platform</span>
          <div className="flex items-center gap-2 ml-2">
            <a
              href="https://console-preview.neo4j.io/projects/8db048a7-3c7c-4d4a-9090-9846bc99025b/instances"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1.5"
              data-testid="badge-view-graph"
            >
              <Network className="h-3 w-3" />
              Graph
            </a>
            <a
              href="/data-explorer"
              className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1.5"
              data-testid="badge-view-data"
            >
              <Database className="h-3 w-3" />
              Data
            </a>
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-gray-400 transition-colors" />
          <Input 
            className="w-full rounded-lg border-gray-300 bg-gray-50 pl-10 pr-4 h-9 text-[14px] placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-400 focus-visible:border-gray-400 focus-visible:bg-white transition-all"
            placeholder="Search HCPs..." 
          />
        </div>
      </div>

      {/* Right Section - User */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer group">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-gray-900 text-white text-[11px] font-medium">AD</AvatarFallback>
          </Avatar>
          <span className="text-[13px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Angshuman Deb</span>
        </div>
      </div>
    </nav>
  );
}
