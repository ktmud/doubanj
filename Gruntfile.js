module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      src: 'static',
      dest: 'static/dist',
      oz: {
        baseUrl: 'static/js/',
        distUrl: 'static/dist/js/'
      },
      banner: '/*! 豆瓣酱 - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= pkg.license %> */'
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>',
      },
      //static_mappings: {
      //},
      deps: {
        options: {
          banner: '',
        },
        files: [
          {
            expand: true,
            cwd: 'static/dist/deps/',
            src: ['**/?*.js'],
            dest: 'static/dist/deps/'
          }
        ]
      },
      dynamic_mappings: {
        files: [
          {
            expand: true,
            cwd: 'static/dist/js/',
            src: ['**/?*.js'],
            dest: 'static/dist/js/'
          }
        ]
      }
    },
    //istatic: {
    //main: {
    //repos: {
    //'twitter/bootstrap': {
    //commit: '3.0.0-wip',
    //file: {
    //'./docs/assets/js/bootstrap.js': 'static/dist/bootstrap.js',
    //'./docs/assets/css/bootstrap.css': 'static/dist/bootstrap.css',
    //'./docs/assets/fonts': 'static/dist/fonts'
    //}
    //}
    //}
    //}
    //},
    concat: {
      dep_css: {
        files: [
          {
            src: [
              'static/components/bootstrap/docs/assets/css/bootstrap.css',
            ],
            dest: 'static/dist/deps/bootstrap.css',
          },
        ],
      },
    },
    copy: {
      deps: {
        files: [
          {
            expand: true,
            src: [
              '**',
            ],
            cwd: 'static/components/bootstrap/docs/assets/fonts/',
            dest: 'static/dist/fonts/',
          }
        ]
      },
      js: {
        files: [
          {
            expand: true,
            cwd: 'static/js/',
            src: ['**/?*.js'],
            dest: 'static/dist/js/'
          }
        ]
      }
    },
    includes: {
      options: {
        regex: /^(\/\/|\/\*)?\s*[\@\#]*(include|import)\s+[\"\'\(]*([^\"\'\)]+)[\"\'\)]*\s*(\*\/)?$/,
        pos: 3
      },
      js: {
        cwd: 'static/js/',
        src: '**/*.js',
        dest: 'static/dist/js/'
      }
    },
    stylus: {
      compile: {
        options: {
          paths: ['static/css'],
          urlfunc: 'embedurl',
          import: [
            'base/feel',
          ],
        },
        files: [
          {
            expand: true,
            cwd: 'static/css/',
            src: ['base.styl'],
            dest: 'static/dist/css/',
            ext: '.css'
          }
        ]
      }
    },
    cssmin: {
      deps: {
        files: [
          {
            expand: true,
            cwd: 'static/dist/deps/',
            src: ['**/?*.css'],
            dest: 'static/dist/deps/',
          },
        ],
      },
      compress: {
        files: [
          {
            expand: true,
            cwd: 'static/dist/css/',
            src: ['**/?*.css'],
            dest: 'static/dist/css/',
          }
        ]
      },
    },
    watch: {
      js: {
        files: ['static/js/**/*.js'],
        tasks: ['includes:js', 'jshint']
      }, 
      css: {
        files: ['static/css/**/*.styl'],
        tasks: ['stylus']
      }
    },
    jshint: {
      files: ['static/dist/js/**/*!{.min}.js'],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {}
    },
    clean: {
      files: ['static/dist/js/', 'static/dist/css/', 'static/dist/deps/']
    },
  });

  // Default task.
  grunt.registerTask('dist_js', ['includes:js', 'jshint']);
  grunt.registerTask('dist_css', ['concat:dep_css', 'stylus']);

  grunt.registerTask('deps', ['concat:dep_css', 'copy:deps']);

  grunt.registerTask('default', ['clean', 'copy:deps', 'dist_js', 'dist_css']);

  grunt.registerTask('build', ['dist_js', 'dist_css', 'uglify', 'cssmin']);
  //grunt.registerTask('init', ['istatic']);

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.loadNpmTasks('grunt-includes');
  //grunt.loadNpmTasks('grunt-istatic');

  //var path = require('path');
  //grunt.registerMultiTask('includes', 'include other files', function() {
    //this.files.forEach(function(f) {
      //var src = f.src.filter(function(path) {
        //if(grunt.file.exists(path)) {
          //return true;
        //} else {
          //grunt.log.warn('Source file "' + path + '" not found.');
          //return false;
        //}
      //});

      //if (grunt.file.isFile(f.dest)) {
        //grunt.fail.warn('Destination directory "' + f.dest + '" is a file.');
      //}

      //src.forEach(function(file) {
        //var save_path = file;
        //if (f.flatten) save_path = path.basename(file);
        //grunt.file.write(path.join(f.dest, save_path), recurse(file));
        //grunt.log.oklns('Saved ' + file);
      //});

    //});
  //});

  /**
  * Helper for `includes` builds all includes for `p`
  *
  * @param {String} p
  * @return {String}
  */

  //function recurse(p) {
    //if(!grunt.file.isFile(p)) {
      //grunt.log.warn('Included file "' + p + '" not found.');
      //return 'Error including "' + p + '".';
    //}

    //var src = grunt.file.read(p).split(grunt.util.linefeed);
    //var compiled = src.map(function(line) {
      //var match = line.match(regex);

      //if(match) {
        //return recurse(path.join(path.dirname(p), match[3]));
      //}
      //return line;
    //});

    //return  compiled.join(grunt.util.linefeed);
  //}
};
