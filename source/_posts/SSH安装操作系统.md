---
title: "SSH安装操作系统"
date: 2019-08-16T02:44:42.000Z
categories:
  - Linux参考指南
tags:
  - Linux
  - SSH
---

## 前提条件

当前服务器的可用内存必须为2g及以上，同时安装有网卡

### 1\. 安装 [VNC Viewer](https://www.realvnc.com/en/connect/download/viewer/macos/)

> Don’t use proxy(或者明确必须使用代理才能连接)

### 2\. 挂载系统镜像，并提供http服务

mount -t iso9660 -o loop CentOS-7-x86\_64-DVD-1611.iso /app/apache2/htdocs/iso/  

### 3\. 查看当前服务器可用网卡接口，ip和网关

查看default，示例如下：

*   网关：10.1.105.254
*   ip: 10.1.105.172
*   网卡接口：eth1

```shell
[root@RedHat422c3e grub]# ip route show
10.1.105.0/24 dev eth1  proto kernel  scope link  src 10.1.105.172
169.254.0.0/16 dev eth1  scope link  metric 1002
default via 10.1.105.254 dev eth1  proto static
```

### 4\. 下载系统镜像到/boot分区

> 默认即为/boot路径，相关内核文件以此目录为根目录

相关文件命名方式无固定要求  

```shell
cd /boot
## 下载相关内核文件
wget http://10.1.105.169:8081/iso/images/pxeboot/initrd.img -O initrd-7
wget http://10.1.105.169:8081/iso/images/pxeboot/vmlinuz -O vmlinuz-7
```

### 5\. Grub和Grub2两种方式安装(根据操作系统来默认的grub版本选择对应的安装方式即可)

#### Grub安装操作系统

1.  编辑menu.lst文件  
    以下相关文件配置参数根据实际情况更改
    
    ```shell
    vi /boot/grub/menu.lst
    #添加配置
    ## 如果安装centos6以及以下版本使用该配置
    title Red Hat Enterprise Linux 6.8
      root (hd0,0)
      kernel /vmlinuz-6 vnc vncpassword=ncl@1234 headless ip=192.168.1.129 netmask=255.255.255.0 gateway=192.168.1.1 nameserver=8.8.8.8 hostname=ct6 ksdevice=eth0 repo=http://10.1.105.169:8081/iso6/ lang=en_US keymap=us
      initrd /initrd-6
    ## 如果安装centos7以及以上版本使用该配置
    title Red Hat Enterprise Linux 7
      root (hd0,0)
      kernel /vmlinuz-7 inst.vnc inst.vncpassword=ncl@1234 inst.headless ip=192.168.1.105::192.168.1.1:255.255.255.0::eth0:none  inst.nameserver=8.8.8.8  inst.repo=http://192.168.1.107/centos7/ inst.lang=en_US inst.keymap=us
      initrd /initrd-7
    #修改default默认配置，根据实际位置选择。此参数代表了titile在文件中是第几个配置，下标从0开始。
    default=1
    ```
    

#### Grub2安装操作系统

1.  编辑40\_custom文件
    
    ```shell
    vi /etc/grub.d/40_custom
    ## 修改 menu entry title, the linux16, initrd16.
    menuentry 'Linux 7' --class centos --class gnu-linux --class gnu --class os --unrestricted $menuentry_id_option 'gnulinux-3.10.0-862.6.3.el7.x86_64-advanced-916c887d-0b28-4f0f-bd21-d94a9f3727d6' {
      load_video
      set gfxpayload=keep
      insmod gzio
      insmod part_msdos
      insmod xfs
      set root='hd0,msdos1'
      if [ x$feature_platform_search_hint = xy ]; then
        search --no-floppy --fs-uuid --set=root --hint-bios=hd0,msdos1 --hint-efi=hd0,msdos1 --hint-baremetal=ahci0,msdos1 --hint='hd0,msdos1'  135d8c7b-50f6-4253-b0a4-46028a06391e
      else
        search --no-floppy --fs-uuid --set=root 135d8c7b-50f6-4253-b0a4-46028a06391e
      fi
      linux16 /vmlinuz-7 inst.vnc inst.vncpassword=ncl@1234 inst.headless ip=192.168.1.129::192.168.1.1:255.255.255.0::eth0:none  inst.nameserver=8.8.8.8  inst.repo=http://10.1.105.169:8081/isoFinal/ inst.lang=en_US inst.keymap=us
      initrd16 /initrd-7
    }
    ```
    
2.  修改grub文件的GRUB\_DEFAULT值
    
    ```shell
    vi /etc/default/grub
    ##change GRUB_DEFAULT=0 to GRUB_DEFAULT=saved
    GRUB_DEFAULT=saved
    ```
    
3.  保存所有配置
    
    ```shell
    # rebuilt the grub.cfg
    grub2-mkconfig -o /boot/grub2/grub.cfg
    # list available menu entry
    awk -F\' '$1=="menuentry " {print $2}' /etc/grub2.cfg
    # verify the default menu entry.
    # you can use grub2-set-default 'MenuEntry'
    # to change the default boot
    grub2-editenv list
    # change default menu entry,replace MENU_ENTRY to your own.
    grub2-set-default MENU_ENTRY
    # boot our new menu entry for the next reboot.
    # We just need to use the menu entry title.
    grub2-reboot NetInstall
    ```
    

### 6\. 重启

reboot -n now

### 7\. ping服务器IP.ping通后使用vncviewer连接IP:1

操作VNC的相关日志，会在对应服务器的显示屏输出

## 相关注意事项

1.  NetInstall 包是不包含仓库资源文件。
2.  当安装过程出现dracut-initqueue timeout警告，/dev/root does not exist，直接查找网络，大多数原因是使用的网卡和配置的不一致。
3.  使用vmvare虚拟机安装操作系统，因为有的vmvare版本的问题，导致使用的网卡和实际不一致，可以通过添加以下两个参数，`net.ifnames=0 biosdevname=0`(该0与实际的网卡一致，eth0则为0，eth1则为1…)

## 安装过程调试

kernel启动参数中添加断点如下: `rd.break=initqueue`  
ip addr看加载的网卡是否正确

## 安装指令解释

net.ifnames=0 biosdevname=0（使用eth0）

> it was a requirement that the system use old style ethN interface names. If you want the new consistent naming then you may have to figure out how to provide interface to the ip stanza  
> ip=address::gateway:netmask:hostname:interface:method  
> ip=address::gateway:metmask:hostname::none 省略接口

## 参考文档

*   [Redhat Boot Options Docs](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/installation_guide/chap-anaconda-boot-options#sect-boot-options-installer)
*   [Redhat Installation Guide](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/installation_guide/index)
*   [Grub2 Install Centos7](https://www.danpros.com/2016/02/how-to-install-centos-7-remotely-using-vnc)
*   [biosdevname docs](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/networking_guide/sec-consistent_network_device_naming_using_biosdevname)
*   [PXE Installation Docs](https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/7/html/installation_guide/chap-installation-server-setup)
