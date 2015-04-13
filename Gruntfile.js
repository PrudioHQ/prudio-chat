module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! JS <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src:  ['bower_components/emoji-parser/main.min.js', 'src/js/chat-client.js'],
                dest: 'build/<%= pkg.exportName %>.js'
            }
        },
        cssmin: {
            addBanner: {
                options: {
                    banner: '/*! CSS <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                files: {
                    'build/<%= pkg.exportName %>.css': ['src/css/*.css']
                }
            }
        },
        replace: {
            local: {
                src: ['build/<%= pkg.exportName %>.js'],      // source files array (supports minimatch)
                dest: 'build/<%= pkg.exportName %>.local.js', // destination directory or file
                replacements: [{
                    from: 'https://chat.prud.io', // string replacement
                    to:   'http://localhost:5000'                // your server url with port (80 or 443)
                },
                {
                    from: '/chat\\\.prud\\\.io\\/client/', //
                    to:   '/client\\\.local/'
                }]
            },
            development: {
                src: ['src/js/chat-client.js'], // source files array (supports minimatch)
                dest: 'build/<%= pkg.exportName %>.development.js', // destination directory or file
                replacements: [{
                    from: 'chat.prud.io', // string replacement
                    to:   'prudio-chat-dev.herokuapp.com', // string replacement
                },
                {
                    from: '/chat\\\.prud\\\.io\\/client/', //
                    to:   '/prudio-chat-dev\\\.herokuapp\\\.com\\/client/', //
                }]
            }
        },
        concat: {
            options: {
                separator: '\n//CONCAT\n',
            },
            dist: {
                src: ['bower_components/emoji-parser/main.js', 'build/<%= pkg.exportName %>.development.js'],
                dest: 'build/<%= pkg.exportName %>.development.js',
            },
        },
        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: ['src/sound/*', 'src/img/*'],
                        dest: 'build/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['src/font/*'],
                        dest: 'build/font/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['bower_components/emoji-parser/emoji/*'],
                        dest: 'build/emojis/',
                        filter: 'isFile'
                    }
                ]
            }
        },
        watch: {
            scripts: {
                files: ['src/**/*.js', 'src/**/*.css'],
                tasks: ['uglify', 'replace', 'cssmin']
            }
        },
        keycdn: {
            purgeZone: {
                options: {
                    apiKey: process.env.KEYCDN_API_KEY || 'wrong_api',
                    zoneId: process.env.KEYCDN_ZONE_ID || '0',
                    method: 'get'
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-foreman');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-keycdn');
    grunt.loadNpmTasks('grunt-heroku-env');

    // Default task(s).
    grunt.registerTask('build', ['heroku-env', 'keycdn', 'uglify', 'replace', 'cssmin', 'concat', 'copy']);
    grunt.registerTask('server', ['foreman', 'watch']);
    grunt.registerTask('default', ['build', 'server']);

};
