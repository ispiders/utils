#!/bin/bash

prefix="/home/kyle/Videos/"
m3u8=$1

function finish () {
    exit $1
}

if [ "${m3u8##*.}" != 'm3u8' ]
then
    echo 'not a valid m3u8'
    finish 1
fi

fullpath=${m3u8%/*}
dirname="${prefix}${fullpath##*/}"
finishlock="${dirname}/finish.lock"

function download () {
    url=$1
    filepath=$2

    if [ -z $filepath ]
    then
        wget -q -t 2 "$url"
    else
        wget -q -t 2 -O "$filepath" "$url"
    fi

    if [ $? -ne 0 ]
    then
        headers=`wget --spider -S -q "$url" 2>&1`
        read protocol httpStatus statusText <<< "$headers"

        if [ "$httpStatus" = "404" ]
        then
            echo 'download ' $url '404' >&2
            return 64
        else
            echo 'download ' $url $httpStatus >&2
            return 65
        fi
    else
        echo 'download ' $url '->' $filepath >&2
        return 0
    fi
}

m3u8file="${dirname}/index.m3u8"
ffmpegindex="${dirname}/ffmpegindex"
indexarr=()

if [ ! -d "$dirname" ]
then
    mkdir "$dirname"
fi

if [ ! -f "$m3u8file" ]
then
    download $m3u8 $m3u8file
fi

function getFistSlice () {

    while read line
    do
        if [ "${line%%:*}" = "#EXTINF" ]
        then
            read firstfile
            echo -n $firstfile
            break
        fi
    done
}

firstfile=`getFistSlice < $m3u8file`
firstname=${firstfile%.*}
ext=${firstfile##*.}

if [ "$firstname" = "000" ]
then
    mkfifo /tmp/tmp-pipe-1
    exec 9<>/tmp/tmp-pipe-1
    rm /tmp/tmp-pipe-1

    i=0

    while (($i < 3))
    do
        echo "" >&9
        let i++
    done

    i=0
    while (($i < 2000))
    do
        if [ -f "${finishlock}" ]
        then
            break
        fi

        read -u9

        printf -v indexname "%03d" ${i}
        indexfile="${dirname}/${indexname}.${ext}"

        indexarr[$i]="file ${indexname}.${ext}"

        if [ -f "${indexfile}" ]
        then
            echo "" >&9
            let i++
            continue
        fi

        {
            download "${fullpath}/${indexname}.${ext}" "${indexfile}"

            if [ $? -ne 0 ]
            then
                unset indexarr[$i]
                rm  "${indexfile}"
                touch "${finishlock}"
            fi

            echo "" >&9
        } &

        let i++
    done
    wait

    exec 9<&-
    exec 9>&-

fi

echo -n "" > "$ffmpegindex"
len=${#indexarr[@]}
for ((i=0; i<len; i++))
do
    echo "${indexarr[$i]}" >> "$ffmpegindex"
done

rm "${finishlock}"
echo "finished" "${#indexarr[@]}"

