import path             from 'path';
import fs               from 'fs';
import Metalsmith       from 'metalsmith';
import deepAssign       from 'deep-assign';
import collections      from 'metalsmith-collections';
import metadata         from 'metalsmith-metadata';
import markdown         from 'metalsmith-markdown';
import layouts          from 'metalsmith-layouts';
import inPlace          from 'metalsmith-in-place';
import permalinks       from 'metalsmith-permalinks';
import pagination       from 'metalsmith-pagination';
import excerpts         from 'metalsmith-excerpts';
import sass             from 'metalsmith-sass';
import moment           from 'moment';
import define           from 'metalsmith-define';
import jekyllDates      from 'metalsmith-jekyll-dates';
import autoprefixer     from 'metalsmith-autoprefixer';
import webpack          from 'metalsmith-webpack';
import ignore           from 'metalsmith-ignore';
import metallic         from 'metalsmith-metallic';
import tags             from 'metalsmith-tags';
// TODO: ->
import snippet          from 'metalsmith-snippet';
import blc              from 'metalsmith-broken-link-checker';
import date             from 'metalsmith-build-date';
// prod
import htmlMinifier     from 'metalsmith-html-minifier';
import fingerprint      from 'metalsmith-fingerprint';
import imagemin         from 'metalsmith-imagemin';
import sitemap          from 'metalsmith-sitemap';
import firebase         from 'metalsmith-firebase';
import rss              from 'metalsmith-rss';
import drafts           from 'metalsmith-drafts';

export default function (config = {}, callback) {

  const DEFAULT_OPTIONS = {
    metadata: {
      title: 'Metalpress',
      description: 'Create a blog with Metalpress.',
      url: 'https://metalpress.io',
      production: false
    },
    filedata: {},
    sitemap: false,
    rss: false,
    ignore: [
      'data/**',
      '_data/**',
      '_drafts/*.md',
      'templates/**',
      'lib/**',
      'lib/**/.gitignore',
      'lib/**/.bower.json',
      'lib/**/.jshintrc',
      'assets/js/**/!(.min).js'
    ],
    markdown: {
      gfm: true,
      tables: true
    },
    permalinks: {
      relative: false,
      pattern: ':title'
    },
    layouts: {
      engine: 'liquid',
      directory: 'templates/_layouts',
      includeDir: 'templates/_includes'
    },
    inPlace: {
      engine: 'liquid',
      pattern: '**/*.liquid',
      includeDir: 'templates/_includes'
    },
    fingerprint: {
      pattern: 'assets/css/main.css'
    },
    tags: {
      // yaml key for tag list in you pages
      handle: 'tags',
      // path for result pages
      path: 'topics/:tag.html',
      // layout to use for tag listing
      layout: 'tag.liquid',
      // provide posts sorted by 'date' (optional)
      sortBy: 'date',
      // sort direction (optional)
      reverse: true,
      // skip updating metalsmith's metadata object.
      // useful for improving performance on large blogs
      // (optional)
      skipMetadata: false,
      // Any options you want to pass to the [slug](https://github.com/dodo/node-slug) package.
      // Can also supply a custom slug function.
      // slug: function(tag) { return tag.toLowerCase() }
      slug: {mode: 'rfc3986'}
    },
    sass: {
      outputDir: 'assets/css',
      sourceMap: true,
      sourceMapEmbed: true
    },
    imagemin: {
      optimizationLevel: 4,
      progressive: true
    },
    htmlMinifier: {
      removeComments: false,
      removeEmptyAttributes: false
    },
    preMiddleware: false,
    postMiddleware: false
  };

  const options = deepAssign({}, DEFAULT_OPTIONS, config);

  // Config
  // --------------------------------------------------------------------------
  const m = new Metalsmith(options.basePath);

  // Metalsmith options
  // --------------------------------------------------------------------------
  m.clean(true);
  m.destination(config.destination || 'dist');

  // Object Metadata
  // --------------------------------------------------------------------------
  m.metadata(options.metadata);

  // File Metadata
  // --------------------------------------------------------------------------
  m.use(metadata(options.filedata));

  // Build Date
  // --------------------------------------------------------------------------
  m.use(date({ key: 'dateBuilt' }));

  // Firebase
  // --------------------------------------------------------------------------
  if (options.firebase) {
    m.use(firebase(options.firebase));
  }

  // Ignores
  // --------------------------------------------------------------------------
  m.use(ignore(options.ignore));

  // Drafts
  // --------------------------------------------------------------------------
  if (m.metadata().production) {
    m.use(drafts());
  }

  // Definitions
  // --------------------------------------------------------------------------
  m.use(define({ moment }));

  // Attach Collections
  // --------------------------------------------------------------------------
  m.use(collections(options.collections));

  // Date
  // --------------------------------------------------------------------------
  m.use(jekyllDates());

  // Tags
  // --------------------------------------------------------------------------
  if (options.tags) {
    m.use(tags(options.tags));
  }

  // Code Highlighting
  // --------------------------------------------------------------------------
  m.use(metallic());

  // Markdown
  // --------------------------------------------------------------------------
  m.use(markdown(options.markdown));

  // Excerpts
  // --------------------------------------------------------------------------
  m.use(excerpts());

  // Permalinks
  // --------------------------------------------------------------------------
  m.use(permalinks(options.permalinks));

  // Pagination
  // --------------------------------------------------------------------------
  if (options.pagination) {
    m.use(pagination(options.pagination));
  }

  // Styles
  // --------------------------------------------------------------------------
  if (m.metadata().production) {
    options.sass.outputStyle = 'compressed';
    options.sass.sourceMap = false;
    options.sass.sourceMapEmbed = false;
    m.use(sass(options.sass));
  } else {
    m.use(sass(options.sass));
  }
  m.use(autoprefixer());

  // Fingerprinting
  // --------------------------------------------------------------------------
  if (options.fingerprint) {
    m.use(fingerprint(options.fingerprint));
  }

  // Post-template Middleware
  // --------------------------------------------------------------------------
  if (options.preMiddleware) {
    for (const plugin in options.preMiddleware) {
      if (options.preMiddleware[plugin]) {
        m.use(options.preMiddleware[plugin]);
      }
    }
  }

  // Templates
  // --------------------------------------------------------------------------
  m.use(layouts(options.layouts));
  m.use(inPlace(options.inPlace));

  // Js
  // --------------------------------------------------------------------------
  if (options.webpack) {
    if (m.metadata().production) {
      m.use(webpack(options.webpack.prod));
    } else {
      m.use(webpack(options.webpack.dev));
    }
  }

  // Sitemap
  // --------------------------------------------------------------------------
  if (m.metadata().production && options.sitemap) {
    m.use(sitemap(options.sitemap));
  }

  // RSS Feed
  // --------------------------------------------------------------------------
  if (options.rss) {
    if (m.metadata().production) {
      m.use(rss(options.rss));
    }
  }

  // Production
  // --------------------------------------------------------------------------
  if (m.metadata().production) {
    m.use(imagemin(options.imagemin));
    m.use(htmlMinifier('*.html', options.htmlMinifier));
  }

  // Post-template Middleware
  // --------------------------------------------------------------------------
  if (options.postMiddleware) {
    for (const plugin in options.postMiddleware) {
      if (options.postMiddleware[plugin]) {
        m.use(options.postMiddleware[plugin]);
      }
    }
  }

  m.build(callback);

  return m;

}