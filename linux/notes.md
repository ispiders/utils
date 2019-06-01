exit 0

# 查看硬件信息
dmidecode

# 查看管理无线设备
rfkill

# 修复intelligent pinyin 数字选词崩溃问题
rm -rf ~/.cache/ibus/libpinyin && reboot

# mount 文件系统到内存提升读写速度
mount -t tmpfs -o size=100M,mode=0755 tmpfs /mount/to/directory
mount -o remount,size=50M /mountpoint

# 查看启动时间
systemd-analyze blame

# systemctl
# --user 情况下, WantedBy 不能是multi-user.target
systemctl --user enable /path/to/service

# sudo
/etc/sudoers
visudo
