#!/usr/bin/env python
# coding: utf-8

# Copyright (c) .
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

from ipywidgets import DOMWidget
from traitlets import Unicode
from ._frontend import module_name, module_version

class BaseWidget(DOMWidget):
    _model_name = Unicode('ExperimentModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_version = Unicode(module_version).tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_version = Unicode(module_version).tag(sync=True)

    experiment = Unicode('').tag(sync=True)
    results = Unicode('').tag(sync=True)

class VariableMemoryExperiment(BaseWidget):
    _view_name = Unicode('VariableMemoryView').tag(sync=True)

class VariableArithmeticMemoryExperiment(BaseWidget):
    _view_name = Unicode('VariableArithmeticMemoryView').tag(sync=True)

class VariableArithmeticSequenceExperiment(BaseWidget):
    _view_name = Unicode('VariableArithmeticSequenceView').tag(sync=True)
