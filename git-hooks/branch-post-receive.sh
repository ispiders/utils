#!/bin/sh

unset GIT_DIR

branch=$1
project_dir=/data/wwwroot/joymay.kf5.com

if [ ! -d $project_dir ]
then
    exit 1
fi

cd $project_dir

echo ">>> git fetch origin $branch"
git fetch origin $branch

echo ">>> git checkout $branch"
git checkout $branch

echo ">>> git reset --hard FETCH_HEAD"
git reset --hard FETCH_HEAD

exit 0
