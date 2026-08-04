const echarts = require('echarts');
const chart = echarts.init(null, null, { width: 800, height: 600 });
chart.setOption({
    series: {
        type: 'sankey',
        nodeAlign: 'justify',
        data: [
            { name: 'Total Applications' },
            { name: 'Rejected', value: 59 },
            { name: 'In Review', value: 52 },
            { name: 'Ghosted', value: 32 }
        ],
        links: [
            { source: 'Total Applications', target: 'Rejected', value: 59 },
            { source: 'Total Applications', target: 'In Review', value: 52 },
            { source: 'Total Applications', target: 'Ghosted', value: 32 }
        ]
    }
});
const graph = chart.getModel().getSeriesByIndex(0).getGraph();
graph.eachNode(function (node) {
    console.log(node.id, node.getLayout());
});
