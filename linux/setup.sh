# prevent execute
exit 0

# set root password
sudo passwd root

# check pcis
sudo update-pciids
lspci

# check drivers
ubuntu-drivers devices

# set software updater source then
sudo apt-get update
sudo apt-get dist-upgrade 

# sudo apt-get remove xserver-xorg-video-nouveau

# clear /boot kernels
dpkg --get-selections | grep linux-image
apt purge linux-image-xxx

# install 
sudo apt install -y net-tools vim git
sudo apt install -y nodejs npm
sudo apt install nginx
sudo apt install fonts-wqy-microhei xfonts-wqy

# npm
sudo npm install -g npm@latest
sudo npm install -g n
sudo npm install -g less eslint

# set default editor
sudo update-alternatives --config editor

# google-chrome-stable:
    sudo wget http://www.linuxidc.com/files/repo/google-chrome.list -P /etc/apt/sources.list.d/
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub  | sudo apt-key add -
    sudo apt-get update
    sudo apt-get install google-chrome-stable

# sublimetext
    sudo apt-get install apt-transport-https
    wget -qO - https://download.sublimetext.com/sublimehq-pub.gpg | sudo apt-key add -
    echo "deb https://download.sublimetext.com/ apt/stable/" | sudo tee /etc/apt/sources.list.d/sublime-text.list
    sudo apt-get update
    sudo apt-get install sublime-text
