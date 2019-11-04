var plugin = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'code_diff',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'code_diff',
          version: plugin.version,
          exports: plugin
      });
  },
  autoStart: true
};

