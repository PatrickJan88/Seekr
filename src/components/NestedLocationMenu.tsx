import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MapPin, ChevronRight, Check } from "lucide-react";

interface NestedLocationMenuProps {
  locationTree: Map<string, Map<string, Set<string>>>;
  continentFilter: string;
  countryFilter: string;
  cityFilter: string;
  onSelectContinent: (continent: string) => void;
  onSelectCountry: (country: string) => void;
  onSelectCity: (city: string) => void;
}

export function NestedLocationMenu({
  locationTree,
  continentFilter,
  countryFilter,
  cityFilter,
  onSelectContinent,
  onSelectCountry,
  onSelectCity,
}: NestedLocationMenuProps) {
  const continents = Array.from(locationTree.keys()).sort();

  const getDisplayText = () => {
    if (cityFilter && countryFilter) return `${cityFilter}, ${countryFilter}`;
    if (countryFilter) return countryFilter;
    if (continentFilter) return continentFilter;
    return "All Locations";
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center w-full sm:w-56 h-11 bg-white border border-[#efefef] rounded-full text-sm px-4 focus:outline-none focus:ring-2 focus:ring-[#0068f9] shadow-2xs hover:bg-[#faf9f7] transition-all cursor-pointer">
          <MapPin className="text-[#a5a5a5] mr-2 shrink-0" size={16} />
          <span className="text-[#121722] truncate flex-1 text-left">{getDisplayText()}</span>
          <div className="text-[#a5a5a5] shrink-0 ml-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </button>
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          className="z-[100] min-w-[220px] max-h-[50vh] overflow-y-auto bg-white rounded-xl border border-[#efefef] shadow-lg p-1 animate-in fade-in-80 zoom-in-95"
          sideOffset={8}
        >
          <DropdownMenu.Item 
            className="flex items-center px-3 py-2 text-sm text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
            onClick={() => {
              onSelectContinent("");
              onSelectCountry("");
              onSelectCity("");
            }}
          >
            All Locations
            {!continentFilter && <Check size={16} className="ml-auto text-[#0068f9]" />}
          </DropdownMenu.Item>
          
          <DropdownMenu.Separator className="h-px bg-[#efefef] my-1 mx-2" />

          {continents.map((continent) => {
            const countriesMap = locationTree.get(continent) || new Map<string, Set<string>>();
            const countries = Array.from(countriesMap.keys()).sort();
            
            if (countries.length === 0) {
              return (
                <DropdownMenu.Item 
                  key={continent}
                  className="flex items-center px-3 py-2 text-sm text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
                  onClick={() => {
                    onSelectContinent(continent);
                    onSelectCountry("");
                    onSelectCity("");
                  }}
                >
                  {continent}
                  {continentFilter === continent && !countryFilter && <Check size={16} className="ml-auto text-[#0068f9]" />}
                </DropdownMenu.Item>
              );
            }

            return (
              <DropdownMenu.Sub key={continent}>
                <DropdownMenu.SubTrigger className="flex items-center px-3 py-2 text-sm text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none data-[state=open]:bg-[#faf9f7]">
                  {continent}
                  {continentFilter === continent && !countryFilter && <Check size={16} className="ml-auto text-[#0068f9] mr-2" />}
                  <ChevronRight size={16} className="ml-auto text-[#a5a5a5]" />
                </DropdownMenu.SubTrigger>
                
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent 
                    className="z-[100] min-w-[200px] max-h-[50vh] overflow-y-auto bg-white rounded-xl border border-[#efefef] shadow-lg p-1 animate-in fade-in-80 zoom-in-95"
                    sideOffset={4}
                  >
                    <DropdownMenu.Item 
                      className="flex items-center px-3 py-2 text-sm text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
                      onClick={() => {
                        onSelectContinent(continent);
                        onSelectCountry("");
                        onSelectCity("");
                      }}
                    >
                      All {continent}
                      {continentFilter === continent && !countryFilter && <Check size={16} className="ml-auto text-[#0068f9]" />}
                    </DropdownMenu.Item>
                    
                    <DropdownMenu.Separator className="h-px bg-[#efefef] my-1 mx-2" />
                    
                    {countries.map(country => {
                      const cities = Array.from(countriesMap.get(country) || []).sort();
                      
                      if (cities.length === 0) {
                        return (
                          <DropdownMenu.Item 
                            key={country}
                            className="flex items-center px-3 py-2 text-sm text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
                            onClick={() => {
                              onSelectContinent(continent);
                              onSelectCountry(country);
                              onSelectCity("");
                            }}
                          >
                            {country}
                            {countryFilter === country && !cityFilter && <Check size={16} className="ml-auto text-[#0068f9]" />}
                          </DropdownMenu.Item>
                        );
                      }

                      return (
                        <DropdownMenu.Sub key={country}>
                          <DropdownMenu.SubTrigger className="flex items-center px-3 py-2 text-sm text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none data-[state=open]:bg-[#faf9f7]">
                            {country}
                            {countryFilter === country && !cityFilter && <Check size={16} className="ml-auto text-[#0068f9] mr-2" />}
                            <ChevronRight size={16} className="ml-auto text-[#a5a5a5]" />
                          </DropdownMenu.SubTrigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.SubContent 
                              className="z-[100] min-w-[200px] max-h-[50vh] overflow-y-auto bg-white rounded-xl border border-[#efefef] shadow-lg p-1 animate-in fade-in-80 zoom-in-95"
                              sideOffset={4}
                            >
                              <DropdownMenu.Item 
                                className="flex items-center px-3 py-2 text-sm text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
                                onClick={() => {
                                  onSelectContinent(continent);
                                  onSelectCountry(country);
                                  onSelectCity("");
                                }}
                              >
                                All {country}
                                {countryFilter === country && !cityFilter && <Check size={16} className="ml-auto text-[#0068f9]" />}
                              </DropdownMenu.Item>
                              <DropdownMenu.Separator className="h-px bg-[#efefef] my-1 mx-2" />
                              {cities.map(city => (
                                <DropdownMenu.Item 
                                  key={city}
                                  className="flex items-center px-3 py-2 text-sm text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
                                  onClick={() => {
                                    onSelectContinent(continent);
                                    onSelectCountry(country);
                                    onSelectCity(city);
                                  }}
                                >
                                  {city}
                                  {countryFilter === country && cityFilter === city && <Check size={16} className="ml-auto text-[#0068f9]" />}
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
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
