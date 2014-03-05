#!/usr/bin/env bash
export NODE_ENV=${2:-'development'}
export DEBUG='dbj:*'

if [[ -z $1 ]]; then
  echo
  echo 'Must provide a script name to run.'
  echo
  exit 1
fi

# make sure we are at app root
cd `dirname $0`/../
node "tools/${1}.js"
