var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var AceDiff = require('ace-diff').default;
var ace = require('brace');
require('ace-diff/dist/ace-diff.min.css');
require('brace/mode/python');
require('brace/theme/monokai');

// Custom Model. Custom widgets models must at least provide default values
// for model attributes, including
//
//  - `_view_name`
//  - `_view_module`
//  - `_view_module_version`
//
//  - `_model_name`
//  - `_model_module`
//  - `_model_module_version`
//
//  when different from the base class.


// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.
var CodeModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'CodeModel',
        _view_name : 'CodeView',
        _model_module : 'code_diff',
        _view_module : 'code_diff',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
        code: '',
    })
});


// Custom View. Renders the widget model.
var CodeView = widgets.DOMWidgetView.extend({
    initialize: function() {
        this.once('displayed', this.displayed);
    },

    displayed: function() {
        var div = document.createElement('div');
        this.el.appendChild(div);
        var lines = this.model.get('code').match(/\n/g);
        div.style.height = 10 + (22 * (lines ? lines.length : 1)) + 'px';
        this.editor = ace.edit(div);
        this.editor.setOptions({
            mode: 'ace/mode/python',
            readOnly: true,
            highlightActiveLine: false
        });
        this.editor.setValue(this.model.get('code'));
        this.editor.gotoLine(0);
    },

    remove: function() {
        this.editor.destroy();
    }
});


// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.
var CodeDiffModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'CodeDiffModel',
        _view_name : 'CodeDiffView',
        _model_module : 'code_diff',
        _view_module : 'code_diff',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
        before_code: '',
        after_code: ''
    })
});


// Custom View. Renders the widget model.
var CodeDiffView = widgets.DOMWidgetView.extend({
    initialize: function() {
        this.once('displayed', this.displayed);
    },

    displayed: function() {
        var div = document.createElement('div');
        this.el.appendChild(div);
        var max_lines = Math.max(
            this.model.get('before_code').match(/\n/g).length,
            this.model.get('after_code').match(/\n/g).length) + 1;
        div.style.height = (20 * max_lines) + 'px';
        this.diff = new AceDiff({
            element: div,
            mode: 'ace/mode/python',
            left: {
                content: this.model.get('before_code'),
            },
            right: {
                content: this.model.get('after_code')
            }
        });
    },

    remove: function() {
        this.diff.destroy();
    }
});


module.exports = {
    CodeModel : CodeModel,
    CodeView : CodeView,
    CodeDiffModel : CodeDiffModel,
    CodeDiffView : CodeDiffView
};
