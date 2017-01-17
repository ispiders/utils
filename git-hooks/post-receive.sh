#!/bin/sh

project=`pwd | grep -oE -e '[^\/]+$'`

if [ "$project" = '' ]
then
    exit 1
fi

while read old new ref
do
    echo "post-receive: $old $new $ref"

    branch=`echo $ref | awk -F '/' '{print $3}'`
    script="/data/git-hooks/$project/$branch-post-receive.sh"

    if [ -f $script ]
    then

        /bin/sh $script $branch
        exit $?

    fi
done

exit 0
