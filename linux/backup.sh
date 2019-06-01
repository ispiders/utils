time tar -cvpzf /home/kyle/backups/ubuntu-`date +%Y%m%d_%H`.backup.tgz \
	--exclude=/run \
	--exclude=/lost+found \
	--exclude=/sys \
	--exclude=/home \
	--exclude=/mnt \
	--exclude=/media \
	--exclude=/proc \
	--exclude=/tmp \
	--exclude=/dev \
	/
