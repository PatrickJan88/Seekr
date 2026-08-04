const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

code = code.replace(/nodeAlign: 'justify',/, "nodeAlign: 'left',");

// Add level 4 for Offer just in case
const levelsStr = `        levels: [
          {
            depth: 0,
            itemStyle: {
              color: '#fbb4ae'
            },
            lineStyle: {
              color: 'source',
              opacity: 0.6
            }
          },
          {
            depth: 1,
            itemStyle: {
              color: '#b3cde3'
            },
            lineStyle: {
              color: 'source',
              opacity: 0.6
            }
          },
          {
            depth: 2,
            itemStyle: {
              color: '#ccebc5'
            },
            lineStyle: {
              color: 'source',
              opacity: 0.6
            }
          },
          {
            depth: 3,
            itemStyle: {
              color: '#decbe4'
            },
            lineStyle: {
              color: 'source',
              opacity: 0.6
            }
          },
          {
            depth: 4,
            itemStyle: {
              color: '#fed9a6'
            },
            lineStyle: {
              color: 'source',
              opacity: 0.6
            }
          }
        ],`;

code = code.replace(/        levels: \[\s*\{[\s\S]*?opacity: 0\.6\s*\}\s*\}\s*\],/, levelsStr);

fs.writeFileSync('src/components/SankeyChart.tsx', code);
