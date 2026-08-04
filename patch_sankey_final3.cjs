const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

const newSeries = `series: [
      {
        type: 'sankey',
        top: '5%',
        bottom: '5%',
        left: '5%',
        right: '15%',
        nodeAlign: 'justify',
        data: nodes,
        links: links,
        emphasis: {
          focus: 'adjacency'
        },
        levels: [
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
          }
        ],
        lineStyle: {
          curveness: 0.5
        },
        label: {
          color: '#334155',
          fontSize: 13,
          fontWeight: 'bold',
          formatter: '{b} ({c})'
        }
      }
    ]`;

code = code.replace(/series: \[\s*\{\s*type: 'sankey',[\s\S]*?\}\s*\]/m, newSeries);

fs.writeFileSync('src/components/SankeyChart.tsx', code);
