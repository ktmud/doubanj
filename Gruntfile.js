module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      src: 'static',
      dest: 'static/dist',
      oz: {
        baseUrl: '<%= meta.src =%>/js/',
        distUrl: '<%= meta.desc %>/js/'
      },
      banner: '/*! 豆瓣酱 - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= pkg.license %> */'
    },
    //ozma: {
      //main: {
        //src: 'static/js/main.js',
        //config: '<%= meta.oz %>' 
      //}
    //},
    uglify: {
      options: {
        banner: '<%= meta.banner %=>',
      },
      //static_mappings: {
      //},
      dynamic_mappings: {
        files: [
          {
            expand: true,
            cwd: '<%= meta.dest %=>/js/',
            src: ['**/?.js'],
            dest: '<%= meta.dest %=>/js/'
          }
        ]
      }
    },
    stylus: {
      compile: {
        options: {
          paths: ['static/css'],
          urlfunc: 'embedurl',
        },
        files: [
          {
            expand: true,
            cwd: '<%= meta.src %=>/css/',
            src: ['**/?.styl'],
            dest: '<%= meta.dest %=>/css/',
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
            cwd: '<%= meta.dest %=>/css/',
            src: ['**/?.css'],
            dest: '<%= meta.dest %=>/css/',
          }
        ]
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: ['lint', 'stylus']
    },
    jshint: {
      files: ['static/**/*!{.min}.js'],
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
  grunt.registerTask('dist_js', ['jshint', 'ozma', 'uglify']);
  grunt.registerTask('dist_css', ['stylus', 'mincss']);

  grunt.registerTask('default', ['dist_js', 'dist_css']);

  // build files and add it in git
  grunt.registerTask('build', function() {
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadNpmTasks('grunt-ozjs');
};
