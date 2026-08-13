---
title: "Failed to connect to raw.githubusercontent.com port 443. Connection refused"
date: 2020-04-20T10:59:31.000Z
categories:
  - github
tags:
  - github
  - 常见问题
---

### 原由：由于一些政策原因，国内无法正常访问raw.githubusercontent.com。

解决方式：  
`**添加ip和域名绑定记录**`  

```shell
vi /etc/hosts
151.101.108.133 raw.githubusercontent.com
```

这个IP是Github某个CDN节点的IP，存在失效可能性。可以通过一些DNS查询网站获取实时的IP地址。

### DNS查询网址：

*   [http://tool.chinaz.com/dns/?type=1&host=raw.githubusercontent.com&ip=](http://tool.chinaz.com/dns/?type=1&host=raw.githubusercontent.com&ip=)
*   [https://www.ultratools.com/tools/dnsLookupResult](https://www.ultratools.com/tools/dnsLookupResult)
