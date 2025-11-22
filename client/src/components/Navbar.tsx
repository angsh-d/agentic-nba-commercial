import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import saamaLogo from "@assets/image_1763828618655.png";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-black/5 shadow-sm h-[72px] flex items-center justify-between px-12 transition-all duration-300 support-[backdrop-filter]:bg-white/50">
      {/* Left Section */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center">
            <img src={saamaLogo} alt="Saama" className="h-8 w-auto object-contain" />
          </div>
          <div className="h-7 w-[1px] bg-gray-200 mx-2" />
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] font-normal text-gray-500 tracking-tight">Commercial Agentic AI</span>
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-2xl mx-12">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
          <Input 
            className="w-full rounded-xl border-transparent bg-black/5 pl-11 pr-4 h-10 text-[14px] font-medium placeholder:text-gray-500 focus-visible:ring-0 focus-visible:bg-black/10 transition-all shadow-none"
            placeholder="Search HCPs, territories, or insights..." 
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 hover:bg-black/5 rounded-full h-9 w-9 transition-colors">
          <Bell className="h-[18px] w-[18px]" />
        </Button>
        <div className="flex items-center gap-2.5 pl-2.5 cursor-pointer hover:bg-black/5 rounded-full pr-3 py-1.5 transition-colors duration-200">
          <Avatar className="h-8 w-8 border border-black/10 shadow-sm">
            <AvatarFallback className="bg-gray-900 text-white text-[11px] font-medium">AD</AvatarFallback>
          </Avatar>
          <span className="text-[14px] font-medium text-gray-700 hidden md:block tracking-tight">Angshuman Deb</span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </div>
      </div>
    </nav>
  );
}
