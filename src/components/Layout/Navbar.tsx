import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Gamepad2, Plus, TrendingUp, Clock, Users, Settings, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">GameHub</span>
          </Link>
          
          {user && (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/trending">
                <Button variant="ghost" size="sm" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </Button>
              </Link>
              <Link to="/recent">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Recent
                </Button>
              </Link>
              <Link to="/groups">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  Groups
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <>
              <Link to="/create-post">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Post
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;