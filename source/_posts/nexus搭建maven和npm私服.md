---
title: "nexus搭建maven和npm私服"
date: 2019-03-15T07:36:59.000Z
categories:
  - 常用软件部署参考文档
tags:
  - maven私服搭建
  - nexus
  - npm私服搭建
---

# Nexus Oss 安装配置文档

## [Nexus Repository Manager OSS 3.x](https://www.sonatype.com/download-oss-sonatype?hsCtaTracking=920dd7b5-7ef3-47fe-9600-10fecad8aa32%7Cf59d5f10-099f-4c66-a622-0254373f4a92)

本文档基于oss3.x版本编写，包含maven私服和npm私服的配置

### 私服默认账户

admin/admin123

### 一、Maven私服搭建

#### 1\. 配置用户权限（网页操作）

#### 2\. 配置settings.xml

增加,

```xml
<server>
    <id>ID</id>
    <username>USERNAME</username>
    <password>PASSWORD</password>
</server>
```

#### 3\. 上传依赖到远程代码库

> 注意：**不能将jar文件或者pom文件指定为本地代码仓库的文件，否则会报错Cannot deploy artifact from the local repository。具体原因待查**

##### \- 上传单个依赖到远程代码库

```shell
#第一种方式
mvn deploy:deploy-file -DgroupId=mysql   -DartifactId=mysql-connector-java   -Dversion=5.1.45   -Dpackaging=jar   -Dfile=/Users/tobbyquinn/Desktop/mysql-connector-java-5.1.45.jar   -DrepositoryId=sinosoft   -Durl=http://10.1.105.169:8081/repository/maven-releases/
#第二种方式
mvn deploy:deploy-file -Durl=http://10.1.105.169:8081/repository/maven-releases/ -Dfile="/Users/tobbyquinn/Desktop/mysql-connector-java-5.1.45.jar" -DgeneratePom=false -DpomFile="/Users/tobbyquinn/Desktop/mysql-connector-java-5.1.45.pom"
```

**一定记住：url一定要为maven-relases或maven-snapshot,不能为group组如maven-central，否则报错 HTTP.405,PUT method not allowed**

##### \- 上传工程所有依赖到本地代码库

1.  导出pom的所有依赖

```shell
mvn -Dmdep.copyPom=true dependency:copy-dependencies
```

2.  遍历并上传

```shell
for pom in target/dependency/*.pom; do mvn deploy:deploy-file -Durl=http://10.1.105.169:8081/repository/maven-releases/ -Dfile="${pom%%.pom}.jar" -DgeneratePom=false -DpomFile="$pom" -DrepositoryId=ID;done
```

##### \- 部署工程到远程代码仓库

修改pom.xml  

```xml
<distributionManagement>
        <repository>
            <id>ID</id>
            <name>部署release到nexus</name>
            <url>http://10.1.105.169:8081/repository/maven-releases/</url>
        </repository>
        <snapshotRepository>
            <id>ID</id>
            <name>部署snapshot到NEXUS</name>
            <url>http://10.1.105.169:8081/repository/maven-snapshots/</url>
        </snapshotRepository>
</distributionManagement>
```

##### \- 从远程代码仓库下载依赖

同上,

```
<profiles>
        <profile>
            <id>dev</id>
            <repositories>
                <repository>
                    <id>sinosoft</id>
                    <name>repo-public</name>
                    <url>http://10.1.105.169:8081/repository/maven-public/</url>
                    <releases>
                        <checksumPolicy>warn</checksumPolicy>
                        <enabled>true</enabled>
                        <updatePolicy>always</updatePolicy>
                    </releases>
                    <snapshots>
                        <checksumPolicy>warn</checksumPolicy>
                        <updatePolicy>never</updatePolicy>
                        <enabled>true</enabled>
                    </snapshots>
                </repository>
            </repositories>
        </profile>
</profiles>
```

开启activeProfiles=<RepositoryId>

### 二、Npm私服搭建

> 注意oss 2.x版本不支持对 scoped packages(如@types)的支持

1.  配置npm-hosted，存储公司内部依赖
    
    ![](/img/nexus-1.png)  
    ![](/img/nexus-2.jpg)
    
2.  配置npm-proxy,存储外部镜像源依赖
    
    ![](/img/nexus-3.png)
    
3.  配置npm-group,将以上两个仓库添加进去即可
    
    ![](/img/nexus-4.png)
    
4.  客户端仓库地址填写以下地址即可(如无特殊需求，只需关注group类型)
    
    ![](/img/nexus-5.png)
    
5.  Realms授权 `npm Bearer Token Realm`  
    ![](/img/nexus-7.png)

#### Npm发布内部依赖到私服

> 一定要记住发布包到 hosted 仓库位置

1.  修改镜像源地址

```
npm set registry http://192.168.180.194:8082/repository/npm-public/
```

2.  登录

```
npm adduser --registry=http://192.168.180.194:8082/repository/npm-private/
npm login  --registry=http://192.168.180.194:8082/repository/npm-private/
```

3.  发布

```
npm publish --registry=http://192.168.180.194:8082/repository/npm-private/
```
