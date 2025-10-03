import { useTheme } from '@/contexts/ThemeContext';

const themeColorMap = {
  purple: '#a855f7',
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f97316',
  pink: '#ec4899',
};

export function useKawaiiTheme() {
  const { color } = useTheme();
  
  return {
    kawaiiColor: themeColorMap[color],
    themeColor: color,
  };
}
