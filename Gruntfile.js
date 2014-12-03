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
        src: ['build/<%= pkg.exportName %>.js'],      // source files array (supports minimatch)
        dest: 'build/<%= pkg.exportName %>.local.js', // destination directory or file
        replacements: [{
          from: 'https://prudio-chat.herokuapp.com:443', // string replacement
          to: 'http://localhost:5000'                // your server url with port (80 or 443)
        },{
          from: '/chat\\\.prud\\\.io\\/client/', //
          to: '/client\\\.local/'
        }]
      }
    },
    copy: {
      main: {
        files: [
          { expand: true, flatten: true, src: ['src/sound/*', 'src/img/*'], dest: 'build/', filter: 'isFile' },
          { expand: true, flatten: true, src: ['src/font/*'], dest: 'build/font/', filter: 'isFile' }
        ]
      }
    },
    express: {
      development: {
        options: {
          script: './app.js',
          hostname: '0.0.0.0',
          port: 5000
        }
      }
    },
    watch: {
      scripts: {
        files:  [ 'src/**/*.js', 'src/**/*.css' ],
        tasks:  [ 'uglify', 'replace', 'cssmin' ]
      }
    }

  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-text-replace');


  // Default task(s).
  grunt.registerTask('build', ['uglify', 'replace', 'cssmin', 'copy']);
  grunt.registerTask('server', [ 'express:development', 'watch' ]);
  grunt.registerTask('default', ['build', 'server']);

};