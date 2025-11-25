import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import saamaLogo from "@assets/image_1763828618655.png";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 h-18 flex items-center justify-between px-8 transition-all duration-300 support-[backdrop-filter]:bg-white/60">
      {/* Left Section - Logo & Brand */}
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-4">
          <img src={saamaLogo} alt="Saama" className="h-7 w-auto object-contain" />
          <div className="h-6 w-px bg-gray-300" />
          <span className="text-lg font-semibold text-gray-900 tracking-tight">Agentic NBA Platform</span>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-2xl mx-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            className="w-full rounded-lg border-gray-300 bg-gray-50 pl-11 pr-4 h-10 text-sm placeholder:text-gray-400 apple-focus focus-visible:bg-white transition-all"
            placeholder="Search HCPs..." 
          />
        </div>
      </div>

      {/* Right Section - User */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 cursor-pointer group">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gray-900 text-white text-xs font-medium">AD</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Angshuman Deb</span>
        </div>
      </div>
    </nav>
  );
}
