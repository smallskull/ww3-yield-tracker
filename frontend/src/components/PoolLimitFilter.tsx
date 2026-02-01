import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers } from 'lucide-react';

interface PoolLimitFilterProps {
    value: number;
    onChange: (value: number) => void;
}

const LIMIT_OPTIONS = [
    { value: 10, label: '10 Pools' },
    { value: 20, label: '20 Pools' },
    { value: 30, label: '30 Pools' },
    { value: 50, label: '50 Pools' },
];

export function PoolLimitFilter({ value, onChange }: PoolLimitFilterProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Show:</span>
            </div>
            <Select value={value.toString()} onValueChange={(val) => onChange(parseInt(val))}>
                <SelectTrigger className="w-[140px] bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Select limit" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                    {LIMIT_OPTIONS.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                            className="hover:bg-primary/10 cursor-pointer"
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}