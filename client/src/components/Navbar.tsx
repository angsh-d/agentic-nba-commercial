import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import saamaLogo from "@assets/image_1763828618655.png";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-black/5 shadow-sm h-[52px] flex items-center justify-between px-6 transition-all duration-300 support-[backdrop-filter]:bg-white/50">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            <img src={saamaLogo} alt="Saama" className="h-7 w-auto object-contain" />
          </div>
          <div className="h-6 w-[1px] bg-gray-200 mx-1" />
          <div className="flex items-baseline gap-2">
            <span className="text-[17px] font-normal text-gray-500 tracking-tight">Commercial Agentic AI</span>
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
          <Input 
            className="w-full rounded-lg border-transparent bg-black/5 pl-10 pr-4 h-9 text-[13px] font-medium placeholder:text-gray-500 focus-visible:ring-0 focus-visible:bg-black/10 transition-all shadow-none"
            placeholder="Search HCPs, territories, or insights..." 
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 hover:bg-black/5 rounded-full h-8 w-8 transition-colors">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 pl-2 cursor-pointer hover:bg-black/5 rounded-full pr-2 py-1 transition-colors duration-200">
          <Avatar className="h-7 w-7 border border-black/10 shadow-sm">
            <AvatarFallback className="bg-gray-900 text-white text-[10px] font-medium">AD</AvatarFallback>
          </Avatar>
          <span className="text-[13px] font-medium text-gray-700 hidden md:block tracking-tight">Angshuman Deb</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </div>
      </div>
    </nav>
  );
}
