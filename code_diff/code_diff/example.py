import ipywidgets as widgets
from traitlets import Unicode

@widgets.register
class CodeDiff(widgets.DOMWidget):
    """An example widget."""
    _view_name = Unicode('CodeDiffView').tag(sync=True)
    _model_name = Unicode('CodeDiffModel').tag(sync=True)
    _view_module = Unicode('code_diff').tag(sync=True)
    _model_module = Unicode('code_diff').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    _model_module_version = Unicode('^0.1.0').tag(sync=True)
    before_code = Unicode('').tag(sync=True)
    after_code = Unicode('').tag(sync=True)


@widgets.register
class Code(widgets.DOMWidget):
    """An example widget."""
    _view_name = Unicode('CodeView').tag(sync=True)
    _model_name = Unicode('CodeModel').tag(sync=True)
    _view_module = Unicode('code_diff').tag(sync=True)
    _model_module = Unicode('code_diff').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    _model_module_version = Unicode('^0.1.0').tag(sync=True)
    code = Unicode('').tag(sync=True)
