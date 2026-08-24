const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

code = code.replace(
  /export function GlobalMarket\(\{ isDemo = false, onAddToWishlist \}: GlobalMarketProps\) \{/,
  `export function GlobalMarket({ isDemo = false, onAddToWishlist, trackingSystem = 'industry' }: GlobalMarketProps) {`
);

code = code.replace(
  /interface GlobalMarketProps \{/,
  `interface GlobalMarketProps {\n  trackingSystem?: 'industry' | 'academic';`
);

fs.writeFileSync('src/components/GlobalMarket.tsx', code);
