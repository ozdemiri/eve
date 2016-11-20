module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
        my_target : {
            options : {
                sourceMap : true,
                sourceMapName : 'dist/sourceMap.map',
                mangle: true
            },
            files : {
                'dist/eve.min.js' : [
                    'customlib/d3.layout.cloud.min.js',
                    'customlib/d3.sankey.min.js',
                    'src/eve.js',
                    'src/eve.data.js',
                    'src/eve.base.js',
                    'src/eve.axis.js',
                    'src/eve.legend.js',
                    'src/eve.tooltip.js',
                    'src/charts/eve.area.js',
                    'src/charts/eve.bar.js',
                    'src/charts/eve.bubble.js',
                    'src/charts/eve.column.js',
                    'src/charts/eve.donut.js',
                    'src/charts/eve.funnel.js',
                    'src/charts/eve.line.js',
                    'src/charts/eve.pie.js',
                    'src/charts/eve.pyramid.js',
                    'src/charts/eve.scatter.js',
                    'src/charts/eve.radar.js',
                    'src/maps/eve.standardmap.js',
                    'src/diagrams/eve.abacus.js',
                    'src/diagrams/eve.bullet.js',
                    'src/diagrams/eve.bump.js',
                    'src/diagrams/eve.calendarmap.js',
                    'src/diagrams/eve.chord.js',
                    'src/diagrams/eve.circleclusters.js',
                    'src/diagrams/eve.circlepacking.js',
                    'src/diagrams/eve.cooccurence.js',
                    'src/diagrams/eve.dendrogram.js',
                    'src/diagrams/eve.force.js',
                    'src/diagrams/eve.bubbleforce.js',
                    'src/diagrams/eve.networkforce.js',
                    'src/diagrams/eve.gantt.js',
                    'src/diagrams/eve.gauge.js',
                    'src/diagrams/eve.heatmap.js',
                    'src/diagrams/eve.multiples.js',
                    'src/diagrams/eve.networkmatrix.js',
                    'src/diagrams/eve.parallellines.js',
                    'src/diagrams/eve.sankey.js',
                    'src/diagrams/eve.streamgraph.js',
                    'src/diagrams/eve.sunburst.js',
                    'src/diagrams/eve.timeline.js',
                    'src/diagrams/eve.treemap.js',
                    'src/diagrams/eve.wordcloud.js'
                ]
            }
        }
    }
    /*,
    jshint: {
      files: ['gruntfile.js', 'src/*.js', 'test/*.js']
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }*/
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  //grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['uglify']);

};
