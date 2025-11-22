import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm h-[52px] flex items-center justify-between px-6 py-3 box-border">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
            <AvatarFallback className="bg-transparent text-gray-900 font-bold text-xs">S</AvatarFallback>
          </Avatar>
          <div className="h-8 w-[1px] bg-gray-200 mx-1" />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight text-gray-900">Saama</span>
            <span className="text-lg font-light text-gray-500">Digital Study Platform</span>
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
          <Input 
            className="w-full rounded-full border-gray-200 bg-gray-50 pl-10 pr-4 h-9 text-sm focus-visible:ring-1 focus-visible:ring-gray-900 transition-all hover:bg-gray-100 focus:bg-white shadow-none"
            placeholder="Search sites, protocols, or investigators..." 
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 cursor-pointer hover:bg-gray-50 rounded-full pr-3 py-1 transition-colors">
          <Avatar className="h-8 w-8 border border-gray-200">
            <AvatarFallback className="bg-gray-900 text-white text-xs">AD</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-gray-700 hidden md:block">Angshuman Deb</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </div>
      </div>
    </nav>
  );
}
