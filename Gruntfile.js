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
      ' Licensed <%= pkg.license %> */\n'
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
            cwd: 'static/dist/js/',
            src: ['**/*.js', '!**/*_*.js'],
            dest: 'tmp/static/js/'
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
    //copy: {
      //deps: {
        //files: [
          //{
            //expand: true,
            //src: [
              //'**',
            //],
            //cwd: 'static/components/bootstrap/docs/assets/fonts/',
            //dest: 'static/dist/fonts/',
          //}
        //]
      //},
    //},
    includes: {
      options: {
        regex: /^\s*(\/\/|\/\*)?\s*[\@\#]*(include|import)\s+[\"\'\(]*([^\"\'\)]+)[\"\'\)]*\s*(\*\/)?$/,
        nodup: true,
        pos: 3
      },
      js: {
        cwd: 'static/js/',
        src: '**/*.js',
        dest: 'static/dist/js/'
      },
      css: {
        cwd: 'static/css/',
        src: '**/*.css',
        dest: 'static/dist/css/'
      }
    },
    wrapper: {
      options: {
        // wrap indicator
        wrap: 'module.exports =',
      },
      js: {
        cwd: 'static/dist/js/',
        src: ['**/*.js', '!**/*_*.js'],
        dest: 'static/dist/js/'
      },
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
      compress: {
        files: [
          {
            expand: true,
            cwd: 'static/dist/css/',
            src: ['**/*.css', '!**/*_*.css'],
            dest: 'tmp/static/css/',
          }
        ]
      },
    },
    hashmap: {
      options: {
        output: 'static/hash.json',
        merge: true,
      },
      js: {
        cwd: 'tmp/static/',
        src: ['js/**/*.js'],
        dest: 'static/dist/',
      },
      css: {
        cwd: 'tmp/static/',
        src: ['css/**/*.css'],
        dest: 'static/dist/',
      }
    },
    watch: {
      js: {
        files: ['static/js/**/*.js'],
        tasks: ['dist_js']
      }, 
      css: {
        files: ['static/css/**/*.styl'],
        tasks: ['dist_css']
      }
    },
    clean: {
      tmp: {
        src: ['tmp/static/js', 'tmp/static/css']
      },
      hash: {
        src: ['static/hash.json']
      },
      js: {
        src: ['static/dist/js/']
      },
      css: {
        src: ['static/dist/css/']
      }
    },
  });

  // Default task.
  grunt.registerTask('dist_js', ['includes:js', 'wrapper:js']);
  grunt.registerTask('dist_css', ['includes:css', 'stylus']);

  //grunt.registerTask('deps', ['copy:deps']);

  grunt.registerTask('default', ['clean', 'dist_js', 'dist_css']);

  grunt.registerTask('build', ['clean:tmp', 'dist_js', 'dist_css', 'uglify', 'cssmin', 'clean:hash', 'hashmap']);

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.loadNpmTasks('grunt-hashmap');

  grunt.loadNpmTasks('grunt-includes-ktmud');
  //grunt.loadNpmTasks('grunt-istatic');

  var path = require('path');

  grunt.registerMultiTask('wrapper', 'Wrap things up.', function() {
    var opts = this.options({
      head: 'require.register("<%= path %>", function(exports, require, module) {\n',
      nowrap: /(\@\@nowrap|require\.register)/,
      wrap: null,
      tail: '\n}); require.alias("<%= path %>", "<%= filename %>");'
    });

    this.files.forEach(function(f) {
      var cwd = f.cwd;
      var src = f.src.filter(function(p) {
        p = cwd ? path.join(cwd, p) : p;
        if (grunt.file.exists(p)) {
          return true;
        } else {
          grunt.log.warn('Source file "' + p + '" not found.');
          return false;
        }
      });

      var isfile = grunt.file.isFile(f.dest);

      var flatten = f.flatten;

      src.forEach(function(p) {
        var save_name = flatten ? path.basename(p) : p;
        var dest_file = isfile ? f.dest : path.join(f.dest, save_name);

        p = cwd ? path.join(cwd, p) : p;

        var data = { path: save_name, fullpath: p, filename: path.basename(p) };
        grunt.file.write(dest_file, wrap(p, opts, data));
        //grunt.log.oklns('Saved ' + dest_file);
      });

      grunt.log.oklns('All done.');
    });

    function wrap(p, opts, data) {
      if (!grunt.file.isFile(p)) {
        grunt.log.warn('file "' + p + '" not found.');
        return 'Error wrapping "' + p + '".';
      }

      var contents = grunt.file.read(p);

      if (opts.wrap && contents.search(opts.wrap) == -1) {
        grunt.log.writeln('Wont\'t wrap "' + p + '"');
        return contents;
      }
      if (contents.search(opts.nowrap) !== -1) return contents;

      var tmpl_opt = { data: data };
      var head = grunt.template.process(opts.head, tmpl_opt);
      var tail = grunt.template.process(opts.tail, tmpl_opt);

      return head + contents + tail;

      //contents = contents.split(grunt.util.linefeed);
      //if (contents[0].indexOf(opts.nowrap) !== -1) {
        //contents = contents.slice(1);
      //} else {
        //contens.unshift(head);
        //contents.push(tail);
      //}
      //return contents.join(grunt.util.linefeed);
    }
  });

};
