import React from 'react';
import { CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command';
import { cn } from '@/lib/utils';

type DataTableFacetedFilterProps = {
  title?: string;
  options: {
    label: string;
    value: string;
  }[];
  inputValue?: string;
  selectedValues?: string[];
  setFilterValue: (value: string[] | undefined) => void;
  shouldFilter?: boolean | undefined;
  onInputValueChange?: (value: string) => void;
};

export const FacetFilter: React.FC<DataTableFacetedFilterProps> = ({
  title,
  selectedValues,
  options,
  inputValue,
  setFilterValue,
  shouldFilter,
  onInputValueChange,
}) => {
  const uniqueSelectedValues = new Set(selectedValues);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed font-normal">
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {uniqueSelectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {uniqueSelectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {uniqueSelectedValues.size > 1 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {uniqueSelectedValues.size} selected
                  </Badge>
                ) : (
                  Array.from(uniqueSelectedValues).map((option) => (
                    <Badge variant="secondary" key={option} className="rounded-sm px-1 font-normal">
                      {option}
                    </Badge>
                  ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command shouldFilter={shouldFilter}>
          <CommandInput placeholder={title} value={inputValue} onValueChange={onInputValueChange} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = uniqueSelectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        uniqueSelectedValues.delete(option.value);
                      } else {
                        uniqueSelectedValues.add(option.value);
                      }
                      const filterValues = Array.from(uniqueSelectedValues);
                      setFilterValue(filterValues.length ? filterValues : undefined);
                    }}>
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                      )}>
                      <CheckIcon className={cn('h-4 w-4')} />
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {uniqueSelectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => setFilterValue(undefined)} className="justify-center text-center">
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
