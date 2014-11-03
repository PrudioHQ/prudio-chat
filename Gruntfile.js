module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! JS <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src:  'src/js/chat-client.js',
        dest: 'build/<%= pkg.exportName %>.js'
      }
    },
    cssmin: {
      add_banner: {
        options: {
        banner: '/*! CSS <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {
          'build/<%= pkg.exportName %>.css': ['src/css/*.css']
        }
      }
    },
    replace: {
      example: {
        src: ['build/<%= pkg.exportName %>.js'],             // source files array (supports minimatch)
        dest: 'build/<%= pkg.exportName %>.local.js',             // destination directory or file
        replacements: [{
          from: 'http://chat.prud.io:80',                   // string replacement
          to: 'http://localhost:8888'
        },{
          /// /chat\.prud\.io\/client/
          from: '/chat\\\.prud\\\.io\\/client/',
          to: '/client\\\.local/'
        }]
      }
    },
    express: {
        development: {
            options: {
                script: './app.js',
                hostname: '0.0.0.0'
            }
        }
    },
    watch: {
        scripts: {
            files:  [ ],
            tasks:  [ 'watch' ],
            options: {
                spawn: false, // Without this option specified express won't be reloaded
                livereload: true
            }
        }
    }

  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-text-replace');


  // Default task(s).
  grunt.registerTask('default', ['uglify', 'replace', 'cssmin']);

  grunt.registerTask('server', [ 'express:development', 'watch' ]);

};