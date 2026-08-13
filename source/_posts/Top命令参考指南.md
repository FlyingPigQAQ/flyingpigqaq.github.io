---
title: "Top命令参考指南"
date: 2019-02-26T05:38:05.000Z
categories:
  - Linux参考指南
tags:
  - Linux
  - Shell
---

> Top命令是系统性能监控和瓶颈分析的优秀工具。  
> 本节内容着重讲述top命令面板和一些常用的参数。  
> 最后欢迎大家在评论区积极维护补充。

### 系统信息摘要

```bash
#system time
#uptime          
#user sessions
#load average:系统平均负载，必须等待完成任务的的时间的相对度量。（1分钟,5分钟,15分钟）。负载为处在任何时刻Runnable状态和Uninterruptible sleep状态的进程数。
#如何理解：在单核系统上，平均负载为0.4意味着系统只能完成60％的工作。平均负载为1意味着系统完全处于容量状态 。负载平均值为2.12的系统意味着它的负载超过其处理的112％。

在多核系统上，您应首先将负载平均值除以CPU核心数，以获得类似的度量。
top - 13:46:25 up 28 days,  2:40,  1 user,  load average: 0.00, 0.01, 0.05
#buff/cache:Linux内核总在尝试减少磁盘访问时间，它在RAM中维护一个“磁盘缓存”，其中存储了磁盘的常用区域 #此外，磁盘写入存储到“磁盘缓冲区”，内核最终将它们写入磁盘。它们消耗的总内存是“buff/cache”值。但需要注意的是，在必要的时候，该值会优先分配给要使用的进程
KiB Mem :  1882760 total,    64860 free,   840544 used,   977356 buff/cache
#swap使用硬盘空间，当内存使用率接近100%的时候，最低使用率的内存区域会被写入到swap空间，但注意
#依赖太多交换空间会影响系统性能

# 'avail mem'：可以被分配给进程的数值，同时不会造成更多的swap
KiB Swap:  2097148 total,  2097148 free,        0 used.   839960 avail Mem
# total:内核中进程总数
#runnable:进程处于该状态表明：要么在cpu上执行，要么在运行队列上等待被执行
#Interruptible sleep：等待事件完成
#Uninterruptible sleep：等待IO操作完成
#Zobie：内核在内存中维护各种数据结构以跟踪进程。 一个进程可能会创建许多子进程，并且它们可能会在父进程仍然存在时退出。 但是，必须保留这些数据结构，直到父级获取子进程的状态。 数据结构仍然存在的这种终止进程称
#为僵尸。
Tasks:  95 total,   1 running,  94 sleeping,   0 stopped,   0 zombie
#us:the time is cpu spends executing processes in userspace(cpu在用户空间执行进程花费时间)
#sy:the time spent on running kernalspace processes(cpu运行系统进程花费时间--内核空间)
#ni:手动设置进程nice值花费的时间。每个进程的nice值的大小决定其优先级的高低。nice值越高，优先级越低。
#id：idlecpu保持空闲时间
#wa:waitcpu等待io完成耗费时间
#hi:hardware interrupts.系统处理硬件中断事件(按压键盘的事件中断)花费时间
#si:software interrupts.系统处理软件中断花费时间
#st:在虚拟化环境中，部分cpu资源被分配给各个虚拟机。当系统检测到有任务需要执行，但cpu因为忙于其他vm而无法执行所耗费的时间为‘st’
%Cpu(s):  0.0 us,  0.0 sy,  0.0 ni,100.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
```

```bash
#在单核系统中意味着：
#CPU 被充分利用（100%）；最近的 1 分钟有 1 个进程在运行。
#CPU 有 60% 处于空闲状态；在最近的 5 分钟没有进程等待 CPU 时间。
#CPU 平均过载了 235%；最近的 15 分钟平均有 2.35 个进程在等待 CPU 时间。
#在双核系统中意味着：
#有一个 CPU 处于完全空闲状态，另一个 CPU 被使用；最近的 1 分钟没有进程等待 CPU 时间。
#CPU 平均 160% 处于空闲状态；最近的 5 分钟没有进程等待 CPU 时间。
#CPU 平均过载了 135%；最近的 15 分钟有 1.35 个进程等待 CPU 时间。
23:16:49 up  10:49,  5 user,  load average: 1.00, 0.40, 3.35
```

### 进程任务区域

```bash
PID USER      PR  NI  VIRT  RES  SHR S %CPU %MEM    TIME+  COMMAND
#PID:进程id
#USER:有效用户。Linux为进程分配真实用户和有效用户。后者允许进程代表另一个用户行事。（例如：非root用户可以sudo到root来安装程序包）
#NI：显示进程‘nice’值
#PR：内核角度显示进程的调度优先级。‘nice’值影响响应进程的优先级
#VIRT:进程消耗的内存总量。包括：程序代码，进程在内存中存储的数据以及已交换到磁盘的swap内存区域。
#RES:进程在RAM中消耗的内存
#%MEM:RES/可用RAM总量
#SHR:进程与其他进程共享的内存量
#S:process status。
##D = uninterruptible sleep
##R = running
##S = sleeping
##T = stopped by job control signal
##t = stopped by debugger during trace
##Z = zombie
#Time+：进程自启动以来使用的cpu时间
#Command:显示进程名称
```

### 用法（`单引号中的内容需要键入`）

1.  杀死进程
    *   (触发k) 先输入要杀死的pid,再输入相关信号的整型值
2.  进程列表排序
    *   ‘M’ 根据内存使用情况排序
    *   ‘P’ cpu使用情况排序
    *   ‘N’ pid排序
    *   ‘T’ 运行时间排序
        
        > 默认为降序排序，‘R’可以改为升序  
        > Example: top -o %cpu;
        
3.  各个进程的线程总数
    
    *   ‘H’ 显示线程摘要信息
        
        > Threads: 222 total, 1 running, 221 sleeping, 0 stopped, 0 zombie
        
4.  查看指定进程的线程信息
    
    *   top -Hp PID
5.  COMMAND显示完整路径
    
    *   ‘c’
        
        > top -c
        
6.  查看子进程的父级层次结构
    
    *   ‘V’：Forest view
7.  查看某个用户下的进程列表
    
    *   ‘u’->’USER’
        
        > top -u USER
        
8.  进程信息过滤
    
    *   ‘O’:开启过滤模式(区分大小写)
        *   COMMAND=java:进程COMMAND一栏包含java属性
        *   !COMMAND=java:进程COMMAND一栏不包含java属性
        *   %CPU>3.0:cpu使用率大于3%
    *   过滤条件可以叠加
    *   ‘=’:清除过滤信息
9.  保存当前top输出
    *   ‘W’:路径通常为~/.toprc

### 总结

如果想要查看更详细的信息，`man top`了解下。
