#!python3
import argparse
import subprocess as sp
import shlex
import os

parser = argparse.ArgumentParser()
parser.add_argument('--command', choices=['build', 'watch'], default='watch')
parser.add_argument('--only')
parser.add_argument('--target', choices=['jupyter', 'standalone'], default='standalone')
parser.add_argument('--mturk', action='store_true')
parser.add_argument('--irb', action='store_true')
parser.add_argument('--demographics', action='store_true')
parser.add_argument('--no-instructions', action='store_true')

args = parser.parse_args()
env = {}

if args.only:
    env['BUILD_ONLY'] = args.only

if args.mturk:
    env['BUILD_MTURK'] = '1'

if args.irb:
    env['BUILD_IRB'] = '1'

if args.demographics:
    env['BUILD_DEMOGRAPHICS'] = '1'

if args.no_instructions:
    env['BUILD_NO_INSTRUCTIONS'] = '1'

env['BUILD_TARGET'] = args.target

sp.check_call(f'npm run {args.command}', shell=True, env={**os.environ, **env})
