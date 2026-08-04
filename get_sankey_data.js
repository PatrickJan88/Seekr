const echarts = require('echarts/lib/echarts');
require('echarts/lib/chart/sankey');

const chart = echarts.init(null, null, { width: 800, height: 600 });
chart.setOption({
    series: {
        type: 'sankey',
        layoutIterations: 0,
        data: [
            { name: 'Total Applications' },
            { name: 'In Review', value: 52 },
            { name: 'Ghosted', value: 32 },
            { name: 'Rejected', value: 59 }
        ],
        links: [
            { source: 'Total Applications', target: 'In Review', value: 52 },
            { source: 'Total Applications', target: 'Ghosted', value: 32 },
            { source: 'Total Applications', target: 'Rejected', value: 59 }
        ]
    }
});
console.log("Success");
