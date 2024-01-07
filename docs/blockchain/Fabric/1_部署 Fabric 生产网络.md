# 搭建 Fabric 生产网络

相关链接：

- [Fabric 文档](https://hyperledger-fabric.readthedocs.io/en/release-2.5/deployment_guide_overview.html)
- [Fabric 中文文档](https://hyperledger-fabric.readthedocs.io/zh-cn/release-2.5/deployment_guide_overview.html)

> 文档来源于B 站[视频教程（For Java SDK）](https://www.bilibili.com/video/BV1ZR4y1M7yH)，UP 主[博客主页](https://my.oschina.net/j4love)

> 准备工作：[下载 fabric 发行版](https://github.com/hyperledger/fabric/releases) （示例版本 v2.4.4），并解压。

# 生成网络需要的身份文件

## 规划网络拓扑

3 个 orderer 节点；组织 org1 , org1 下有两个 peer 节点， peer0 和 peer1; 组织 org2 , org2 下有两个 peer 节点， peer0 和 peer1



![img](http://mydoc-pics.oss-cn-chengdu.aliyuncs.com/img/up-283009bb3945ac505b25ca058a173e52789.png)

> Fabric 项目还提供了 `cryptogen` 工具来在本地生身份文件，这种方式需要提供一个 `crypto-config.yaml` 配置文件。

### 准备 `crypto-config.yaml` 文件

在解压后的`bin/`目录下，使用命令：

```bash
./cryptogen showtemplate  > ../crypto-config.yaml
```

获取`crypto-config.yaml`

```yaml
# ---------------------------------------------------------------------------
# "OrdererOrgs" - Definition of organizations managing orderer nodes
# ---------------------------------------------------------------------------
OrdererOrgs:
  # ---------------------------------------------------------------------------
  # Orderer
  # ---------------------------------------------------------------------------
  - Name: Orderer
    Domain: example.com
    EnableNodeOUs: false

    # ---------------------------------------------------------------------------
    # "Specs" - See PeerOrgs below for complete description
    # ---------------------------------------------------------------------------
    Specs:
      - Hostname: orderer

# ---------------------------------------------------------------------------
# "PeerOrgs" - Definition of organizations managing peer nodes
# ---------------------------------------------------------------------------
PeerOrgs:
  # ---------------------------------------------------------------------------
  # Org1
  # ---------------------------------------------------------------------------
  - Name: Org1
    Domain: org1.example.com
    EnableNodeOUs: false

    # ---------------------------------------------------------------------------
    # "CA"
    # ---------------------------------------------------------------------------
    # Uncomment this section to enable the explicit definition of the CA for this
    # organization.  This entry is a Spec.  See "Specs" section below for details.
    # ---------------------------------------------------------------------------
    # CA:
    #    Hostname: ca # implicitly ca.org1.example.com
    #    Country: US
    #    Province: California
    #    Locality: San Francisco
    #    OrganizationalUnit: Hyperledger Fabric
    #    StreetAddress: address for org # default nil
    #    PostalCode: postalCode for org # default nil

    # ---------------------------------------------------------------------------
    # "Specs"
    # ---------------------------------------------------------------------------
    # Uncomment this section to enable the explicit definition of hosts in your
    # configuration.  Most users will want to use Template, below
    #
    # Specs is an array of Spec entries.  Each Spec entry consists of two fields:
    #   - Hostname:   (Required) The desired hostname, sans the domain.
    #   - CommonName: (Optional) Specifies the template or explicit override for
    #                 the CN.  By default, this is the template:
    #
    #                              "{{.Hostname}}.{{.Domain}}"
    #
    #                 which obtains its values from the Spec.Hostname and
    #                 Org.Domain, respectively.
    #   - SANS:       (Optional) Specifies one or more Subject Alternative Names
    #                 to be set in the resulting x509. Accepts template
    #                 variables {{.Hostname}}, {{.Domain}}, {{.CommonName}}. IP
    #                 addresses provided here will be properly recognized. Other
    #                 values will be taken as DNS names.
    #                 NOTE: Two implicit entries are created for you:
    #                     - {{ .CommonName }}
    #                     - {{ .Hostname }}
    # ---------------------------------------------------------------------------
    # Specs:
    #   - Hostname: foo # implicitly "foo.org1.example.com"
    #     CommonName: foo27.org5.example.com # overrides Hostname-based FQDN set above
    #     SANS:
    #       - "bar.{{.Domain}}"
    #       - "altfoo.{{.Domain}}"
    #       - "{{.Hostname}}.org6.net"
    #       - 172.16.10.31
    #   - Hostname: bar
    #   - Hostname: baz

    # ---------------------------------------------------------------------------
    # "Template"
    # ---------------------------------------------------------------------------
    # Allows for the definition of 1 or more hosts that are created sequentially
    # from a template. By default, this looks like "peer%d" from 0 to Count-1.
    # You may override the number of nodes (Count), the starting index (Start)
    # or the template used to construct the name (Hostname).
    #
    # Note: Template and Specs are not mutually exclusive.  You may define both
    # sections and the aggregate nodes will be created for you.  Take care with
    # name collisions
    # ---------------------------------------------------------------------------
    Template:
      Count: 1
      # Start: 5
      # Hostname: {{.Prefix}}{{.Index}} # default
      # SANS:
      #   - "{{.Hostname}}.alt.{{.Domain}}"

    # ---------------------------------------------------------------------------
    # "Users"
    # ---------------------------------------------------------------------------
    # Count: The number of user accounts _in addition_ to Admin
    # ---------------------------------------------------------------------------
    Users:
      Count: 1

  # ---------------------------------------------------------------------------
  # Org2: See "Org1" for full specification
  # ---------------------------------------------------------------------------
  - Name: Org2
    Domain: org2.example.com
    EnableNodeOUs: false
    Template:
      Count: 1
    Users:
      Count: 1

```

根据网络拓扑修改`crypto-config.yaml`

- 根据 order 服务组织的节点数修改 `Specs`字段下的主机名
- 根据两个组织的节点数，修改每个组织的 `Templeate.Count` 字段

```yaml

# ---------------------------------------------------------------------------
# "OrdererOrgs" - Definition of organizations managing orderer nodes
# ---------------------------------------------------------------------------
OrdererOrgs:
  # ---------------------------------------------------------------------------
  # Orderer
  # ---------------------------------------------------------------------------
  - Name: Orderer
    Domain: example.com
    EnableNodeOUs: true

    # ---------------------------------------------------------------------------
    # "Specs" - See PeerOrgs below for complete description
    # ---------------------------------------------------------------------------
    Specs:
      - Hostname: orderer0
      - Hostname: orderer1
      - Hostname: orderer2

# ---------------------------------------------------------------------------
# "PeerOrgs" - Definition of organizations managing peer nodes
# ---------------------------------------------------------------------------
PeerOrgs:
  # ---------------------------------------------------------------------------
  # Org1
  # ---------------------------------------------------------------------------
  - Name: Org1
    Domain: org1.example.com
    EnableNodeOUs: true

    # ---------------------------------------------------------------------------
    # "CA"
    # ---------------------------------------------------------------------------
    # Uncomment this section to enable the explicit definition of the CA for this
    # organization.  This entry is a Spec.  See "Specs" section below for details.
    # ---------------------------------------------------------------------------
    # CA:
    #    Hostname: ca # implicitly ca.org1.example.com
    #    Country: US
    #    Province: California
    #    Locality: San Francisco
    #    OrganizationalUnit: Hyperledger Fabric
    #    StreetAddress: address for org # default nil
    #    PostalCode: postalCode for org # default nil

    # ---------------------------------------------------------------------------
    # "Specs"
    # ---------------------------------------------------------------------------
    # Uncomment this section to enable the explicit definition of hosts in your
    # configuration.  Most users will want to use Template, below
    #
    # Specs is an array of Spec entries.  Each Spec entry consists of two fields:
    #   - Hostname:   (Required) The desired hostname, sans the domain.
    #   - CommonName: (Optional) Specifies the template or explicit override for
    #                 the CN.  By default, this is the template:
    #
    #                              "{{.Hostname}}.{{.Domain}}"
    #
    #                 which obtains its values from the Spec.Hostname and
    #                 Org.Domain, respectively.
    #   - SANS:       (Optional) Specifies one or more Subject Alternative Names
    #                 to be set in the resulting x509. Accepts template
    #                 variables {{.Hostname}}, {{.Domain}}, {{.CommonName}}. IP
    #                 addresses provided here will be properly recognized. Other
    #                 values will be taken as DNS names.
    #                 NOTE: Two implicit entries are created for you:
    #                     - {{ .CommonName }}
    #                     - {{ .Hostname }}
    # ---------------------------------------------------------------------------
    # Specs:
    #   - Hostname: foo # implicitly "foo.org1.example.com"
    #     CommonName: foo27.org5.example.com # overrides Hostname-based FQDN set above
    #     SANS:
    #       - "bar.{{.Domain}}"
    #       - "altfoo.{{.Domain}}"
    #       - "{{.Hostname}}.org6.net"
    #       - 172.16.10.31
    #   - Hostname: bar
    #   - Hostname: baz

    # ---------------------------------------------------------------------------
    # "Template"
    # ---------------------------------------------------------------------------
    # Allows for the definition of 1 or more hosts that are created sequentially
    # from a template. By default, this looks like "peer%d" from 0 to Count-1.
    # You may override the number of nodes (Count), the starting index (Start)
    # or the template used to construct the name (Hostname).
    #
    # Note: Template and Specs are not mutually exclusive.  You may define both
    # sections and the aggregate nodes will be created for you.  Take care with
    # name collisions
    # ---------------------------------------------------------------------------
    Template:
      Count: 2
      # Start: 5
      # Hostname: {{.Prefix}}{{.Index}} # default
      # SANS:
      #   - "{{.Hostname}}.alt.{{.Domain}}"

    # ---------------------------------------------------------------------------
    # "Users"
    # ---------------------------------------------------------------------------
    # Count: The number of user accounts _in addition_ to Admin
    # ---------------------------------------------------------------------------
    Users:
      Count: 1

  # ---------------------------------------------------------------------------
  # Org2: See "Org1" for full specification
  # ---------------------------------------------------------------------------
  - Name: Org2
    Domain: org2.example.com
    EnableNodeOUs: true
    Template:
      Count: 2
    Users:
      Count: 1

```

### 生成组织身份文件

根据 `crypto-config.yaml` 配置文件生成组织身份文件并保存在 ` ../crypto-config` 目录下。

```bash
./cryptogen generate --config=../crypto-config.yaml --output=../crypto-config
```

用户修改配置后，还可以通过 extend 子命令来更新 `crypto-config` 目录:

```bash
./cryptogen extend --config=../crypto-config.yaml --input ../crypto-config
```

得到的 `crypto-config` 目录结构如下：

```bash
[root@xxz10 bin]# tree ../crypto-config
../crypto-config
├── ordererOrganizations
│   └── example.com
│       ├── ca
│       │   ├── ca.example.com-cert.pem
│       │   └── priv_sk
│       ├── msp
│       │   ├── admincerts
│       │   ├── cacerts
│       │   │   └── ca.example.com-cert.pem
│       │   ├── config.yaml
│       │   └── tlscacerts
│       │       └── tlsca.example.com-cert.pem
│       ├── orderers
│       │   ├── orderer0.example.com
│       │   │   ├── msp
│       │   │   │   ├── admincerts
│       │   │   │   ├── cacerts
│       │   │   │   │   └── ca.example.com-cert.pem
│       │   │   │   ├── config.yaml
│       │   │   │   ├── keystore
│       │   │   │   │   └── priv_sk
│       │   │   │   ├── signcerts
│       │   │   │   │   └── orderer0.example.com-cert.pem
│       │   │   │   └── tlscacerts
│       │   │   │       └── tlsca.example.com-cert.pem
│       │   │   └── tls
│       │   │       ├── ca.crt
│       │   │       ├── server.crt
│       │   │       └── server.key
│       │   ├── orderer1.example.com
│       │   │   ├── msp
│       │   │   │   ├── admincerts
│       │   │   │   ├── cacerts
│       │   │   │   │   └── ca.example.com-cert.pem
│       │   │   │   ├── config.yaml
│       │   │   │   ├── keystore
│       │   │   │   │   └── priv_sk
│       │   │   │   ├── signcerts
│       │   │   │   │   └── orderer1.example.com-cert.pem
│       │   │   │   └── tlscacerts
│       │   │   │       └── tlsca.example.com-cert.pem
│       │   │   └── tls
│       │   │       ├── ca.crt
│       │   │       ├── server.crt
│       │   │       └── server.key
│       │   └── orderer2.example.com
│       │       ├── msp
│       │       │   ├── admincerts
│       │       │   ├── cacerts
│       │       │   │   └── ca.example.com-cert.pem
│       │       │   ├── config.yaml
│       │       │   ├── keystore
│       │       │   │   └── priv_sk
│       │       │   ├── signcerts
│       │       │   │   └── orderer2.example.com-cert.pem
│       │       │   └── tlscacerts
│       │       │       └── tlsca.example.com-cert.pem
│       │       └── tls
│       │           ├── ca.crt
│       │           ├── server.crt
│       │           └── server.key
│       ├── tlsca
│       │   ├── priv_sk
│       │   └── tlsca.example.com-cert.pem
│       └── users
│           └── Admin@example.com
│               ├── msp
│               │   ├── admincerts
│               │   ├── cacerts
│               │   │   └── ca.example.com-cert.pem
│               │   ├── config.yaml
│               │   ├── keystore
│               │   │   └── priv_sk
│               │   ├── signcerts
│               │   │   └── Admin@example.com-cert.pem
│               │   └── tlscacerts
│               │       └── tlsca.example.com-cert.pem
│               └── tls
│                   ├── ca.crt
│                   ├── client.crt
│                   └── client.key
└── peerOrganizations
    ├── org1.example.com
    │   ├── ca
    │   │   ├── ca.org1.example.com-cert.pem
    │   │   └── priv_sk
    │   ├── msp
    │   │   ├── admincerts
    │   │   ├── cacerts
    │   │   │   └── ca.org1.example.com-cert.pem
    │   │   ├── config.yaml
    │   │   └── tlscacerts
    │   │       └── tlsca.org1.example.com-cert.pem
    │   ├── peers
    │   │   ├── peer0.org1.example.com
    │   │   │   ├── msp
    │   │   │   │   ├── admincerts
    │   │   │   │   ├── cacerts
    │   │   │   │   │   └── ca.org1.example.com-cert.pem
    │   │   │   │   ├── config.yaml
    │   │   │   │   ├── keystore
    │   │   │   │   │   └── priv_sk
    │   │   │   │   ├── signcerts
    │   │   │   │   │   └── peer0.org1.example.com-cert.pem
    │   │   │   │   └── tlscacerts
    │   │   │   │       └── tlsca.org1.example.com-cert.pem
    │   │   │   └── tls
    │   │   │       ├── ca.crt
    │   │   │       ├── server.crt
    │   │   │       └── server.key
    │   │   └── peer1.org1.example.com
    │   │       ├── msp
    │   │       │   ├── admincerts
    │   │       │   ├── cacerts
    │   │       │   │   └── ca.org1.example.com-cert.pem
    │   │       │   ├── config.yaml
    │   │       │   ├── keystore
    │   │       │   │   └── priv_sk
    │   │       │   ├── signcerts
    │   │       │   │   └── peer1.org1.example.com-cert.pem
    │   │       │   └── tlscacerts
    │   │       │       └── tlsca.org1.example.com-cert.pem
    │   │       └── tls
    │   │           ├── ca.crt
    │   │           ├── server.crt
    │   │           └── server.key
    │   ├── tlsca
    │   │   ├── priv_sk
    │   │   └── tlsca.org1.example.com-cert.pem
    │   └── users
    │       ├── Admin@org1.example.com
    │       │   ├── msp
    │       │   │   ├── admincerts
    │       │   │   ├── cacerts
    │       │   │   │   └── ca.org1.example.com-cert.pem
    │       │   │   ├── config.yaml
    │       │   │   ├── keystore
    │       │   │   │   └── priv_sk
    │       │   │   ├── signcerts
    │       │   │   │   └── Admin@org1.example.com-cert.pem
    │       │   │   └── tlscacerts
    │       │   │       └── tlsca.org1.example.com-cert.pem
    │       │   └── tls
    │       │       ├── ca.crt
    │       │       ├── client.crt
    │       │       └── client.key
    │       └── User1@org1.example.com
    │           ├── msp
    │           │   ├── admincerts
    │           │   ├── cacerts
    │           │   │   └── ca.org1.example.com-cert.pem
    │           │   ├── config.yaml
    │           │   ├── keystore
    │           │   │   └── priv_sk
    │           │   ├── signcerts
    │           │   │   └── User1@org1.example.com-cert.pem
    │           │   └── tlscacerts
    │           │       └── tlsca.org1.example.com-cert.pem
    │           └── tls
    │               ├── ca.crt
    │               ├── client.crt
    │               └── client.key
    └── org2.example.com
        ├── ca
        │   ├── ca.org2.example.com-cert.pem
        │   └── priv_sk
        ├── msp
        │   ├── admincerts
        │   ├── cacerts
        │   │   └── ca.org2.example.com-cert.pem
        │   ├── config.yaml
        │   └── tlscacerts
        │       └── tlsca.org2.example.com-cert.pem
        ├── peers
        │   ├── peer0.org2.example.com
        │   │   ├── msp
        │   │   │   ├── admincerts
        │   │   │   ├── cacerts
        │   │   │   │   └── ca.org2.example.com-cert.pem
        │   │   │   ├── config.yaml
        │   │   │   ├── keystore
        │   │   │   │   └── priv_sk
        │   │   │   ├── signcerts
        │   │   │   │   └── peer0.org2.example.com-cert.pem
        │   │   │   └── tlscacerts
        │   │   │       └── tlsca.org2.example.com-cert.pem
        │   │   └── tls
        │   │       ├── ca.crt
        │   │       ├── server.crt
        │   │       └── server.key
        │   └── peer1.org2.example.com
        │       ├── msp
        │       │   ├── admincerts
        │       │   ├── cacerts
        │       │   │   └── ca.org2.example.com-cert.pem
        │       │   ├── config.yaml
        │       │   ├── keystore
        │       │   │   └── priv_sk
        │       │   ├── signcerts
        │       │   │   └── peer1.org2.example.com-cert.pem
        │       │   └── tlscacerts
        │       │       └── tlsca.org2.example.com-cert.pem
        │       └── tls
        │           ├── ca.crt
        │           ├── server.crt
        │           └── server.key
        ├── tlsca
        │   ├── priv_sk
        │   └── tlsca.org2.example.com-cert.pem
        └── users
            ├── Admin@org2.example.com
            │   ├── msp
            │   │   ├── admincerts
            │   │   ├── cacerts
            │   │   │   └── ca.org2.example.com-cert.pem
            │   │   ├── config.yaml
            │   │   ├── keystore
            │   │   │   └── priv_sk
            │   │   ├── signcerts
            │   │   │   └── Admin@org2.example.com-cert.pem
            │   │   └── tlscacerts
            │   │       └── tlsca.org2.example.com-cert.pem
            │   └── tls
            │       ├── ca.crt
            │       ├── client.crt
            │       └── client.key
            └── User1@org2.example.com
                ├── msp
                │   ├── admincerts
                │   ├── cacerts
                │   │   └── ca.org2.example.com-cert.pem
                │   ├── config.yaml
                │   ├── keystore
                │   │   └── priv_sk
                │   ├── signcerts
                │   │   └── User1@org2.example.com-cert.pem
                │   └── tlscacerts
                │       └── tlsca.org2.example.com-cert.pem
                └── tls
                    ├── ca.crt
                    ├── client.crt
                    └── client.key

125 directories, 117 files
```

## 生成系统通道初始区块

> 可以使用 `configtxgen` 工具生成，生成过程依赖 `config` 目录下的`configtx.yaml` 配置文件，`configtx.yaml` 配置文件定义了整个网络中的相关配置和拓扑结构信息 。

编辑 `configtx.yaml`

- 修改 `Organizations` 数组下的第一项 `\- &SampleOrg` 为自己定义的排序组织 `\- &OrdererOrg`，同时修改该字段下的： 

  - `Name` 为 `OrdererOrg`

  - `ID` 为 `OrdererMSP`

  - `MSPDIR` 为上一步中生成的身份文件中排序组织的 `msp `目录 `/root/project/my-fabric/crypto-config/ordererOrganizations/example.com/msp`

  - `Policies` 下的 `*.Rule: "OR('SampleOrg.member')" `中的 `SampleOrg` 修改为`ID`： `"OR('OrdererMSP.member')”`

  - `OrdererEndpoints` 数组修改为：order 节点的 `{hostname}.{domin}:{port}`：

    ```bash
    OrdererEndpoints:
                - "orderer0.example.com:7050"
                - "orderer1.example.com:8050"
                - "orderer2.example.com:9050"
    ```

    ==注：单机环境下模拟多节点须区别端口号==

  - 将锚点节点 `AnchorPeers` 注释

- 根据 `OrdererOrg` 的配置，在 `Organizations` 数组下新增 `Org1`，`Org2` 节点

  ```yaml
  - &Org1
  
          Name: Org1MSP
          ID: Org1MSP
          MSPDir: /root/project/my-fabric/crypto-config/peerOrganizations/org1.example.com/msp
          Policies:
              Readers:
                  Type: Signature
                  Rule: "OR('Org1MSP.admin', 'Org1MSP.peer', 'Org1MSP.client')"
              Writers:
                  Type: Signature
                  Rule: "OR('Org1MSP.admin', 'Org1MSP.client')"
              Admins:
                  Type: Signature
                  Rule: "OR('Org1MSP.admin')"
              Endorsement:
                  Type: Signature
                  Rule: "OR('Org1MSP.peer')"
          AnchorPeers:
              - Host: peer0.org1.example.com
                Port: 7051
  
  
      - &Org2
  
          Name: Org2MSP
          ID: Org2MSP
          MSPDir: /root/project/my-fabric/crypto-config/peerOrganizations/org2.example.com/msp
          Policies:
              Readers:
                  Type: Signature
                  Rule: "OR('Org2MSP.admin', 'Org2MSP.peer', 'Org2MSP.client')"
              Writers:
                  Type: Signature
                  Rule: "OR('Org2MSP.admin', 'Org2MSP.client')"
              Admins:
                  Type: Signature
                  Rule: "OR('Org2MSP.admin')"
              Endorsement:
                  Type: Signature
                  Rule: "OR('Org2MSP.peer')"
          AnchorPeers:
              - Host: peer0.org2.example.com
                Port: 9051
  ```

  ==注：单机环境下模拟连个组织须区别端口号==

- `Orderer` 配置项下：

  -  `OrdererType` 为 `etcdraft`

  - `Addresses`  为 `OrdererEndpoints` 数组

  - `EtcdRaft.Consenters` 数组的 `Host`、`Port`，根据 `OrdererEndpoints` 修改，`ClientTLSCert`、`ServerTLSCert` 为：身份文件中每个排序节点的 `tls/server.crt` 文件的目录：

    ```yaml
    EtcdRaft:
            # The set of Raft replicas for this network. For the etcd/raft-based
            # implementation, we expect every replica to also be an OSN. Therefore,
            # a subset of the host:port items enumerated in this list should be
            # replicated under the Orderer.Addresses key above.
            Consenters:
                - Host: orderer0.example.com
                  Port: 7050
                  ClientTLSCert: /root/project/my-fabric/crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/tls/server.crt
                  ServerTLSCert: /root/project/my-fabric/crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/tls/server.crt
                - Host: orderer1.example.com
                  Port: 8050
                  ClientTLSCert: /root/project/my-fabric/crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/server.crt
                  ServerTLSCert: /root/project/my-fabric/crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/server.crt
                - Host: orderer2.example.com
                  Port: 9050
                  ClientTLSCert: /root/project/my-fabric/crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/server.crt
                  ServerTLSCert: /root/project/my-fabric/crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/server.crt
    ```

- 修改 `Profiles` 配置

  ```yaml
  Profiles:
      TwoOrgsOrdererGenesis:
          <<: *ChannelDefaults
          Orderer:
              <<: *OrdererDefaults
              Organizations:
                  - *OrdererOrg
              Capabilities:
                  <<: *OrdererCapabilities
          Consortiums:
              SampleConsortium:
                  Organizations:
                      - *Org1
                      - *Org2
  
      TwoOrgsChannel:
          Consortium: SampleConsortium
          <<: *ChannelDefaults
          Application:
              <<: *ApplicationDefaults
              Organizations:
                  - *Org1
                  - *Org2
              Capabilities:
                  <<: *ApplicationCapabilities
  ```

完整配置文件[configtx.yaml](https://mydoc-pics.oss-cn-chengdu.aliyuncs.com/fabric-config/configtx.yaml) 

生成创世区块：

```bash
./configtxgen -configPath ../config  -profile TwoOrgsOrdererGenesis -channelID fabric-channel -outputBlock ../channel-artifacts/orderer.genesis.block
```

生成通道文件：

```bash
./configtxgen -configPath ../config  -profile TwoOrgsChannel  -channelID businesschannel -outputCreateChannelTx ../channel-artifacts/businesschannel.tx
```

生成锚节点配置更新文件：

```bash
./configtxgen -configPath ../config  -profile TwoOrgsChannel -channelID businesschannel -asOrg Org1MSP -outputAnchorPeersUpdate ../channel-artifacts/Org1MSPanchors.tx

./configtxgen -configPath ../config  -profile TwoOrgsChannel -channelID businesschannel -asOrg Org2MSP -outputAnchorPeersUpdate ../channel-artifacts/Org2MSPanchors.tx
```

```bash
channel-artifacts/
├── businesschannel.tx
├── orderer.genesis.block
├── Org1MSPanchors.tx
└── Org2MSPanchors.tx
```
