# -*- coding: utf-8 -*-
import io, os, json
DAYS = [
  {
    "day":1, "week":1, "phase":"理论",
    "title":"服务网格是什么 & Istio 全景",
    "goal":"清楚说出 服务网格 解决什么、Istio 控制面/数据面 各是什么。",
    "duration":"2-3h",
    "reading":[
      ["为什么需要服务网格","从 SDK 治理 → Sidecar 治理的演进；关注跨语言、无侵入、统一策略。"],
      ["Istio 架构","控制面 istiod（Pilot/Citadel/Galley 合并）负责 xDS 配置下发、证书签发；数据面 Envoy 代理接管所有出入流量。"],
      ["两种数据面模式","Sidecar 模式（每 Pod 一个 Envoy）与 Ambient 模式（ztunnel + waypoint，L4/L7 分离）。"],
      ["核心 CRD 全景","Gateway / VirtualService / DestinationRule / ServiceEntry / Sidecar / PeerAuthentication / AuthorizationPolicy / Telemetry。"],
      ["生态位对比","与 Linkerd（轻量 Rust）、Consul Connect、Cilium Service Mesh（eBPF）对比要点。"]
    ],
    "diagram":"Client → Ingress Gateway (Envoy) → Sidecar (Envoy) ⇄ App → Sidecar → Egress Gateway → 外部\\n         ↑ mTLS ↑\\n         xDS ← istiod（证书 + 配置）",
    "tasks":[
      "画一张自己的 Istio 架构图（控制面 + 数据面 + 一个业务 Pod）",
      "整理 8 个核心 CRD 各一句话解释，存到笔记",
      "阅读官方 Concepts：Traffic Management / Security / Observability 各一节"
    ],
    "refs":[
      ["Istio Concepts","https://istio.io/latest/docs/concepts/"],
      ["Ambient Mesh Overview","https://istio.io/latest/docs/ambient/overview/"]
    ]
  },
  {
    "day":2, "week":1, "phase":"实战",
    "title":"环境准备 & 安装 Istio",
    "goal":"在本地 kind/minikube 集群装好 Istio（demo profile），能进入 Bookinfo 前置状态。",
    "duration":"3h",
    "reading":[
      ["集群选型","优先 kind（多节点 + Loadbalancer via cloud-provider-kind）或 minikube（tunnel 简单）。生产可用 GKE/ACK/EKS/自建。"],
      ["安装方式","istioctl（学习首选） / Helm（生产） / Operator（旧，已 deprecated）。"],
      ["Profile","demo（含全部组件+样本），default（生产最小），ambient（Ambient 模式）。"]
    ],
    "code":[
      ["创建 kind 集群","kind create cluster --name mesh --config - <<EOF\\nkind: Cluster\\napiVersion: kind.x-k8s.io/v1alpha4\\nnodes:\\n  - role: control-plane\\n  - role: worker\\n  - role: worker\\nEOF"],
      ["下载 istioctl","curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.24.0 sh -\\nexport PATH=$PWD/istio-1.24.0/bin:$PATH\\nistioctl version"],
      ["安装（demo profile）","istioctl install --set profile=demo -y\\nkubectl -n istio-system get pods"],
      ["为默认命名空间开启 sidecar 自动注入","kubectl label namespace default istio-injection=enabled"]
    ],
    "tasks":[
      "istioctl version 输出无 error",
      "istio-system 下 istiod、istio-ingressgateway、istio-egressgateway 全部 Running",
      "kubectl get mutatingwebhookconfiguration 看到 istio-sidecar-injector"
    ],
    "gotchas":[
      "Windows/WSL2 网络：LoadBalancer 类型 SVC 拿不到 EXTERNAL-IP 时用 kubectl port-forward 代替",
      "版本对齐：istioctl 与 istiod 主次版本差不要超过 1"
    ],
    "refs":[
      ["Getting Started","https://istio.io/latest/docs/setup/getting-started/"],
      ["Install with istioctl","https://istio.io/latest/docs/setup/install/istioctl/"]
    ]
  },
  {
    "day":3, "week":1, "phase":"实战",
    "title":"Bookinfo & Sidecar 注入原理",
    "goal":"跑起 Bookinfo，理解 Sidecar 是怎么被塞进 Pod 的、流量如何劫持。",
    "duration":"2-3h",
    "reading":[
      ["Bookinfo 拓扑","productpage → details, reviews (v1/v2/v3) → ratings；跨语言（py/java/node/ruby）适合演示网格。"],
      ["Sidecar 注入机制","kube-apiserver Mutating Webhook 拦截 Pod 创建 → istio-sidecar-injector 插入 istio-init（iptables 重定向）+ istio-proxy 容器。"],
      ["iptables 规则","istio-init 用 iptables 把所有入站/出站流量 REDIRECT 到 15006/15001 端口，交给 Envoy。"]
    ],
    "code":[
      ["部署 Bookinfo","kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml\\nkubectl get pods  # 每个 pod 应显示 2/2"],
      ["暴露入口","kubectl apply -f samples/bookinfo/networking/bookinfo-gateway.yaml\\nistioctl analyze"],
      ["查看 sidecar 配置","kubectl exec deploy/productpage-v1 -c istio-proxy -- pilot-agent request GET config_dump | jq '.configs[] | keys'"],
      ["查看 iptables","kubectl debug -n default productpage-v1-xxxx -it --image=nicolaka/netshoot -- iptables -t nat -L"]
    ],
    "tasks":[
      "浏览器多次刷新 /productpage，观察 reviews v1/v2/v3 轮询",
      "istioctl proxy-config listeners <pod> 至少看得懂 15006 是入站方向",
      "写一句话：为什么 pod 里有 2 个容器"
    ],
    "refs":[
      ["Bookinfo Application","https://istio.io/latest/docs/examples/bookinfo/"]
    ]
  },
  {
    "day":4, "week":1, "phase":"实战",
    "title":"Gateway + VirtualService + DestinationRule",
    "goal":"能独立配置南北向入口 + 内部 subset 路由。",
    "duration":"3h",
    "reading":[
      ["Gateway","描述边缘 L4-L7 监听器（协议/端口/主机名/TLS）。绑定 istio-ingressgateway Pod。"],
      ["VirtualService","路由规则：match（host/path/header）→ route（destination + weight）。作用于 mesh 内部 or 边缘。"],
      ["DestinationRule","目标策略：subset（版本切片）、trafficPolicy（loadBalancer/tls/connectionPool/outlierDetection）。"]
    ],
    "code":[
      ["为 reviews 定义 3 个 subset","apiVersion: networking.istio.io/v1\\nkind: DestinationRule\\nmetadata: { name: reviews }\\nspec:\\n  host: reviews\\n  subsets:\\n  - { name: v1, labels: { version: v1 } }\\n  - { name: v2, labels: { version: v2 } }\\n  - { name: v3, labels: { version: v3 } }"],
      ["默认全走 v1","apiVersion: networking.istio.io/v1\\nkind: VirtualService\\nmetadata: { name: reviews }\\nspec:\\n  hosts: [ reviews ]\\n  http:\\n  - route:\\n    - destination: { host: reviews, subset: v1 }"]
    ],
    "tasks":[
      "所有请求只落到 reviews v1（无星）",
      "把 hosts 改成 productpage 观察对比",
      "用 istioctl proxy-config routes <productpage-pod> 找到刚下发的路由"
    ],
    "refs":[
      ["Traffic Management Concepts","https://istio.io/latest/docs/concepts/traffic-management/"]
    ]
  },
  {
    "day":5, "week":1, "phase":"实战",
    "title":"金丝雀发布 · 权重 / Header 路由",
    "goal":"掌握两种最常用的灰度模式：按权重、按用户特征。",
    "duration":"3h",
    "code":[
      ["50/50 v1↔v3 权重","http:\\n- route:\\n  - { destination: { host: reviews, subset: v1 }, weight: 50 }\\n  - { destination: { host: reviews, subset: v3 }, weight: 50 }"],
      ["按 header 灰度：登录用户走 v2","http:\\n- match:\\n  - headers: { end-user: { exact: jason } }\\n  route: [ { destination: { host: reviews, subset: v2 } } ]\\n- route: [ { destination: { host: reviews, subset: v1 } } ]"],
      ["按 URI 前缀 + 重写","match: [ { uri: { prefix: /api/v2/ } } ]\\nrewrite: { uri: / }\\nroute: [ { destination: { host: api, subset: v2 } } ]"]
    ],
    "tasks":[
      "以 jason 登录后 reviews 稳定 v2；匿名访问 v1/v3 各半",
      "画一张灰度决策流程图：Header → Weight → 默认",
      "写脚本 for i in $(seq 100); do curl -s ... /productpage; done 用 grep 统计版本比例"
    ],
    "gotchas":[
      "同一 host 只允许一个 VirtualService（多个会 merge，顺序不定，容易踩坑）",
      "权重必须整数之和 100"
    ]
  },
  {
    "day":6, "week":1, "phase":"实战",
    "title":"弹性：超时 / 重试 / 熔断 / 故障注入",
    "goal":"用配置而不是代码实现常见容错。",
    "duration":"3h",
    "reading":[
      ["timeout","VirtualService.route.timeout：整条上游请求超时。"],
      ["retries","attempts + perTryTimeout + retryOn=5xx,reset,connect-failure。谨慎重试非幂等接口。"],
      ["熔断","DestinationRule.trafficPolicy.outlierDetection：连续 N 次 5xx 从池中弹出。"],
      ["fault injection","http.fault.delay / abort：混沌工程入门。"]
    ],
    "code":[
      ["超时 500ms + 重试 3 次","http:\\n- route: [ { destination: { host: ratings } } ]\\n  timeout: 0.5s\\n  retries: { attempts: 3, perTryTimeout: 200ms, retryOn: 5xx }"],
      ["熔断","spec:\\n  host: ratings\\n  trafficPolicy:\\n    connectionPool: { tcp: { maxConnections: 1 }, http: { http1MaxPendingRequests: 1, maxRequestsPerConnection: 1 } }\\n    outlierDetection: { consecutive5xxErrors: 5, interval: 30s, baseEjectionTime: 30s }"],
      ["注入 5s 延迟到 50% 请求","http:\\n- fault:\\n    delay: { percentage: { value: 50 }, fixedDelay: 5s }\\n  route: [ { destination: { host: ratings } } ]"]
    ],
    "tasks":[
      "用 fortio 压 ratings 触发熔断，观察 istio_requests_total{response_code=\\\"503\\\"}",
      "对 productpage 注入 abort 500，验证 UI 报错但不雪崩到 reviews"
    ]
  },
  {
    "day":7, "week":1, "phase":"复盘 · 小项目",
    "title":"Week1 复盘 · 迷你项目 canary-shop",
    "goal":"独立完成一个 3 服务微店，实现完整流量治理。",
    "duration":"半天",
    "project":{
      "name":"canary-shop",
      "arch":"frontend → order (v1/v2) → payment",
      "requirements":[
        "为 order v2 做 10% 灰度",
        "登录 header user=vip 强制走 v2",
        "payment 超时 300ms、重试 2 次、5xx 熔断",
        "对 order v2 注入 20% abort 500，验证 frontend 降级"
      ],
      "deliverables":[
        "install.sh + 所有 yaml",
        "README 里贴 istioctl proxy-config routes 结果",
        "压测截图（用 hey / fortio / vegeta 任一）"
      ]
    },
    "tasks":[
      "完成 canary-shop，推 GitHub",
      "对 Week1 每个 CRD 写 3 行速查笔记"
    ]
  },
  {
    "day":8, "week":2, "phase":"理论+实战",
    "title":"零信任第一步 · mTLS",
    "goal":"理解 PeerAuthentication vs DestinationRule.TLS，把网格调成 STRICT。",
    "duration":"3h",
    "reading":[
      ["mTLS 双向","客户端 & 服务端都用 SPIFFE 身份证书（istiod 签发，24h 轮转）互相验证。"],
      ["PeerAuthentication","服务器侧策略：PERMISSIVE（明文+mTLS 都收）/ STRICT（仅 mTLS）/ DISABLE。"],
      ["DestinationRule TLS","客户端侧告诉 Envoy 用 ISTIO_MUTUAL 还是 SIMPLE/DISABLE。"],
      ["排查","istioctl authn tls-check <pod> <svc>：看是否双端一致，PERMISSIVE 是安全迁移期的桥。"]
    ],
    "code":[
      ["网格全局 STRICT","apiVersion: security.istio.io/v1\\nkind: PeerAuthentication\\nmetadata: { name: default, namespace: istio-system }\\nspec:\\n  mtls: { mode: STRICT }"],
      ["某个 ns 允许明文（迁移期）","apiVersion: security.istio.io/v1\\nkind: PeerAuthentication\\nmetadata: { name: default, namespace: legacy }\\nspec:\\n  mtls: { mode: PERMISSIVE }"]
    ],
    "tasks":[
      "网格外用 kubectl exec busybox curl http://productpage:9080 → STRICT 后应失败",
      "istioctl x describe pod <pod> 看到 mTLS 状态"
    ]
  },
  {
    "day":9, "week":2, "phase":"实战",
    "title":"授权 · AuthorizationPolicy & JWT",
    "goal":"落地最小权限：谁能访问谁的哪个方法。",
    "duration":"3h",
    "reading":[
      ["AuthorizationPolicy","action=ALLOW/DENY/CUSTOM/AUDIT；from(source)+to(operation)+when(条件)三段式。默认 allow-by-default，出现同 ns 任意 ALLOW 后变 deny-by-default。"],
      ["RequestAuthentication","声明允许的 JWT 发行方与 JWKS。校验通过的 claim 可用于 AuthorizationPolicy.when。"],
      ["常见坑","忘了给 istio-ingressgateway 一条 ALLOW → 全站 403；namespace 选择错。"]
    ],
    "code":[
      ["拒绝所有，然后按需放行","kind: AuthorizationPolicy\\nmetadata: { name: default-deny, namespace: prod }\\nspec: {}   # empty spec = deny all"],
      ["允许 frontend → order","spec:\\n  selector: { matchLabels: { app: order } }\\n  action: ALLOW\\n  rules:\\n  - from: [ { source: { principals: [\"cluster.local/ns/prod/sa/frontend\"] } } ]\\n    to:   [ { operation: { methods: [GET, POST], paths: [/api/orders/*] } } ]"],
      ["JWT 校验 + claim 授权","kind: RequestAuthentication\\nspec:\\n  jwtRules: [{ issuer: \"https://auth.example.com\", jwksUri: \"https://auth.example.com/.well-known/jwks.json\" }]\\n---\\nkind: AuthorizationPolicy\\nspec:\\n  action: ALLOW\\n  rules: [{ when: [{ key: request.auth.claims[role], values: [admin] }] }]"]
    ],
    "tasks":[
      "关掉 frontend→order 的 SA 后应 RBAC:access denied",
      "curl 带无效 JWT 应 401；带 role=admin 应 200"
    ]
  },
  {
    "day":10, "week":2, "phase":"实战",
    "title":"可观测性三件套 · Prometheus / Grafana / Kiali / Jaeger",
    "goal":"能查 QPS/延迟/错误率、能看拓扑图、能拉出一条 trace。",
    "duration":"半天",
    "reading":[
      ["Golden Signals","流量 istio_requests_total；错误率 code!~\"2..\" 占比；延迟 istio_request_duration_milliseconds_bucket；饱和度看 Envoy CPU/内存。"],
      ["Kiali","实时拓扑 + 配置健康 + 流量图叠加。"],
      ["Jaeger/Tempo","分布式追踪，需业务传递 b3 / w3c traceparent header。"],
      ["Telemetry API","比旧的 EnvoyFilter 更干净的方式配置采样率、tag、access log。"]
    ],
    "code":[
      ["装 addons（demo profile 已含 samples）","kubectl apply -f samples/addons/  # prometheus/grafana/kiali/jaeger\\nistioctl dashboard kiali"],
      ["设置 100% 采样","kind: Telemetry\\nmetadata: { name: mesh-default, namespace: istio-system }\\nspec:\\n  tracing: [ { randomSamplingPercentage: 100.0 } ]"]
    ],
    "tasks":[
      "Kiali 里看到 Bookinfo 完整拓扑，边上有 QPS/错误率",
      "Grafana 打开 Istio Service Dashboard，认识 P50/P90/P99",
      "从 Jaeger 里找到一条 productpage → reviews → ratings 的 trace"
    ]
  },
  {
    "day":11, "week":2, "phase":"进阶",
    "title":"多集群 & Egress · ServiceEntry / Sidecar",
    "goal":"能把外部依赖纳入网格治理，能规划多集群拓扑。",
    "duration":"3-4h",
    "reading":[
      ["Egress 三选一","1) 直接放行（默认 REGISTRY_ONLY 关闭时）；2) ServiceEntry 声明后走 sidecar 直连；3) 通过 Egress Gateway 集中出口（合规/审计）。"],
      ["ServiceEntry","把外部服务（api.stripe.com）注册到网格 registry，就能给它挂 VirtualService/DestinationRule。"],
      ["Sidecar CRD","限制某 ns 的 Envoy 只监听/发现自己 ns + 白名单，显著降内存。"],
      ["多集群","Primary-Remote / Multi-Primary / External Control Plane 三种模式；跨集群靠 East-West Gateway + shared root CA。"]
    ],
    "code":[
      ["注册外部 API","kind: ServiceEntry\\nspec:\\n  hosts: [ api.stripe.com ]\\n  ports: [ { number: 443, name: https, protocol: HTTPS } ]\\n  resolution: DNS\\n  location: MESH_EXTERNAL"],
      ["强制走 Egress Gateway","# 略：VirtualService 把去 api.stripe.com 的流量 route 到 istio-egressgateway，再由 gateway 侧另一条 VS 转发到外网"]
    ],
    "tasks":[
      "为 api.github.com 建 ServiceEntry，加 5s 超时",
      "配一条 Sidecar CRD 让默认 ns 只发现 default + istio-system，看 Envoy 内存下降"
    ]
  },
  {
    "day":12, "week":2, "phase":"前沿",
    "title":"Ambient Mode 深入（ztunnel + waypoint）",
    "goal":"清楚 Ambient 与 Sidecar 的取舍，能装能跑一个最小示例。",
    "duration":"3h",
    "reading":[
      ["为什么 Ambient","Sidecar 有资源/生命周期/升级/协议识别等痛点。Ambient 把 L4（mTLS+身份）下沉到节点级 ztunnel（Rust），L7 策略放到按需部署的 waypoint proxy。"],
      ["ztunnel","DaemonSet，每个节点一个，用 HBONE (HTTP CONNECT over mTLS) 隧道点对点转发。"],
      ["waypoint","按 ServiceAccount / namespace 部署的 Gateway 类型资源，只有需要 L7 策略时才创建。"],
      ["取舍","Ambient 省内存、无 Pod 重启升级；但 L7 策略走 waypoint 会额外一跳，且部分 EnvoyFilter 用法不支持。"]
    ],
    "code":[
      ["安装 Ambient","istioctl install --set profile=ambient --skip-confirmation\\nkubectl label ns default istio.io/dataplane-mode=ambient"],
      ["为 reviews 加 waypoint（要 L7 策略时）","istioctl waypoint apply --enroll-namespace --namespace default"]
    ],
    "tasks":[
      "对比同一个 Bookinfo 分别用 Sidecar 和 Ambient 部署时的 Pod 数、总内存",
      "在 Ambient 下加一条 AuthorizationPolicy（L7 path 匹配），确认 waypoint 是否被创建"
    ],
    "refs":[
      ["Ambient Getting Started","https://istio.io/latest/docs/ambient/getting-started/"]
    ]
  },
  {
    "day":13, "week":2, "phase":"生产",
    "title":"生产运维 · 升级 / 性能 / 排障",
    "goal":"具备把 Istio 落到生产的操作手感和排障套路。",
    "duration":"半天",
    "reading":[
      ["Revisions 升级","canary 升级：istioctl install --set revision=1-24-0 → 给 ns 打 istio.io/rev=1-24-0 label → 滚动重启工作负载 → 卸载旧 revision。避免 in-place 全量替换。"],
      ["性能开销","Envoy sidecar 通常 100-200MB / 0.1-0.5 vCPU per pod。降开销：Sidecar CRD 收敛、关闭不用的 filter、Telemetry 采样调低、考虑 Ambient。"],
      ["排障套路","1) istioctl analyze；2) istioctl proxy-status（xDS 是否同步 SYNCED）；3) istioctl proxy-config listeners/routes/clusters/endpoints <pod>；4) kubectl logs -c istio-proxy；5) pilot-agent request GET config_dump | stats。"],
      ["日志级别调优","istioctl proxy-config log <pod> --level debug 只在排障时开，产生海量日志。"]
    ],
    "code":[
      ["查看 xDS 同步状态","istioctl proxy-status"],
      ["某 pod 具体收到的路由","istioctl proxy-config routes <pod> -o json | jq"],
      ["Envoy 统计","kubectl exec <pod> -c istio-proxy -- pilot-agent request GET stats | grep cluster.outbound"]
    ],
    "tasks":[
      "把 Bookinfo 从 revision A 灰度升级到 revision B",
      "故意写错一条 VirtualService（host 不存在），用 istioctl analyze 定位"
    ]
  },
  {
    "day":14, "week":2, "phase":"Capstone",
    "title":"综合项目 · mesh-shop 全链路",
    "goal":"独立设计并交付一个准生产级别微服务，覆盖流量+安全+可观测+发布。",
    "duration":"一天",
    "project":{
      "name":"mesh-shop",
      "arch":"gateway → web → (catalog, cart, order → payment → 3rd-party api)",
      "requirements":[
        "全局 mTLS STRICT，跨 SA 精细 AuthorizationPolicy",
        "web 通过 JWT 校验用户，claim 决定能否访问 /admin",
        "order v2 5% 灰度，登录 vip 用户 100% v2",
        "payment 熔断 + 300ms 超时 + 2 次重试（幂等接口）",
        "3rd-party api 通过 Egress Gateway 出网并记录审计日志",
        "Kiali 拓扑健康、Grafana 有 SLO 面板、Jaeger 能追到 3rd-party",
        "Chaos：注入 5% payment 5xx，验证降级页面出现"
      ],
      "deliverables":[
        "docs/architecture.md + 拓扑图",
        "manifests/ 全部 YAML（可 kustomize / helm）",
        "runbook.md（升级、回滚、常见告警处置）",
        "postmortem 模板：一次故障复盘"
      ]
    },
    "tasks":[
      "完成 mesh-shop 全部验收项",
      "录一个 5 分钟自述视频/文档：架构 → 灰度 → 排障 → 升级"
    ]
  }
]

CHEATSHEET = [
  ["架构", [
    ["控制面","istiod：xDS 下发 + 证书签发 + Sidecar 注入 webhook"],
    ["数据面 (Sidecar)","每 Pod 一个 Envoy，接管 15006(入)/15001(出)"],
    ["数据面 (Ambient)","节点级 ztunnel(L4) + 按需 waypoint(L7)"],
    ["身份","spiffe://cluster.local/ns/<ns>/sa/<sa>，24h 轮转"]
  ]],
  ["流量 CRD 速记", [
    ["Gateway","边缘监听器（host + port + tls）"],
    ["VirtualService","路由：match → route(dest + weight) + timeout/retries/fault"],
    ["DestinationRule","subset + trafficPolicy(tls/lb/circuit-breaker)"],
    ["ServiceEntry","把外部服务加入 mesh registry"],
    ["Sidecar","收敛 Envoy 内存：只发现指定 ns/主机"],
    ["WorkloadEntry","把非 K8s 的 VM 纳入网格"]
  ]],
  ["安全", [
    ["PeerAuthentication","服务端 mTLS 模式：STRICT/PERMISSIVE/DISABLE"],
    ["RequestAuthentication","声明 JWT issuer + JWKS"],
    ["AuthorizationPolicy","ALLOW/DENY，selector + from + to + when"]
  ]],
  ["排障命令", [
    ["istioctl analyze -A","全集群配置静态检查"],
    ["istioctl proxy-status","xDS 是否 SYNCED"],
    ["istioctl proxy-config <listeners|routes|clusters|endpoints> <pod>","查 Envoy 实际配置"],
    ["istioctl x describe pod <pod>","一次性看 mTLS/VS/DR/AP 命中情况"],
    ["istioctl authn tls-check <pod> <svc>","看 client/server mTLS 是否兼容"],
    ["pilot-agent request GET config_dump","导出完整 Envoy 配置"],
    ["pilot-agent request GET stats","Envoy 统计（重试/熔断/断路器计数）"]
  ]],
  ["常见坑", [
    ["同 host 多 VS","会合并，顺序不定 → 只留一个"],
    ["AP 空 spec","= deny all，先加放行再收紧"],
    ["Egress 走不通","检查是不是 REGISTRY_ONLY，需 ServiceEntry"],
    ["Sidecar 起不来","init container OOM/权限，或 iptables 冲突（比如 Cilium）"],
    ["kubectl exec 走不通","STRICT mTLS 下用 kubectl exec 而不是自建 curl pod 才有身份"]
  ]]
]

QUIZ = [
  { "q":"下列哪个不是 istiod 的职责？",
    "opts":["签发 workload mTLS 证书","下发 xDS 配置到 Envoy","在数据面直接转发业务流量","注入 sidecar 到 Pod"],
    "answer":2,
    "why":"istiod 是控制面，业务流量始终由数据面 Envoy 转发。" },
  { "q":"想按 header end-user=jason 灰度到 reviews v2，应组合使用？",
    "opts":["Gateway + DestinationRule","VirtualService(match.headers) + DestinationRule(subset)","AuthorizationPolicy + PeerAuthentication","ServiceEntry + Sidecar"],
    "answer":1,
    "why":"VS 匹配 header 决定路由，DR 定义 v2 subset。" },
  { "q":"PeerAuthentication 设为 STRICT 后，网格外未注入 sidecar 的 Pod curl 网格内服务会？",
    "opts":["正常返回","连接被拒","返回 401","仅 GET 允许"],
    "answer":1,
    "why":"服务端只接受 mTLS，明文连接被 Envoy 拒绝。" },
  { "q":"想让 Envoy 只发现同 ns 和 istio-system 的服务以省内存，用？",
    "opts":["Sidecar CRD","ServiceEntry","EnvoyFilter","Telemetry"],
    "answer":0,
    "why":"Sidecar CRD 的 egress.hosts 用来收敛可见范围。" },
  { "q":"熔断（outlierDetection）配置写在？",
    "opts":["VirtualService","DestinationRule","AuthorizationPolicy","Gateway"],
    "answer":1,
    "why":"outlierDetection 属于 DestinationRule.trafficPolicy。" },
  { "q":"Ambient 模式下负责 L4 mTLS 的组件是？",
    "opts":["每个 Pod 的 sidecar","节点级 ztunnel DaemonSet","waypoint proxy","istio-cni"],
    "answer":1,
    "why":"ztunnel 在节点上以 HBONE 隧道承担 L4 + 身份。" },
  { "q":"生产升级 Istio 推荐的方式是？",
    "opts":["in-place 直接替换 istiod","Revision 金丝雀（新旧共存 + 逐 ns 切换）","关掉所有业务后重装","只升级 istioctl 二进制"],
    "answer":1,
    "why":"revision 升级可回滚、按 ns 灰度、零停机。" },
  { "q":"istioctl proxy-config routes <pod> 主要用来？",
    "opts":["查看 Pod 收到的 Envoy 路由配置","查看 iptables 规则","查看 mTLS 证书","查看 Prometheus 指标"],
    "answer":0,
    "why":"proxy-config 系列都在导出该 Pod 上 Envoy 的实际配置。" }
]

data = "window.ISTIO_DATA = " + json.dumps({"days": DAYS, "cheatsheet": CHEATSHEET, "quiz": QUIZ}, ensure_ascii=False, indent=2) + ";\n"
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "data.js")
with io.open(out, "w", encoding="utf-8", newline="\n") as f:
    f.write(data)
print("wrote", out, os.path.getsize(out), "bytes")
