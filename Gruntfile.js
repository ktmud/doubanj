module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      src: 'static',
      dest: 'static/dist',
      oz: {
        baseUrl: '<%= meta.src %>/js/',
        distUrl: '<%= meta.desc %>/js/'
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
      dynamic_mappings: {
        files: [
          {
            expand: true,
            cwd: '<%= meta.dest %>/js/',
            src: ['**/?*.js'],
            dest: '<%= meta.dest %>/js/'
          }
        ]
      }
    },
    copy: {
      js: {
        files: [
          {
            expand: true,
            cwd: '<%= meta.src %>/js/',
            src: ['**/?*.js'],
            dest: '<%= meta.dest %>/js/'
          }
        ]
      }
    },
    includereplace: {
      js: {
        src: '<%= meta.src %>/js/**/*.js',
        dest: '<%= meta.dest %>/js/'
      }
    },
    stylus: {
      compile: {
        options: {
          paths: ['<%= meta.src %>/css'],
          urlfunc: 'embedurl',
        },
        files: [
          {
            expand: true,
            cwd: '<%= meta.src %>/css/',
            src: ['**/?*.styl'],
            dest: '<%= meta.dest %>/css/',
            ext: '.css'
          }
        ]
      }
    },
    mincss: {
      compress: {
        files: [
          {
            expand: true,
            cwd: '<%= meta.dest %>/css/',
            src: ['**/?.css'],
            dest: '<%= meta.dest %>/css/',
          }
        ]
      }
    },
    watch: {
      js: {
        files: '<%= jshint.files %>',
        tasks: ['copy:js', 'includereplace:js', 'jslint']
      }, 
      css: {
        files: '<%= meta.src %>/css/**/*.styl',
        tasks: ['stylus']
      }
    },
    jshint: {
      files: ['static/dist/*!{.min}.js'],
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
  });

  // Default task.
  grunt.registerTask('dist_js', ['jshint', 'includereplace', 'uglify']);
  grunt.registerTask('dist_css', ['stylus', 'mincss']);

  grunt.registerTask('default', ['dist_js', 'dist_css']);

  // build files and add it in git
  grunt.registerTask('build', function() {
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-mincss');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadNpmTasks('grunt-include-replace');
};
