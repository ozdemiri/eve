const fs = require('fs');
const path = require('path');
const UglifyJS = require("uglify-es");
const dir = path.join(__dirname, '../views/scriptsForViews');
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
        'src/new/eve.js',
        'src/new/eve.data.js',
        'src/new/eve.base.js',
        'src/new/eve.axis.js',
        'src/new/eve.legend.js',
        'src/new/eve.tooltip.js',
        'src/new/charts/eve.xy.js',
        'src/new/charts/eve.sliced.js',
        'src/new/diagrams/eve.bubbleforce.js',
        'src/new/diagrams/eve.bullet.js',
        'src/new/diagrams/eve.bump.js',
        'src/new/diagrams/eve.calendarmap.js',
        'src/new/diagrams/eve.chord.js',
        'src/new/diagrams/eve.circleclusters.js',
        'src/new/diagrams/eve.circlepacking.js',
        'src/new/diagrams/eve.cooccurence.js',
        'src/new/diagrams/eve.dendrogram.js',
        'src/new/diagrams/eve.force.js',
        'src/new/diagrams/eve.gantt.js',
        'src/new/diagrams/eve.gauge.js',
        'src/new/diagrams/eve.heatmap.js',
        'src/new/diagrams/eve.matrix.js',
        'src/new/diagrams/eve.mirroredbars.js',
        'src/new/diagrams/eve.multiples.js',
        'src/new/diagrams/eve.network.js',
        'src/new/diagrams/eve.parallellines.js',
        'src/new/diagrams/eve.sankey.js',
        'src/new/diagrams/eve.seat.js',
        'src/new/diagrams/eve.slopegraph.js',
        'src/new/diagrams/eve.sunburst.js',
        'src/new/diagrams/eve.timeline.js',
        'src/new/diagrams/eve.treemap.js',
        'src/new/diagrams/eve.wordcloud.js',
        'src/new/maps/eve.vectortileconverter.js',
        'src/new/maps/eve.contcartogram.js',
        'src/new/maps/eve.ddcartogram.js',
        'src/new/maps/eve.densitymap.js',
        'src/new/maps/eve.locationmap.js',
        'src/new/maps/eve.routemap.js',
        'src/new/maps/eve.standardmap.js',
        'src/new/maps/eve.tilemap.js',
        'src/new/tabular/eve.grid.js',
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