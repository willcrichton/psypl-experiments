from setuptools import setup

if __name__ == "__main__":
    setup(name='psypl',
          version='0.1.0',
          description='',
          url='http://github.com/willcrichton/psypl-experiments',
          author='Will Crichton',
          author_email='wcrichto@cs.stanford.edu',
          license='Apache 2.0',
          install_requires=['pandas', 'hyperopt', 'flask', 'flask_cors', 'seaborn', 'uwsgi', 'pickle-cache', 'iterextras', 'jupyter'],
          packages=['psypl'],
          zip_safe=False)
