---
title: Fabric Gateway 的使用
---

# Hyperledger Fabric Java App Demo

编写一个应用程序来连接到 fabrc 网络中，通过调用智能合约来访问账本.

![up-964e9b99aa624354f13c3dbfcfc042143e9](http://mydoc-pics.oss-cn-chengdu.aliyuncs.com/img/up-964e9b99aa624354f13c3dbfcfc042143e9.png)

## fabric gateway

fabric gateway 有两个项目，一个是 [fabric-gateway-java](https://www.oschina.net/action/GoToLink?url=https%3A%2F%2Fgithub.com%2Fhyperledger%2Ffabric-gateway-java) , 一个是 [fabric-gateway](https://www.oschina.net/action/GoToLink?url=https%3A%2F%2Fgithub.com%2Fhyperledger%2Ffabric-gateway)。

`fabric-gateway-java` 是比较早的项目，使用起来较为麻烦需要提供一个 `connection.json` 配置文件，该配置文件中要详细配置网络中的各个节点的信息。

`fabric-gateway` 使用起来较为简单，不在需要 `connection.json` 配置文件，只需要指定网络中的一个节点连接就可以了。

fabric 官方建议如果是 fabrc 2.4 或者之后的版本建议使用 `fabric-gateway`。

![up-d56ccf8735f175677173250066eb5204288](http://mydoc-pics.oss-cn-chengdu.aliyuncs.com/img/up-d56ccf8735f175677173250066eb5204288.png)

> 本篇内容基于 `fabric-gateway` 讲解，fabric 版本 v2.4.1

## 使用 fabric-gateway

Fabric Gateway 是 Hyperledger Fabric 区块链网络的核心组件，代表客户端应用程序协调提交事务和查询分类账状态所需的操作。通过使用 Gateway，客户端应用程序只需要连接到 Fabric 网络中的单个端点。

官方示例： [https://github.com/hyperledger/fabric-samples/tree/main/asset-transfer-events](https://www.oschina.net/action/GoToLink?url=https%3A%2F%2Fgithub.com%2Fhyperledger%2Ffabric-samples%2Ftree%2Fmain%2Fasset-transfer-events) [https://github.com/hyperledger/fabric-samples/tree/main/asset-transfer-basic](https://www.oschina.net/action/GoToLink?url=https%3A%2F%2Fgithub.com%2Fhyperledger%2Ffabric-samples%2Ftree%2Fmain%2Fasset-transfer-basic)

视频教程演示[项目](https://gitee.com/xz_xie/hyperledger-fabric-app-java-demo.git)

### fabric-gateway 依赖

```xml
<dependency>
	<groupId>org.hyperledger.fabric</groupId>
	<artifactId>fabric-gateway</artifactId>
	<version>1.0.1</version>
</dependency>
```

### 连接 fabric 网络

`application.properties` 配置文件：

```properties
# 应用名称
spring.application.name=hyperledger-fabric-app-java-demo
# 应用服务 WEB 访问端口
server.port=8080

fabric.networkConnectionConfigPath=src/main/resources/org1ProdNetworkConnection.json
fabric.mspId=Org1MSP
fabric.certificatePath=src/main/resources/crypto-config/prod-network/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem
fabric.privateKeyPath=src/main/resources/crypto-config/prod-network/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore/priv_sk
fabric.tlsCertPath=src/main/resources/crypto-config/prod-network/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
fabric.channel=businesschannel

logging.level.org.hyperledger=trace
```

> `src/main/resources/crypto-config/prod-network` 路径下存放的是身份信息文件，需要复制在 [部署 Fabric 生产网络](./1_部署 Fabric 生产网络.md) 中生成的身份信息文件（`crypto-config` 目录下）的文件到该目录

> `org1ProdNetworkConnection.json` 连接配置文件中，需要修改 `url` 中的主机和端口号，或者在本地 hosts 文件中写入 Fabric 网络中所有节点的主机与 IP 映射关系

## 初始化 Gateway , Network , Contract 对象

```java
import io.grpc.ManagedChannel;
import io.grpc.netty.shaded.io.grpc.netty.GrpcSslContexts;
import io.grpc.netty.shaded.io.grpc.netty.NettyChannelBuilder;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hyperledger.fabric.client.CallOption;
import org.hyperledger.fabric.client.Contract;
import org.hyperledger.fabric.client.Gateway;
import org.hyperledger.fabric.client.Network;
import org.hyperledger.fabric.client.identity.Identities;
import org.hyperledger.fabric.client.identity.Signers;
import org.hyperledger.fabric.client.identity.X509Identity;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.PrivateKey;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.concurrent.TimeUnit;

/**
 * author he peng
 * date 2022/1/22 21:21
 */

@Configuration
@AllArgsConstructor
@Slf4j
public class HyperLedgerFabricGatewayConfig {


    final HyperLedgerFabricProperties hyperLedgerFabricProperties;

    @Bean
    public Gateway gateway() throws Exception {


        BufferedReader certificateReader = Files.newBufferedReader(Paths.get(hyperLedgerFabricProperties.getCertificatePath()), StandardCharsets.UTF_8);

        X509Certificate certificate = Identities.readX509Certificate(certificateReader);

        BufferedReader privateKeyReader = Files.newBufferedReader(Paths.get(hyperLedgerFabricProperties.getPrivateKeyPath()), StandardCharsets.UTF_8);

        PrivateKey privateKey = Identities.readPrivateKey(privateKeyReader);

        Gateway gateway = Gateway.newInstance()
                .identity(new X509Identity(hyperLedgerFabricProperties.getMspId() , certificate))
                .signer(Signers.newPrivateKeySigner(privateKey))
                .connection(newGrpcConnection())
                .evaluateOptions(CallOption.deadlineAfter(5, TimeUnit.SECONDS))
                .endorseOptions(CallOption.deadlineAfter(15, TimeUnit.SECONDS))
                .submitOptions(CallOption.deadlineAfter(5, TimeUnit.SECONDS))
                .commitStatusOptions(CallOption.deadlineAfter(1, TimeUnit.MINUTES))
                .connect();

        log.info("=========================================== connected fabric gateway {} " , gateway);

        return gateway;
    }

    private ManagedChannel newGrpcConnection() throws IOException, CertificateException {
        Reader tlsCertReader = Files.newBufferedReader(Paths.get(hyperLedgerFabricProperties.getTlsCertPath()));
        X509Certificate tlsCert = Identities.readX509Certificate(tlsCertReader);

        return NettyChannelBuilder.forTarget("peer0.org1.example.com:7051")
                .sslContext(GrpcSslContexts.forClient().trustManager(tlsCert).build())
                .overrideAuthority("peer0.org1.example.com")
                .build();
    }

    @Bean
    public Network network(Gateway gateway) {
        return gateway.getNetwork(hyperLedgerFabricProperties.getChannel());
    }

    @Bean
    public Contract catContract(Network network) {
        return network.getContract("hyperledger-fabric-contract-java-demo" , "CatContract");
    }

    @Bean
    public ChaincodeEventListener chaincodeEventListener(Network network) {
        return new ChaincodeEventListener(network);
    }
}
```

### 链码事件监听

用来监听交易完成之后通知的事件，事件中可以携带数据。

```java
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base64;
import org.hyperledger.fabric.client.ChaincodeEvent;
import org.hyperledger.fabric.client.CloseableIterator;
import org.hyperledger.fabric.client.Network;

import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.ThreadFactory;

/**
 * @author he peng
 * @date 2022/3/4
 */

@Slf4j
public class ChaincodeEventListener implements Runnable {

    final Network network;

    public ChaincodeEventListener(Network network) {
        this.network = network;

        ScheduledThreadPoolExecutor executor = new ScheduledThreadPoolExecutor(1, new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r);
                thread.setDaemon(true);
                thread.setName(this.getClass() + "chaincode_event_listener");
                return thread;
            }
        });

        executor.execute(this);
    }

    @Override
    public void run() {
        CloseableIterator<ChaincodeEvent> events = network.getChaincodeEvents("hyperledger-fabric-contract-java-demo");
        log.info("chaincodeEvents {} " , events);


        while (events.hasNext()) {
            ChaincodeEvent event = events.next();

            log.info("receive chaincode event {} , block number {} , payload {} "
                    , event.getEventName() , event.getBlockNumber() , JSONArray.toJSONString(Base64.decodeBase64(event.getPayload())));

        }
    }
}
```

## 异步调用合约

```java
    @PutMapping("/async")
    public Map<String, Object> createCatAsync(@RequestBody CatDTO cat) throws Exception {
        Map<String, Object> result = Maps.newConcurrentMap();

        contract.newProposal("createCat")
                .addArguments(cat.getKey(), cat.getName(), String.valueOf(cat.getAge()), cat.getColor(), cat.getBreed())
                .build()
                .endorse()
                .submitAsync();

        result.put("status", "ok");

        return result;
    }
```
