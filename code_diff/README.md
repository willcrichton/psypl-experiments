code_diff
===============================

Code diff

Installation
------------

To install use pip:

    $ pip install code_diff
    $ jupyter nbextension enable --py --sys-prefix code_diff

To install for jupyterlab

    $ jupyter labextension install code_diff

For a development installation (requires npm),

    $ git clone https://github.com/willcrichton/code_diff.git
    $ cd code_diff
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --sys-prefix code_diff
    $ jupyter nbextension enable --py --sys-prefix code_diff
