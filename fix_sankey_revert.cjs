const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');

const newOptionBlock = `  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    series: [
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
        itemStyle: {
          borderWidth: 0,
          borderColor: '#aaa'
        },
        lineStyle: {
          color: 'source',
          curveness: 0.5,
          opacity: 0.3
        },
        label: {
          color: '#334155',
          fontSize: 13,
          fontWeight: 'bold',
          formatter: '{b} ({c})'
        }
      }
    ]
  };`;

// Replace from "const option =" to "  };"
code = code.replace(/  const option = \{[\s\S]*?  \};\n/m, newOptionBlock + '\n');

fs.writeFileSync('src/components/SankeyChart.tsx', code);
