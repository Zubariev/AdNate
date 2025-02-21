import { Search } from 'lucide-react';

export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative w-full">
      <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search posts by title, content, or tags..."
        className="w-full px-12 py-3 text-gray-300 transition-all duration-300 border rounded-lg bg-white/5 border-white/10 focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400"
      />
    </div>
  );
} 