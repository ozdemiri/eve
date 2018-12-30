const fs = require('fs');
const path = require('path');
const UglifyJS = require("uglify-es");
const uglifyOptions = {
    sourceMap: {
        filename: "eve.min.js",
        url: "eve.min.js.map"
    },
    compress: {
        dead_code: false
    },
    output: {
        ascii_only: true
    }
    };
const files = [
        'customlib/d3.layout.cloud.min.js',
        'customlib/d3.sankey.min.js',
        'customlib/ResizeSensor.js',
        'src/eve.js',
        'src/eve.data.js',
        'src/eve.base.js',
        'src/eve.axis.js',
        'src/eve.legend.js',
        'src/eve.tooltip.js',
        'src/charts/eve.xy.js',
        'src/charts/eve.sliced.js',
        'src/diagrams/eve.bubbleforce.js',
        'src/diagrams/eve.bullet.js',
        'src/diagrams/eve.bump.js',
        'src/diagrams/eve.calendarmap.js',
        'src/diagrams/eve.chord.js',
        'src/diagrams/eve.circleclusters.js',
        'src/diagrams/eve.circlepacking.js',
        'src/diagrams/eve.cooccurence.js',
        'src/diagrams/eve.dendrogram.js',
        'src/diagrams/eve.force.js',
        'src/diagrams/eve.gantt.js',
        'src/diagrams/eve.gauge.js',
        'src/diagrams/eve.heatmap.js',
        'src/diagrams/eve.matrix.js',
        'src/diagrams/eve.mirroredbars.js',
        'src/diagrams/eve.multiples.js',
        'src/diagrams/eve.network.js',
        'src/diagrams/eve.parallellines.js',
        'src/diagrams/eve.sankey.js',
        'src/diagrams/eve.seat.js',
        'src/diagrams/eve.slopegraph.js',
        'src/diagrams/eve.sunburst.js',
        'src/diagrams/eve.timeline.js',
        'src/diagrams/eve.treemap.js',
        'src/diagrams/eve.wordcloud.js',
        'src/maps/eve.vectortileconverter.js',
        'src/maps/eve.contcartogram.js',
        'src/maps/eve.ddcartogram.js',
        'src/maps/eve.densitymap.js',
        'src/maps/eve.locationmap.js',
        'src/maps/eve.routemap.js',
        'src/maps/eve.standardmap.js',
        'src/maps/eve.tilemap.js',
        'src/tabular/eve.grid.js',
];

let code = {};
let concatOutputFile = path.join(__dirname, 'dist/eve.min.js');
for (let o = 0, len = files.length; o < len; o++) {
    let file = path.join(__dirname, files[o]);

    code[files[o]] = fs.readFileSync(file).toString().replace(/^\uFEFF/, '');
}
let output = UglifyJS.minify(code, uglifyOptions);
fs.writeFileSync(concatOutputFile, output.code);
fs.writeFileSync(concatOutputFile + '.map', output.map);
console.log('done');