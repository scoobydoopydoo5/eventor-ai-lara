import { FiMoon as Moon, FiSun as Sun } from 'react-icons/fi';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const colors = [
  { name: 'Purple', value: 'purple' as const, class: 'bg-purple-600' },
  { name: 'Blue', value: 'blue' as const, class: 'bg-blue-600' },
  { name: 'Green', value: 'green' as const, class: 'bg-green-600' },
  { name: 'Orange', value: 'orange' as const, class: 'bg-orange-600' },
  { name: 'Pink', value: 'pink' as const, class: 'bg-pink-600' },
];

export function ThemeSelector() {
  const { mode, color, setMode, setColor } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
        className="transition-smooth hover:bg-accent"
      >
        {mode === 'light' ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="transition-smooth hover:bg-accent">
            <div className={`h-5 w-5 rounded-full ${colors.find(c => c.value === color)?.class}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Theme Color</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {colors.map((c) => (
            <DropdownMenuItem
              key={c.value}
              onClick={() => setColor(c.value)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className={`h-4 w-4 rounded-full ${c.class}`} />
              <span>{c.name}</span>
              {color === c.value && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
