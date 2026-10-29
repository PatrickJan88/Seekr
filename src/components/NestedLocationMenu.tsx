import React, { useState, useMemo, useRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MapPin, ChevronRight, Check, Search, X } from "lucide-react";
import { cn } from "../lib/utils";

interface NestedLocationMenuProps {
  locationTree: Map<string, Map<string, Set<string>>>;
  continentFilter: string;
  countryFilter: string;
  cityFilter: string;
  onSelectContinent: (continent: string) => void;
  onSelectCountry: (country: string) => void;
  onSelectCity: (city: string) => void;
  className?: string;
}

export function NestedLocationMenu({
  locationTree,
  continentFilter,
  countryFilter,
  cityFilter,
  onSelectContinent,
  onSelectCountry,
  onSelectCity,
  className,
}: NestedLocationMenuProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isExcluded = (val?: string) => {
    if (!val) return true;
    const lower = val.trim().toLowerCase();
    return lower === 'other' || lower === 'remote' || lower === 'remote / global' || lower.includes('remote') || lower.includes('other');
  };

  const continents = useMemo(() => {
    return Array.from(locationTree.keys())
      .filter(c => !isExcluded(c))
      .sort();
  }, [locationTree]);

  // Flattened locations for real-time search & letter jump
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const startsWith: Array<{ continent: string; country: string; city: string; label: string }> = [];
    const contains: Array<{ continent: string; country: string; city: string; label: string }> = [];

    for (const [continent, countriesMap] of locationTree.entries()) {
      if (isExcluded(continent)) continue;
      for (const [country, citiesSet] of countriesMap.entries()) {
        if (isExcluded(country)) continue;

        const countryLower = country.toLowerCase();
        if (countryLower.startsWith(q)) {
          startsWith.push({ continent, country, city: "", label: country });
        } else if (countryLower.includes(q)) {
          contains.push({ continent, country, city: "", label: country });
        }

        for (const city of citiesSet) {
          if (isExcluded(city)) continue;
          const cityLower = city.toLowerCase();
          const displayCity = `${city}, ${country}`;
          if (cityLower.startsWith(q)) {
            startsWith.push({ continent, country, city, label: displayCity });
          } else if (cityLower.includes(q) && !countryLower.startsWith(q)) {
            contains.push({ continent, country, city, label: displayCity });
          }
        }
      }
    }

    return [...startsWith, ...contains].slice(0, 40);
  }, [locationTree, searchQuery]);

  const getDisplayText = () => {
    if (continentFilter === "Remote") return "Remote";
    if (cityFilter && countryFilter) return `${cityFilter}, ${countryFilter}`;
    if (countryFilter) return countryFilter;
    if (continentFilter) return continentFilter;
    return "Location";
  };

  return (
    <DropdownMenu.Root onOpenChange={(open) => {
      if (open) {
        setSearchQuery("");
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }}>
      <DropdownMenu.Trigger asChild>
        <button className={cn("flex items-center w-full sm:w-auto min-w-0 sm:min-w-[120px] sm:max-w-[180px] xl:max-w-[210px] h-[38px] bg-[#faf9f7] border border-[#efefef] rounded-full text-sm font-medium px-4 focus:outline-none focus:ring-2 focus:ring-[#0068f9] shadow-2xs hover:bg-[#f3f2ef] transition-all cursor-pointer", className)}>
          <MapPin className="text-[#a5a5a5] mr-2 shrink-0" size={15} />
          <span className="text-[#121722] truncate flex-1 text-left">{getDisplayText()}</span>
          <div className="text-[#a5a5a5] shrink-0 ml-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </button>
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          className="z-[100] min-w-[230px] max-w-[290px] overflow-hidden bg-white rounded-2xl border border-[#efefef] shadow-xl p-1 animate-in fade-in-80 zoom-in-95 flex flex-col"
          style={{ maxHeight: '33.33vh' }}
          sideOffset={8}
        >
          {/* Quick Search Header */}
          <div className="p-1.5 border-b border-[#f1f3f5] bg-white shrink-0">
            <div className="relative flex items-center">
              <Search size={12} className="absolute left-2 text-[#a5a5a5] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or city..."
                className="w-full pl-6 pr-6 py-1 text-xs bg-[#faf9f7] border border-[#efefef] rounded-xl focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none text-[#121722] placeholder:text-[#a5a5a5]"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery("");
                  }
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1.5 p-0.5 text-[#a5a5a5] hover:text-[#121722] rounded-full cursor-pointer"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list with 1/3 viewport height guardrail */}
          <div className="flex-1 overflow-y-auto p-0.5 space-y-0.5 custom-scrollbar">
            {searchQuery.trim() ? (
              searchResults.length === 0 ? (
                <div className="py-3 text-center text-xs text-[#a5a5a5]">
                  No matching locations
                </div>
              ) : (
                searchResults.map((item, idx) => (
                  <DropdownMenu.Item
                    key={`${item.country}-${item.city}-${idx}`}
                    className="flex items-center justify-between px-3 py-1.5 text-xs text-[#121722] rounded-xl cursor-pointer hover:bg-[#faf9f7] outline-none select-none transition-colors"
                    onClick={() => {
                      onSelectContinent(item.continent);
                      onSelectCountry(item.country);
                      onSelectCity(item.city);
                      setSearchQuery("");
                    }}
                  >
                    <span className="truncate pr-2 font-medium">{item.label}</span>
                    {((item.city && countryFilter === item.country && cityFilter === item.city) ||
                      (!item.city && countryFilter === item.country && !cityFilter)) && (
                      <Check size={13} className="text-[#0068f9] shrink-0" />
                    )}
                  </DropdownMenu.Item>
                ))
              )
            ) : (
              <>
                <DropdownMenu.Item 
                  className="flex items-center px-3 py-1.5 text-xs text-[#121722] rounded-xl cursor-pointer hover:bg-[#faf9f7] outline-none select-none font-medium"
                  onClick={() => {
                    onSelectContinent("");
                    onSelectCountry("");
                    onSelectCity("");
                  }}
                >
                  Location
                  {!continentFilter && <Check size={14} className="ml-auto text-[#0068f9]" />}
                </DropdownMenu.Item>

                <DropdownMenu.Item 
                  className="flex items-center px-3 py-1.5 text-xs text-[#121722] rounded-xl cursor-pointer hover:bg-[#faf9f7] outline-none select-none font-medium"
                  onClick={() => {
                    onSelectContinent("Remote");
                    onSelectCountry("");
                    onSelectCity("");
                  }}
                >
                  Remote
                  {continentFilter === "Remote" && <Check size={14} className="ml-auto text-[#0068f9]" />}
                </DropdownMenu.Item>
                
                <DropdownMenu.Separator className="h-px bg-[#efefef] my-1 mx-2" />

                {continents.map((continent) => {
                  const countriesMap = locationTree.get(continent) || new Map<string, Set<string>>();
                  const countries = Array.from(countriesMap.keys())
                    .filter(country => !isExcluded(country))
                    .sort();
                  
                  if (countries.length === 0) {
                    return (
                      <DropdownMenu.Item 
                        key={continent}
                        className="flex items-center px-3 py-1.5 text-xs text-[#121722] rounded-xl cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
                        onClick={() => {
                          onSelectContinent(continent);
                          onSelectCountry("");
                          onSelectCity("");
                        }}
                      >
                        {continent}
                        {continentFilter === continent && !countryFilter && <Check size={14} className="ml-auto text-[#0068f9]" />}
                      </DropdownMenu.Item>
                    );
                  }

                  return (
                    <DropdownMenu.Sub key={continent}>
                      <DropdownMenu.SubTrigger className="flex items-center px-3 py-1.5 text-xs text-[#121722] rounded-xl cursor-pointer hover:bg-[#faf9f7] outline-none select-none data-[state=open]:bg-[#faf9f7]">
                        <span>{continent}</span>
                        {continentFilter === continent && !countryFilter && <Check size={14} className="ml-auto text-[#0068f9] mr-1.5" />}
                        <ChevronRight size={13} className="ml-auto text-[#a5a5a5]" />
                      </DropdownMenu.SubTrigger>
                      
                      <DropdownMenu.Portal>
                        <DropdownMenu.SubContent 
                          className="z-[100] min-w-[200px] overflow-y-auto bg-white rounded-2xl border border-[#efefef] shadow-xl p-1 animate-in fade-in-80 zoom-in-95 custom-scrollbar"
                          style={{ maxHeight: '33.33vh' }}
                          sideOffset={4}
                        >
                          <DropdownMenu.Item 
                            className="flex items-center px-3 py-1.5 text-xs text-[#121722] rounded-xl cursor-pointer hover:bg-[#faf9f7] outline-none select-none font-medium"
                            onClick={() => {
                              onSelectContinent(continent);
                              onSelectCountry("");
                              onSelectCity("");
                            }}
                          >
                            All {continent}
                            {continentFilter === continent && !countryFilter && <Check size={14} className="ml-auto text-[#0068f9]" />}
                          </DropdownMenu.Item>
                          
                          <DropdownMenu.Separator className="h-px bg-[#efefef] my-1 mx-2" />
                          
                          {countries.map(country => {
                            const cities = Array.from(countriesMap.get(country) || [])
                              .filter(city => !isExcluded(city))
                              .sort();
                            
                            if (cities.length === 0) {
                              return (
                                <DropdownMenu.Item 
                                  key={country}
                                  className="flex items-center px-3 py-1.5 text-xs text-[#121722] rounded-xl cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
                                  onClick={() => {
                                    onSelectContinent(continent);
                                    onSelectCountry(country);
                                    onSelectCity("");
                                  }}
                                >
                                  {country}
                                  {countryFilter === country && !cityFilter && <Check size={14} className="ml-auto text-[#0068f9]" />}
                                </DropdownMenu.Item>
                              );
                            }

                            return (
                              <DropdownMenu.Sub key={country}>
                                <DropdownMenu.SubTrigger className="flex items-center px-3 py-1.5 text-xs text-[#121722] rounded-xl cursor-pointer hover:bg-[#faf9f7] outline-none select-none data-[state=open]:bg-[#faf9f7]">
                                  <span>{country}</span>
                                  {countryFilter === country && !cityFilter && <Check size={14} className="ml-auto text-[#0068f9] mr-1.5" />}
                                  <ChevronRight size={13} className="ml-auto text-[#a5a5a5]" />
                                </DropdownMenu.SubTrigger>
                                <DropdownMenu.Portal>
                                  <DropdownMenu.SubContent 
                                    className="z-[100] min-w-[200px] overflow-y-auto bg-white rounded-2xl border border-[#efefef] shadow-xl p-1 animate-in fade-in-80 zoom-in-95 custom-scrollbar"
                                    style={{ maxHeight: '33.33vh' }}
                                    sideOffset={4}
                                  >
                                    <DropdownMenu.Item 
                                      className="flex items-center px-3 py-1.5 text-xs text-[#121722] rounded-xl cursor-pointer hover:bg-[#faf9f7] outline-none select-none font-medium"
                                      onClick={() => {
                                        onSelectContinent(continent);
                                        onSelectCountry(country);
                                        onSelectCity("");
                                      }}
                                    >
                                      All {country}
                                      {countryFilter === country && !cityFilter && <Check size={14} className="ml-auto text-[#0068f9]" />}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator className="h-px bg-[#efefef] my-1 mx-2" />
                                    {cities.map(city => (
                                      <DropdownMenu.Item 
                                        key={city}
                                        className="flex items-center px-3 py-1.5 text-xs text-[#121722] rounded-xl cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
                                        onClick={() => {
                                          onSelectContinent(continent);
                                          onSelectCountry(country);
                                          onSelectCity(city);
                                        }}
                                      >
                                        {city}
                                        {countryFilter === country && cityFilter === city && <Check size={14} className="ml-auto text-[#0068f9]" />}
                                      </DropdownMenu.Item>
                                    ))}
                                  </DropdownMenu.SubContent>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Sub>
                            );
                          })}
                        </DropdownMenu.SubContent>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Sub>
                  );
                })}
              </>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
