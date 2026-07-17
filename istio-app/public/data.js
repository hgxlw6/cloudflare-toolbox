window.ISTIO_DATA = {
  "days": [
    {
      "day": 1,
      "week": 1,
      "phase": "理论",
      "title": "服务网格是什么 · Istio 全景与核心资源",
      "duration": "3h",
      "goal": "画出 Istio 架构图；用一句话解释 8 个核心 CRD；讲清 Sidecar 与 Ambient 两种数据面的取舍。",
      "theory": [
        {
          "title": "为什么需要 Service Mesh",
          "body": "微服务面临跨语言治理难题：熔断/重试/mTLS/灰度/追踪 若靠 SDK（Hystrix、Ribbon）落地，会带来多语言维护成本、版本升级困难、业务侵入。Service Mesh 的核心思想是把 L7 治理从应用中剥离，下沉到与应用同生命周期的 Sidecar 代理（或节点级代理），应用只做业务，网络策略由平台声明式下发。Istio 是目前最完整的 CNCF 毕业级实现（2023-07 毕业）。",
          "refs": [
            [
              "What is Istio",
              "https://istio.io/latest/docs/overview/what-is-istio/"
            ]
          ]
        },
        {
          "title": "Istio 控制面 istiod",
          "body": "1.5 起把 Pilot / Citadel / Galley 合并成单一二进制 istiod。它做三件事：① 把用户写的 Istio CRD（Gateway/VirtualService…）翻译成 Envoy 能吃的 xDS 配置并推送到所有 Sidecar；② 作为 CA 为每个工作负载签发 SPIFFE 身份的 mTLS 证书（默认 24h 轮转）；③ 作为 Kubernetes Mutating Admission Webhook，在 Pod 创建时注入 sidecar 容器。",
          "refs": [
            [
              "Architecture",
              "https://istio.io/latest/docs/ops/deployment/architecture/"
            ]
          ]
        },
        {
          "title": "数据面：Envoy Sidecar",
          "body": "每个业务 Pod 里额外跑一个 istio-proxy（Envoy）容器。istio-init 通过 iptables 规则把 Pod 出入站流量透明重定向到 Envoy：入站到 15006，出站到 15001，Envoy 管理端口 15000/15020/15021/15090。所有 L4-L7 治理、mTLS 加解密、指标采集都发生在 Envoy 内部，业务代码零改动。",
          "refs": [
            [
              "Sidecar Injection",
              "https://istio.io/latest/docs/setup/additional-setup/sidecar-injection/"
            ]
          ]
        },
        {
          "title": "数据面：Ambient Mode（1.22 GA）",
          "body": "Ambient 把治理拆成两层：节点级 ztunnel（Rust 编写的 DaemonSet）承担 L4 mTLS + 身份，通过 HBONE（HTTP/2 CONNECT over mTLS）在节点间隧道转发；只有需要 L7 策略（如按 path 授权、header 路由）的 Service/命名空间才按需部署 waypoint proxy（Envoy）。优点：省内存、Pod 无需重启升级、Pod 生命周期与代理解耦；代价：L7 多一跳，部分 EnvoyFilter 高级用法不支持。",
          "refs": [
            [
              "Ambient Overview",
              "https://istio.io/latest/docs/ambient/overview/"
            ]
          ]
        },
        {
          "title": "八个必会 CRD",
          "body": "① **Gateway**：边缘监听器（host+port+tls）；② **VirtualService**：路由规则（match/route/weight/timeout/retries/fault）；③ **DestinationRule**：目标策略（subset/loadBalancer/connectionPool/outlierDetection/tls）；④ **ServiceEntry**：把外部服务注册进网格 registry；⑤ **Sidecar**：收敛某 ns 的 Envoy 可见范围以省内存；⑥ **PeerAuthentication**：服务端 mTLS 模式（STRICT/PERMISSIVE/DISABLE）；⑦ **RequestAuthentication**：声明可信 JWT issuer + JWKS；⑧ **AuthorizationPolicy**：ALLOW/DENY/CUSTOM/AUDIT + selector+from+to+when。此外常用 **Telemetry**（采样率/tag）与 **WorkloadEntry**（把 VM 纳入网格）。",
          "refs": [
            [
              "Traffic Management APIs",
              "https://istio.io/latest/docs/reference/config/networking/"
            ],
            [
              "Security APIs",
              "https://istio.io/latest/docs/reference/config/security/"
            ]
          ]
        }
      ],
      "diagrams": [
        {
          "title": "Istio 整体架构（Sidecar 模式）",
          "mermaid": "flowchart LR\n  subgraph CP[控制面 Control Plane]\n    istiod[[istiod<br/>xDS + CA + Webhook]]\n  end\n  subgraph N1[Node]\n    subgraph P1[Pod A]\n      A[App A]:::app --- EA[Envoy]:::envoy\n    end\n    subgraph P2[Pod B]\n      EB[Envoy]:::envoy --- B[App B]:::app\n    end\n  end\n  Client((Client)) -->|HTTPS| IGW[Ingress Gateway<br/>Envoy]:::envoy\n  IGW -->|mTLS| EA\n  EA -->|mTLS + xDS routes| EB\n  istiod -. xDS .-> IGW\n  istiod -. xDS .-> EA\n  istiod -. xDS .-> EB\n  istiod -. cert 24h .-> EA\n  istiod -. cert 24h .-> EB\n  classDef app fill:#1e3a8a,stroke:#3b82f6,color:#fff\n  classDef envoy fill:#7c3aed,stroke:#a78bfa,color:#fff"
        },
        {
          "title": "Sidecar vs Ambient 对比",
          "mermaid": "flowchart TB\n  subgraph S[Sidecar 模式]\n    direction LR\n    SP1[Pod: App + Envoy]\n    SP2[Pod: App + Envoy]\n    SP1 <-->|mTLS L4+L7| SP2\n  end\n  subgraph A[Ambient 模式]\n    direction LR\n    AP1[Pod: App]\n    AP2[Pod: App]\n    ZT1[[ztunnel<br/>节点L4]]\n    ZT2[[ztunnel<br/>节点L4]]\n    WP[[waypoint<br/>按需L7]]\n    AP1 --- ZT1\n    ZT1 <-->|HBONE mTLS| ZT2\n    ZT2 --- AP2\n    ZT1 -.需要L7时.-> WP\n    WP -.-> ZT2\n  end"
        }
      ],
      "labs": [
        {
          "title": "Lab 1.1 · 认识官方架构（无需集群）",
          "steps": [
            {
              "desc": "在浏览器打开 Istio 官方架构文档，配合右侧图对照本页 Mermaid 图看一遍",
              "cmd": "# 打开：https://istio.io/latest/docs/ops/deployment/architecture/"
            },
            {
              "desc": "打开 CRD Reference 首页，浏览 networking / security / telemetry 三个组的资源清单，记住每个 CRD 的 apiVersion",
              "cmd": "# 打开：https://istio.io/latest/docs/reference/config/"
            }
          ]
        }
      ],
      "tasks": [
        "用自己的话画一张架构图（含 istiod、Envoy、Client、xDS、CA），保存到笔记",
        "写下 8 个核心 CRD 的一句话解释",
        "回答：iptables 把入站流量重定向到 Envoy 哪个端口？（15006）"
      ],
      "gotchas": [
        "别把 Istio 与 Kubernetes Ingress 混为一谈：Ingress 是 K8s 内置的 L7 入口抽象，Istio Gateway 是 Envoy 侧的 L4-L7 监听器声明，两者不共用控制器。",
        "1.5 之前的 Pilot/Citadel/Galley/Mixer 文章已过时，看文档要认准 istiod。Mixer（曾用于 policy/telemetry v1）已在 1.8 移除。"
      ],
      "refs": [
        [
          "Istio Concepts",
          "https://istio.io/latest/docs/concepts/"
        ],
        [
          "Architecture",
          "https://istio.io/latest/docs/ops/deployment/architecture/"
        ],
        [
          "Ambient Overview",
          "https://istio.io/latest/docs/ambient/overview/"
        ]
      ]
    },
    {
      "day": 2,
      "week": 1,
      "phase": "实战",
      "title": "环境准备 · kind 集群 + istioctl 装 Istio",
      "duration": "3h",
      "goal": "拉起一个 3 节点 kind 集群，装好 Istio 1.24 demo profile，所有组件 Running，为 Bookinfo 做准备。",
      "prereq": [
        "Docker Desktop（Windows/Mac）或 Docker Engine（Linux）已装好，`docker ps` 能跑",
        "kubectl v1.28+：https://kubernetes.io/docs/tasks/tools/",
        "kind v0.24+：`go install sigs.k8s.io/kind@latest` 或从 https://kind.sigs.k8s.io/dl/ 下载",
        "至少 4C8G 空闲资源"
      ],
      "theory": [
        {
          "title": "Profile 选谁",
          "body": "istioctl 内置 profile：**default**（生产最小：istiod + ingress gateway）；**demo**（学习首选：额外含 egress gateway、更宽松的资源限制、bookinfo 依赖）；**minimal**（只装 istiod）；**ambient**（Ambient 模式所需组件）；**empty**（占位，从零 IstioOperator 拼装）。学习阶段一律用 demo。",
          "refs": [
            [
              "Configuration Profiles",
              "https://istio.io/latest/docs/setup/additional-setup/config-profiles/"
            ]
          ]
        },
        {
          "title": "istioctl vs Helm",
          "body": "istioctl install 底层是把 IstioOperator CR 展开成一堆 Helm chart 渲染，再直接 Server-Side Apply。生产更推荐 Helm（`istio-base` + `istiod` + `gateway`）：可 GitOps、可 diff、支持 canary revision。学习阶段用 istioctl 一条命令最快。",
          "refs": [
            [
              "Install with istioctl",
              "https://istio.io/latest/docs/setup/install/istioctl/"
            ],
            [
              "Install with Helm",
              "https://istio.io/latest/docs/setup/install/helm/"
            ]
          ]
        },
        {
          "title": "Sidecar 自动注入原理",
          "body": "给 Namespace 打上 `istio-injection=enabled` 标签后，该 ns 下新建的 Pod 会被 MutatingAdmissionWebhook `istio-sidecar-injector` 拦截，插入 istio-init（跑一次性 iptables 规则）+ istio-proxy 容器。已存在的 Pod 不会自动注入，需要 `kubectl rollout restart`。也可用 `istioctl kube-inject -f deploy.yaml` 手动注入到 YAML 中。",
          "refs": [
            [
              "Installing the Sidecar",
              "https://istio.io/latest/docs/setup/additional-setup/sidecar-injection/"
            ]
          ]
        }
      ],
      "diagrams": [
        {
          "title": "安装流程时序图",
          "mermaid": "sequenceDiagram\n  participant U as 你\n  participant K as kubectl\n  participant IC as istioctl\n  participant API as kube-apiserver\n  participant D as istiod\n  U->>IC: istioctl install --set profile=demo\n  IC->>API: apply IstioOperator + CRDs\n  IC->>API: apply Deploy(istiod)\n  API->>D: 启动 istiod Pod\n  D->>API: 注册 MutatingWebhook<br/>istio-sidecar-injector\n  IC->>API: apply Deploy(istio-ingressgateway)<br/>+ egressgateway\n  U->>K: label ns default istio-injection=enabled\n  U->>K: kubectl apply -f bookinfo.yaml\n  API->>D: webhook 调用<br/>istio-sidecar-injector\n  D-->>API: 返回带 sidecar 的 Pod spec\n  API->>API: 创建带 2 容器的 Pod"
        }
      ],
      "labs": [
        {
          "title": "Lab 2.1 · 用 kind 起一个 3 节点集群",
          "steps": [
            {
              "desc": "创建集群配置文件",
              "cmd": "cat > kind-mesh.yaml <<'EOF'\nkind: Cluster\napiVersion: kind.x-k8s.io/v1alpha4\nname: mesh\nnodes:\n  - role: control-plane\n  - role: worker\n  - role: worker\nEOF"
            },
            {
              "desc": "拉起集群（首次会拉镜像，约 2 分钟）",
              "cmd": "kind create cluster --config kind-mesh.yaml"
            },
            {
              "desc": "验证节点就绪",
              "cmd": "kubectl get nodes",
              "expect": "NAME                 STATUS   ROLES           AGE   VERSION\nmesh-control-plane   Ready    control-plane   1m    v1.31.x\nmesh-worker          Ready    <none>          1m    v1.31.x\nmesh-worker2         Ready    <none>          1m    v1.31.x"
            }
          ]
        },
        {
          "title": "Lab 2.2 · 下载 istioctl 1.24",
          "steps": [
            {
              "desc": "Linux/Mac：官方一键脚本",
              "cmd": "curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.24.0 sh -\ncd istio-1.24.0\nexport PATH=$PWD/bin:$PATH"
            },
            {
              "desc": "Windows PowerShell：手动下载",
              "cmd": "Invoke-WebRequest -Uri https://github.com/istio/istio/releases/download/1.24.0/istio-1.24.0-win.zip -OutFile istio.zip\nExpand-Archive istio.zip -DestinationPath .\n$env:Path = \"$PWD\\istio-1.24.0\\bin;\" + $env:Path"
            },
            {
              "desc": "验证版本",
              "cmd": "istioctl version --remote=false",
              "expect": "client version: 1.24.0"
            }
          ]
        },
        {
          "title": "Lab 2.3 · 装 Istio demo profile",
          "steps": [
            {
              "desc": "预检环境（会检查 K8s 版本、必需权限、已有资源冲突）",
              "cmd": "istioctl x precheck",
              "expect": "✔ No issues found when checking the cluster. Istio is safe to install or upgrade."
            },
            {
              "desc": "安装",
              "cmd": "istioctl install --set profile=demo -y",
              "expect": "✔ Istio core installed\n✔ Istiod installed\n✔ Egress gateways installed\n✔ Ingress gateways installed\n✔ Installation complete"
            },
            {
              "desc": "确认所有组件 Running",
              "cmd": "kubectl -n istio-system get pods",
              "expect": "NAME                                    READY   STATUS    RESTARTS\nistio-egressgateway-xxxx                1/1     Running   0\nistio-ingressgateway-xxxx               1/1     Running   0\nistiod-xxxx                             1/1     Running   0"
            },
            {
              "desc": "确认 Webhook 已注册",
              "cmd": "kubectl get mutatingwebhookconfiguration istio-sidecar-injector -o jsonpath='{.webhooks[0].name}'",
              "expect": "rev.namespace.sidecar-injector.istio.io"
            },
            {
              "desc": "为 default ns 开启自动注入",
              "cmd": "kubectl label namespace default istio-injection=enabled"
            },
            {
              "desc": "确认标签生效",
              "cmd": "kubectl get ns default --show-labels",
              "expect": "default   Active   Xm    istio-injection=enabled,kubernetes.io/metadata.name=default"
            }
          ]
        },
        {
          "title": "Lab 2.4 · 生产推荐：Helm 安装（GitOps 友好）",
          "steps": [
            {
              "desc": "添加 Helm 仓库",
              "cmd": "helm repo add istio https://istio-release.storage.googleapis.com/charts\nhelm repo update"
            },
            {
              "desc": "分三段装：base（CRD）→ istiod → gateway。每段都可 diff、可回滚。",
              "cmd": "kubectl create ns istio-system --dry-run=client -o yaml | kubectl apply -f -\nhelm upgrade --install istio-base istio/base -n istio-system --version 1.24.0 --wait\nhelm upgrade --install istiod istio/istiod -n istio-system --version 1.24.0 -f istiod-values.yaml --wait\nkubectl create ns istio-ingress --dry-run=client -o yaml | kubectl apply -f -\nkubectl label ns istio-ingress istio-injection=enabled --overwrite\nhelm upgrade --install istio-ingress istio/gateway -n istio-ingress --version 1.24.0 -f gateway-values.yaml --wait"
            },
            {
              "desc": "生产 istiod-values.yaml 关键项（HA + 资源 + 遥测降噪）",
              "cmd": "# istiod-values.yaml\npilot:\n  autoscaleEnabled: true\n  autoscaleMin: 3           # 至少 3 副本\n  autoscaleMax: 10\n  cpu: { targetAverageUtilization: 60 }\n  replicaCount: 3\n  resources:\n    requests: { cpu: 500m, memory: 2Gi }\n    limits:   { cpu: 2,    memory: 4Gi }\n  env:\n    PILOT_ENABLE_STATUS: \"true\"\n    PILOT_TRACE_SAMPLING: \"1.0\"\n  podAntiAffinity:\n    requiredDuringSchedulingIgnoredDuringExecution:\n    - labelSelector:\n        matchLabels: { app: istiod }\n      topologyKey: kubernetes.io/hostname\nglobal:\n  proxy:\n    resources:\n      requests: { cpu: 100m, memory: 128Mi }\n      limits:   { cpu: 2,    memory: 1Gi }\n    holdApplicationUntilProxyStarts: true   # 关键：等 sidecar ready 才启动业务\nmeshConfig:\n  accessLogFile: /dev/stdout\n  defaultConfig:\n    holdApplicationUntilProxyStarts: true\n    proxyMetadata:\n      ISTIO_META_DNS_CAPTURE: \"true\"\n  enablePrometheusMerge: true"
            },
            {
              "desc": "生产 gateway-values.yaml 关键项",
              "cmd": "# gateway-values.yaml\nreplicaCount: 3\nautoscaling:\n  enabled: true\n  minReplicas: 3\n  maxReplicas: 20\n  targetCPUUtilizationPercentage: 60\nresources:\n  requests: { cpu: 500m, memory: 512Mi }\n  limits:   { cpu: 2,    memory: 2Gi }\nservice:\n  type: LoadBalancer\n  annotations:\n    service.beta.kubernetes.io/aws-load-balancer-type: nlb\npodDisruptionBudget:\n  minAvailable: 2\naffinity:\n  podAntiAffinity:\n    requiredDuringSchedulingIgnoredDuringExecution:\n    - labelSelector:\n        matchLabels: { app: istio-ingressgateway }\n      topologyKey: kubernetes.io/hostname"
            },
            {
              "desc": "GitOps：把这 3 段 helm chart values 放到 argocd Application，Sync=Auto、PruneLast=true、Replace=false",
              "cmd": "# argocd-app-istio.yaml\napiVersion: argoproj.io/v1alpha1\nkind: Application\nmetadata: { name: istio-base, namespace: argocd }\nspec:\n  project: default\n  source:\n    repoURL: git@github.com:you/infra.git\n    path: istio/base\n    helm: { valueFiles: [ values.yaml ] }\n  destination: { server: https://kubernetes.default.svc, namespace: istio-system }\n  syncPolicy:\n    automated: { prune: true, selfHeal: true }\n    syncOptions: [ ServerSideApply=true, CreateNamespace=true ]"
            }
          ]
        }
      ],
      "verify": [
        "`kubectl -n istio-system get pods` 三个组件 READY 全为 1/1",
        "`istioctl version` 同时输出 client 与 control plane 版本，均为 1.24.0",
        "`kubectl get ns default --show-labels` 含 istio-injection=enabled"
      ],
      "tasks": [
        "kind 集群 3 节点全部 Ready",
        "istio-system 下 istiod + ingressgateway + egressgateway 均 Running",
        "istioctl version 客户端与控制面版本一致"
      ],
      "gotchas": [
        "Windows/WSL2 下 kind 集群的 LoadBalancer 类型 Service 拿不到 EXTERNAL-IP，后续通过 `kubectl port-forward` 或安装 `cloud-provider-kind` 补齐；不要因此以为装错了。",
        "istioctl 与 istiod 大小版本差不要超过 1（如 1.24 客户端不要连 1.22 istiod）。",
        "国内下载 istio 二进制慢：把 `https://github.com/...` 换成 `https://ghproxy.com/https://github.com/...`。",
        "生产禁用 profile=demo，它会开启 tracing 100% + 无资源限制 + 过多 addons；使用 default 或 empty + values 覆盖。",
        "holdApplicationUntilProxyStarts=true 是生产必开：避免应用启动瞬间 sidecar 还没准备好导致 503。",
        "istiod 至少 3 副本 + podAntiAffinity 分散节点，避免单 AZ 故障拖垮控制面。"
      ],
      "refs": [
        [
          "Getting Started",
          "https://istio.io/latest/docs/setup/getting-started/"
        ],
        [
          "istioctl Reference",
          "https://istio.io/latest/docs/reference/commands/istioctl/"
        ]
      ]
    },
    {
      "day": 3,
      "week": 1,
      "phase": "实战",
      "title": "Bookinfo 全景 · Sidecar 注入 & 流量劫持原理",
      "duration": "3h",
      "goal": "跑起 Bookinfo，能解释每个 Pod 里为什么有两个容器，能看到 iptables 和 Envoy listener 的实际配置。",
      "theory": [
        {
          "title": "Bookinfo 拓扑",
          "body": "官方示范应用，四个跨语言微服务演示服务网格价值：**productpage**（Python，页面聚合）→ 调用 **details**（Ruby，书籍元数据）和 **reviews**（Java，评论）；**reviews** 有 v1/v2/v3 三版：v1 不带星级，v2 带黑色星（读 ratings），v3 带红色星（读 ratings）；**ratings**（Node.js，评分）。刷新页面可看到 reviews 版本轮询。",
          "refs": [
            [
              "Bookinfo Application",
              "https://istio.io/latest/docs/examples/bookinfo/"
            ]
          ]
        },
        {
          "title": "iptables 流量劫持",
          "body": "istio-init 容器在 Pod 网络命名空间里跑一次 `istio-iptables` 二进制（源自 pkg/cmd/istio-iptables）。它写入 NAT 表 4 条链：**PREROUTING/OUTPUT** 匹配 → **ISTIO_INBOUND/ISTIO_OUTPUT**：所有 TCP 入站 REDIRECT 到本机 15006；所有出站（除 15020/15090 等管理端口、UID=1337 的 Envoy 自身流量避免回环）REDIRECT 到 15001。这样应用完全无感，包却被 Envoy 全接管。",
          "refs": [
            [
              "Traffic Capture",
              "https://istio.io/latest/docs/ops/deployment/architecture/#envoy"
            ]
          ]
        },
        {
          "title": "Envoy 关键端口",
          "body": "**15001** 出站 listener；**15006** 入站 listener；**15000** 管理 API（config_dump/stats/logging）；**15020** pilot-agent 健康检查 + 合并 Prom metrics；**15021** ready 探针（Sidecar/Gateway 通用）；**15090** 原始 Envoy Prom metrics（`/stats/prometheus`）。",
          "refs": [
            [
              "Ports used by Istio",
              "https://istio.io/latest/docs/ops/deployment/application-requirements/#ports-used-by-istio"
            ]
          ]
        },
        {
          "title": "xDS：Envoy 动态配置协议",
          "body": "Envoy 通过 gRPC 长连接向 istiod 拉配置：**LDS**（Listener）、**RDS**（Route）、**CDS**（Cluster）、**EDS**（Endpoint）、**SDS**（Secret / 证书）。istioctl proxy-config 系列命令就是把某个 Pod 上 Envoy 收到的 xDS 快照 dump 出来，是排障核心武器。",
          "refs": [
            [
              "Debugging Envoy and Istiod",
              "https://istio.io/latest/docs/ops/diagnostic-tools/proxy-cmd/"
            ]
          ]
        }
      ],
      "diagrams": [
        {
          "title": "Bookinfo 服务拓扑",
          "mermaid": "flowchart LR\n  User((User)) --> IGW[istio-ingressgateway]\n  IGW --> PP[productpage<br/>python]\n  PP --> DT[details<br/>ruby]\n  PP --> R1[reviews v1<br/>java · no ★]\n  PP --> R2[reviews v2<br/>java · black ★]\n  PP --> R3[reviews v3<br/>java · red ★]\n  R2 --> RT[ratings<br/>node.js]\n  R3 --> RT"
        },
        {
          "title": "Pod 内部流量劫持",
          "mermaid": "flowchart LR\n  subgraph Pod\n    direction TB\n    App[App :9080]\n    Env[Envoy istio-proxy]\n    Init[[istio-init<br/>写 iptables]]\n  end\n  Client[对端] -->|:9080| IPT1{iptables PREROUTING}\n  IPT1 -->|REDIRECT| Env\n  Env -->|localhost:9080| App\n  App -->|出站 request| IPT2{iptables OUTPUT}\n  IPT2 -->|REDIRECT :15001| Env\n  Env -->|mTLS 到对端| OUT[对端 Envoy :15006]\n  Init -. 一次性 .-> IPT1"
        }
      ],
      "labs": [
        {
          "title": "Lab 3.1 · 部署 Bookinfo",
          "steps": [
            {
              "desc": "进入 istio 下载目录（含 samples）",
              "cmd": "cd istio-1.24.0"
            },
            {
              "desc": "部署 Bookinfo（default ns 已开自动注入）",
              "cmd": "kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml"
            },
            {
              "desc": "等所有 Pod 就绪（每个都 2/2 表示 sidecar 注入成功）",
              "cmd": "kubectl get pods -w",
              "expect": "details-v1-xxx        2/2   Running\nproductpage-v1-xxx    2/2   Running\nratings-v1-xxx        2/2   Running\nreviews-v1-xxx        2/2   Running\nreviews-v2-xxx        2/2   Running\nreviews-v3-xxx        2/2   Running"
            },
            {
              "desc": "配置入口 Gateway + VirtualService",
              "cmd": "kubectl apply -f samples/bookinfo/networking/bookinfo-gateway.yaml"
            },
            {
              "desc": "运行静态检查，应无错误",
              "cmd": "istioctl analyze",
              "expect": "✔ No validation issues found when analyzing namespace: default."
            }
          ]
        },
        {
          "title": "Lab 3.2 · 访问 Bookinfo",
          "steps": [
            {
              "desc": "kind 没有 LoadBalancer：用 port-forward 到本地 8080",
              "cmd": "kubectl -n istio-system port-forward svc/istio-ingressgateway 8080:80"
            },
            {
              "desc": "另一个终端连续 curl，观察 reviews 版本轮询",
              "cmd": "for i in 1 2 3 4 5 6; do curl -s http://localhost:8080/productpage | grep -oE 'reviews-v[123]|glyphicon-star' | head -3; echo '---'; done"
            },
            {
              "desc": "浏览器打开 http://localhost:8080/productpage 多次刷新，肉眼观察三种星星样式",
              "cmd": "# 无需命令"
            }
          ]
        },
        {
          "title": "Lab 3.3 · 看 iptables 到底做了什么",
          "steps": [
            {
              "desc": "找一个 productpage Pod 名字",
              "cmd": "POD=$(kubectl get pod -l app=productpage -o jsonpath='{.items[0].metadata.name}'); echo $POD"
            },
            {
              "desc": "看 istio-init 的日志（它执行完 iptables 就退出）",
              "cmd": "kubectl logs $POD -c istio-init | head -30"
            },
            {
              "desc": "进入 istio-proxy sidecar 查看当前 NAT 表规则",
              "cmd": "kubectl exec $POD -c istio-proxy -- sh -c 'iptables -t nat -S | head -20'",
              "expect": "-A PREROUTING -p tcp -j ISTIO_INBOUND\n-A OUTPUT -p tcp -j ISTIO_OUTPUT\n-A ISTIO_INBOUND -p tcp --dport 15008 -j RETURN\n-A ISTIO_INBOUND -p tcp -j ISTIO_IN_REDIRECT\n-A ISTIO_IN_REDIRECT -p tcp -j REDIRECT --to-ports 15006\n..."
            }
          ]
        },
        {
          "title": "Lab 3.4 · 看 Envoy 拿到的实际配置",
          "steps": [
            {
              "desc": "查看 xDS 同步状态：CDS/LDS/EDS/RDS 都应 SYNCED",
              "cmd": "istioctl proxy-status",
              "expect": "NAME                                          CDS       LDS       EDS       RDS\nproductpage-v1-xxx.default                    SYNCED    SYNCED    SYNCED    SYNCED\n..."
            },
            {
              "desc": "查看 productpage 上的 Listener（关注 15006 入站）",
              "cmd": "istioctl proxy-config listeners $POD --port 15006"
            },
            {
              "desc": "查看它出方向能到的所有 cluster",
              "cmd": "istioctl proxy-config clusters $POD | head -20"
            },
            {
              "desc": "一站式看该 Pod 的 mTLS / VS / DR / AP 命中",
              "cmd": "istioctl x describe pod $POD"
            }
          ]
        }
      ],
      "verify": [
        "6 个 Bookinfo Pod 全部 2/2 Running",
        "curl 6 次能看到 v1/v2/v3 都出现过",
        "iptables -t nat -S 能看到 REDIRECT --to-ports 15006 与 15001",
        "istioctl proxy-status 全部 4 列 SYNCED"
      ],
      "tasks": [
        "Bookinfo 全部 Pod 2/2 就绪",
        "浏览器能刷出三种星星样式",
        "istioctl proxy-config listeners 能读懂 15006/15001 各自含义",
        "写一句话解释：为什么 Pod 里有 2 个容器"
      ],
      "gotchas": [
        "如果 Pod 是 1/2 未注入，通常是 ns 没打 istio-injection 标签、或 Pod 有 `sidecar.istio.io/inject=false` 注解。",
        "istio-init 需要 NET_ADMIN + NET_RAW 能力；某些安全策略（PSP/PSS restricted）会阻止其运行，改用 istio-cni 插件规避。",
        "`kubectl exec -c istio-proxy -- iptables` 在有些 distroless 镜像下需换成 `nsenter` 或使用 `istioctl proxy-cmd`。"
      ],
      "refs": [
        [
          "Bookinfo Application",
          "https://istio.io/latest/docs/examples/bookinfo/"
        ],
        [
          "proxy-config Reference",
          "https://istio.io/latest/docs/reference/commands/istioctl/#istioctl-proxy-config"
        ]
      ]
    },
    {
      "day": 4,
      "week": 1,
      "phase": "实战",
      "title": "Gateway + VirtualService + DestinationRule 三件套",
      "duration": "3h",
      "goal": "独立完成南北向入口 + 内部 subset 路由；能画出 client -> gateway -> VS -> DR -> subset 的完整链路。",
      "theory": [
        {
          "title": "Gateway：边缘监听器",
          "body": "Gateway 描述 mesh 边界（一般是 istio-ingressgateway Pod）上要开哪些 L4-L7 端口，以及每个端口接哪些 host 与 TLS 配置。它只声明监听，不做路由；路由要靠绑定同 host 的 VirtualService。selector 决定 Gateway 落到哪个网关 Deployment（默认 `istio: ingressgateway`）。",
          "refs": [
            [
              "Gateway API Ref",
              "https://istio.io/latest/docs/reference/config/networking/gateway/"
            ]
          ]
        },
        {
          "title": "VirtualService：路由规则",
          "body": "核心字段：**hosts**（作用域，与 Gateway 匹配才生效于边缘；否则作用于 mesh 内部）、**gateways**（默认包含 `mesh` 即所有 sidecar；写具体 Gateway 名字则只对该边缘 gateway 生效）、**http[].match**（uri/headers/method/queryParams/sourceLabels…）、**http[].route[]**（destination.host + subset + weight）、以及 **timeout / retries / fault / rewrite / redirect / mirror**。规则按数组顺序匹配，第一条命中就 return。",
          "refs": [
            [
              "VirtualService API Ref",
              "https://istio.io/latest/docs/reference/config/networking/virtual-service/"
            ]
          ]
        },
        {
          "title": "DestinationRule：到达之后的策略",
          "body": "VS 决定「去哪」，DR 决定「怎么发」。核心字段：**subsets**（按 pod label 切版本），**trafficPolicy**（loadBalancer 算法 / connectionPool 上限 / outlierDetection 熔断 / tls 客户端 mTLS 模式）。VS 里 `subset: v2` 必须在同 host 的 DR 里预先声明。",
          "refs": [
            [
              "DestinationRule API Ref",
              "https://istio.io/latest/docs/reference/config/networking/destination-rule/"
            ]
          ]
        },
        {
          "title": "host 解析规则",
          "body": "VS/DR 里的 host 短名（如 `reviews`）会按当前资源所在 ns 拼成 FQDN `reviews.<ns>.svc.cluster.local`。跨 ns 一定要写全 FQDN，否则会误命中。**exportTo** 字段控制资源可被哪些 ns 消费，默认 `*`。",
          "refs": [
            [
              "Traffic Management Concepts",
              "https://istio.io/latest/docs/concepts/traffic-management/"
            ]
          ]
        }
      ],
      "diagrams": [
        {
          "title": "请求链路：Client → Envoy 侧内部数据流",
          "mermaid": "flowchart LR\n  C((Client)) --> IGW[Gateway<br/>80/443 监听]\n  IGW -->|host 匹配 VS| VS[VirtualService<br/>match+route]\n  VS -->|dest=reviews subset=v2 w=100| DR[DestinationRule<br/>subset v2 = label version:v2]\n  DR -->|LB 挑一个 Endpoint| EP[reviews-v2-Pod]\n  subgraph mesh 内部\n    APP[productpage 调用 reviews] --> VS2[VirtualService reviews]\n    VS2 --> DR\n  end"
        }
      ],
      "labs": [
        {
          "title": "Lab 4.1 · 为 reviews 定义 subset 并全部落到 v1",
          "steps": [
            {
              "desc": "应用官方所有 DestinationRule（含 details/ratings/reviews subsets）",
              "cmd": "kubectl apply -f samples/bookinfo/networking/destination-rule-all.yaml"
            },
            {
              "desc": "确认 DR 已建",
              "cmd": "kubectl get destinationrule",
              "expect": "NAME          HOST\ndetails       details\nproductpage   productpage\nratings       ratings\nreviews       reviews"
            },
            {
              "desc": "应用 v1-only VirtualService",
              "cmd": "kubectl apply -f samples/bookinfo/networking/virtual-service-all-v1.yaml"
            },
            {
              "desc": "浏览器刷新 http://localhost:8080/productpage 多次，应只看到 v1（无星）",
              "cmd": "for i in $(seq 20); do curl -s http://localhost:8080/productpage | grep -oE 'glyphicon-star-[a-z]+' | head -1; done | sort | uniq -c"
            }
          ]
        },
        {
          "title": "Lab 4.2 · 读懂官方 YAML",
          "steps": [
            {
              "desc": "看 reviews 的 DR：三个 subset 各按 version label 切分",
              "cmd": "cat samples/bookinfo/networking/destination-rule-reviews.yaml",
              "expect": "apiVersion: networking.istio.io/v1\nkind: DestinationRule\nmetadata:\n  name: reviews\nspec:\n  host: reviews\n  subsets:\n  - name: v1\n    labels:\n      version: v1\n  - name: v2\n    labels:\n      version: v2\n  - name: v3\n    labels:\n      version: v3"
            },
            {
              "desc": "看 v1-only VS：所有 host 都强制 route 到 subset v1",
              "cmd": "cat samples/bookinfo/networking/virtual-service-all-v1.yaml"
            }
          ]
        },
        {
          "title": "Lab 4.3 · 用 proxy-config 验证下发",
          "steps": [
            {
              "desc": "找 productpage Pod",
              "cmd": "POD=$(kubectl get pod -l app=productpage -o jsonpath='{.items[0].metadata.name}')"
            },
            {
              "desc": "看它到 reviews 收到了哪条路由",
              "cmd": "istioctl proxy-config routes $POD --name 9080 -o json | jq '.[0].virtualHosts[] | select(.name|test(\"reviews\"))'"
            },
            {
              "desc": "看到 clusters 里 reviews 分成了 3 个 subset cluster",
              "cmd": "istioctl proxy-config clusters $POD --fqdn reviews.default.svc.cluster.local",
              "expect": "SERVICE FQDN                            PORT   SUBSET   DIRECTION   TYPE     DESTINATION RULE\nreviews.default.svc.cluster.local       9080   -        outbound    EDS      reviews.default\nreviews.default.svc.cluster.local       9080   v1       outbound    EDS      reviews.default\nreviews.default.svc.cluster.local       9080   v2       outbound    EDS      reviews.default\nreviews.default.svc.cluster.local       9080   v3       outbound    EDS      reviews.default"
            }
          ]
        }
      ],
      "verify": [
        "20 次刷新只看到 glyphicon-star-empty（v1 无星）为止的行数是 0——因为 v1 就是无星，star 计数应为 0",
        "istioctl proxy-config clusters 能看到 reviews 的 v1/v2/v3 三个 SUBSET"
      ],
      "tasks": [
        "官方 DR + v1-only VS 应用后所有流量走 reviews v1",
        "会读 destination-rule-reviews.yaml 的 subset 字段",
        "用 istioctl proxy-config routes 找到刚下发的 reviews 路由"
      ],
      "gotchas": [
        "同一 host 同一 gateway 只允许一个 VirtualService 生效，多个会 merge，顺序未定义 —— 团队协作时用 owner 注解避免抢占。",
        "VS 里写了 `subset: v2` 而 DR 里没声明该 subset，配置会被 istiod 拒绝，istioctl analyze 会报错。",
        "hosts 短名会拼当前 ns FQDN，跨 ns 调用必须写全名或用 exportTo/ServiceEntry。"
      ],
      "refs": [
        [
          "Request Routing Task",
          "https://istio.io/latest/docs/tasks/traffic-management/request-routing/"
        ],
        [
          "Traffic Management Concepts",
          "https://istio.io/latest/docs/concepts/traffic-management/"
        ]
      ]
    },
    {
      "day": 5,
      "week": 1,
      "phase": "实战",
      "title": "金丝雀发布：按权重 / 按 Header / 流量镜像",
      "duration": "3h",
      "goal": "掌握三种生产最常用的灰度模式，能读懂它们在 Envoy 里对应哪种 RouteAction。",
      "theory": [
        {
          "title": "为什么灰度",
          "body": "把新版本先放给少量流量，观察指标（错误率/延迟/业务转化）→ 逐步放量或回滚。相比蓝绿部署，金丝雀更节省资源，且能按用户特征精准放量（内部员工、VIP、某地域）。Istio 让灰度完全声明式，不需要改代码或发布器。",
          "refs": [
            [
              "Canary Deployments using Istio",
              "https://istio.io/latest/blog/2017/0.1-canary/"
            ]
          ]
        },
        {
          "title": "三种模式与对应 Envoy 语义",
          "body": "**按权重**：`route[].weight` 之和必须为 100；Envoy 在同一 RouteAction 里生成 weighted_clusters，按随机分布。**按 Header/Cookie/查询参数**：`match[].headers.<name>.exact/prefix/regex`；Envoy 生成多个 Route，顺序匹配。**流量镜像**（Mirror / Shadow）：`mirror + mirrorPercentage`；Envoy 会异步复制请求到影子集群，忽略响应，用于线上流量回放验证新版本，不影响用户。",
          "refs": [
            [
              "Traffic Shifting Task",
              "https://istio.io/latest/docs/tasks/traffic-management/traffic-shifting/"
            ],
            [
              "Mirroring Task",
              "https://istio.io/latest/docs/tasks/traffic-management/mirroring/"
            ]
          ]
        },
        {
          "title": "灰度决策顺序",
          "body": "VS 的 `http[]` 是数组，Envoy 按数组下标顺序做 route 匹配，命中即结束。因此建议顺序：① 特征灰度（vip / staff header）→ ② 通用权重灰度 → ③ 默认全量到稳定版。写反了会导致「特征命中的用户也参与权重分流」。",
          "refs": [
            [
              "VirtualService HTTPRoute",
              "https://istio.io/latest/docs/reference/config/networking/virtual-service/#HTTPRoute"
            ]
          ]
        }
      ],
      "diagrams": [
        {
          "title": "灰度决策流",
          "mermaid": "flowchart TD\n  Req[请求到达 Envoy] --> M1{header end-user=jason?}\n  M1 -->|是| V2[reviews v2]\n  M1 -->|否| M2{按 weight 分流}\n  M2 -->|90%| V1[reviews v1]\n  M2 -->|10%| V3[reviews v3]\n  V3 -.mirror 100%.-> V3S[reviews v3-shadow<br/>只收流量不回响应]"
        }
      ],
      "labs": [
        {
          "title": "Lab 5.1 · 官方按权重灰度 50/50",
          "steps": [
            {
              "desc": "应用 50% v1 + 50% v3 的 VS",
              "cmd": "kubectl apply -f samples/bookinfo/networking/virtual-service-reviews-50-v3.yaml"
            },
            {
              "desc": "查看 YAML 结构",
              "cmd": "cat samples/bookinfo/networking/virtual-service-reviews-50-v3.yaml",
              "expect": "spec:\n  hosts:\n    - reviews\n  http:\n  - route:\n    - destination:\n        host: reviews\n        subset: v1\n      weight: 50\n    - destination:\n        host: reviews\n        subset: v3\n      weight: 50"
            },
            {
              "desc": "统计 100 次访问的星星版本分布",
              "cmd": "for i in $(seq 100); do curl -s http://localhost:8080/productpage | grep -oE 'color:red|color:black|reviews-v1' | head -1; done | sort | uniq -c",
              "expect": "  ~50 color:red        # v3\n  ~50 reviews-v1       # v1 无星\n（±10 正常波动）"
            }
          ]
        },
        {
          "title": "Lab 5.2 · 按 Header 灰度（jason 登录看 v2）",
          "steps": [
            {
              "desc": "应用 header 匹配 VS：jason 走 v2，其它走 v1",
              "cmd": "kubectl apply -f samples/bookinfo/networking/virtual-service-reviews-test-v2.yaml"
            },
            {
              "desc": "查看 YAML 结构",
              "cmd": "cat samples/bookinfo/networking/virtual-service-reviews-test-v2.yaml",
              "expect": "spec:\n  hosts:\n    - reviews\n  http:\n  - match:\n    - headers:\n        end-user:\n          exact: jason\n    route:\n    - destination:\n        host: reviews\n        subset: v2\n  - route:\n    - destination:\n        host: reviews\n        subset: v1"
            },
            {
              "desc": "浏览器打开 productpage 页面右上角点 Sign in，用户名 jason（密码留空）登录，刷新应稳定看到黑色星",
              "cmd": "# 无需命令"
            },
            {
              "desc": "命令行验证：带 end-user=jason 头必落 v2",
              "cmd": "for i in 1 2 3 4 5; do curl -s -H 'end-user: jason' -H 'Cookie: session=jason' http://localhost:8080/productpage | grep -oE 'reviews-v[123]' | head -1; done"
            }
          ]
        },
        {
          "title": "Lab 5.3 · 流量镜像（Shadow）",
          "steps": [
            {
              "desc": "先把主流量拉回 v1",
              "cmd": "kubectl apply -f samples/bookinfo/networking/virtual-service-all-v1.yaml"
            },
            {
              "desc": "写一个镜像 VS：所有 reviews 请求主走 v1，同时 100% 镜像到 v3（观测新版本）",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata:\n  name: reviews\nspec:\n  hosts:\n  - reviews\n  http:\n  - route:\n    - destination:\n        host: reviews\n        subset: v1\n      weight: 100\n    mirror:\n      host: reviews\n      subset: v3\n    mirrorPercentage:\n      value: 100.0\nEOF"
            },
            {
              "desc": "curl 若干次，看 reviews-v3 pod 日志出现（说明收到了镜像流量）",
              "cmd": "kubectl logs -l app=reviews,version=v3 -c reviews --tail=5 -f"
            },
            {
              "desc": "同时用户体验仍稳定 v1（无星）",
              "cmd": "for i in 1 2 3; do curl -s http://localhost:8080/productpage | grep -oE 'reviews-v[123]' | head -1; done"
            }
          ]
        },
        {
          "title": "Lab 5.4 · 收尾清理，恢复 v1-only 基线",
          "steps": [
            {
              "desc": "回到只走 v1 的干净状态，方便 Day6 使用",
              "cmd": "kubectl apply -f samples/bookinfo/networking/virtual-service-all-v1.yaml"
            }
          ]
        }
      ],
      "verify": [
        "50/50 灰度下 100 次 curl 的两个版本各占约一半（40-60）",
        "带 end-user: jason 头的请求 100% 命中 v2",
        "镜像开启时，reviews-v3 pod 的应用日志有请求，但用户看到的仍是 v1"
      ],
      "tasks": [
        "跑通权重灰度并统计比例",
        "跑通 header 灰度（浏览器 jason 登录 + curl 双验证）",
        "跑通流量镜像，v3 pod 出现日志"
      ],
      "gotchas": [
        "权重必须整数，且 route 数组之和等于 100，否则 istioctl analyze 会告警。",
        "match 数组内多个字段是 AND；多条 match 之间是 OR。别把 AND/OR 弄反。",
        "mirror 请求会带 `-shadow` 后缀的 Host header，业务日志排查时注意区分。",
        "mirrorPercentage 是 float（0.0-100.0），不是整数百分比。"
      ],
      "refs": [
        [
          "Traffic Shifting",
          "https://istio.io/latest/docs/tasks/traffic-management/traffic-shifting/"
        ],
        [
          "Mirroring",
          "https://istio.io/latest/docs/tasks/traffic-management/mirroring/"
        ],
        [
          "Request Routing",
          "https://istio.io/latest/docs/tasks/traffic-management/request-routing/"
        ]
      ]
    },
    {
      "day": 6,
      "week": 1,
      "phase": "实战",
      "title": "弹性：超时 · 重试 · 熔断 · 故障注入",
      "duration": "3h",
      "goal": "用 Istio 配置替代业务代码里的容错逻辑，掌握故障注入用于混沌工程。",
      "theory": [
        {
          "title": "超时 timeout",
          "body": "写在 VirtualService.http[].timeout，单位可写 `500ms`、`2s`。它是端到端超时（含所有重试）。Envoy 到达该时间会返回 504 UT（upstream timeout）并主动断开上游连接。默认无超时，生产必设。",
          "refs": [
            [
              "Setting Request Timeouts",
              "https://istio.io/latest/docs/tasks/traffic-management/request-timeouts/"
            ]
          ]
        },
        {
          "title": "重试 retries",
          "body": "`attempts` 总重试次数、`perTryTimeout` 单次尝试超时、`retryOn` 触发条件（5xx / gateway-error / connect-failure / refused-stream / retriable-4xx / reset）。重要原则：**只对幂等接口（GET/HEAD/OPTIONS/PUT/DELETE）开启重试**，POST 慎重。Envoy 会自动在 header 加 `x-envoy-attempt-count`。",
          "refs": [
            [
              "Retries in VS",
              "https://istio.io/latest/docs/reference/config/networking/virtual-service/#HTTPRetry"
            ]
          ]
        },
        {
          "title": "熔断 = connectionPool + outlierDetection",
          "body": "两个概念常被合称熔断：① **connectionPool**（并发上限）：`tcp.maxConnections`、`http.http1MaxPendingRequests`、`http.maxRequestsPerConnection`、`http.maxRequestsPerConnection`。超过阈值请求立即失败，避免打爆下游。② **outlierDetection**（异常摘除）：`consecutive5xxErrors`/`consecutiveGatewayErrors` 触发次数，`interval` 检查周期，`baseEjectionTime` 摘除时长，`maxEjectionPercent` 最多摘多少百分比 endpoint。均写在 DestinationRule.trafficPolicy。",
          "refs": [
            [
              "Circuit Breaking Task",
              "https://istio.io/latest/docs/tasks/traffic-management/circuit-breaking/"
            ]
          ]
        },
        {
          "title": "故障注入 fault injection",
          "body": "VS.http[].fault 支持两种：**delay**（`fixedDelay: 5s`, `percentage.value: 50`）和 **abort**（`httpStatus: 500`, `percentage.value: 10`）。可以对特定 header/user 组合注入，构造真实故障演练。是混沌工程最轻量的做法，不需要额外工具。",
          "refs": [
            [
              "Fault Injection Task",
              "https://istio.io/latest/docs/tasks/traffic-management/fault-injection/"
            ]
          ]
        }
      ],
      "diagrams": [
        {
          "title": "熔断触发流程（outlierDetection）",
          "mermaid": "sequenceDiagram\n  participant C as Client Envoy\n  participant EP1 as endpoint 1\n  participant EP2 as endpoint 2\n  loop 每 interval=1s\n    C->>EP1: request\n    EP1-->>C: 500\n    C->>EP1: request\n    EP1-->>C: 500\n    Note over C: 连续 5 次 5xx<br/>consecutive5xxErrors=5\n    C->>C: 从池中弹出 EP1<br/>baseEjectionTime=30s\n    C->>EP2: request\n    EP2-->>C: 200\n  end\n  Note over C: 30s 后 EP1 回池 半开尝试"
        }
      ],
      "labs": [
        {
          "title": "Lab 6.1 · 故障注入：ratings 加 7s 延迟",
          "steps": [
            {
              "desc": "先应用 Day5 的 jason→v2 配置（v2 依赖 ratings）",
              "cmd": "kubectl apply -f samples/bookinfo/networking/virtual-service-reviews-test-v2.yaml"
            },
            {
              "desc": "对 ratings 注入 7s 延迟（仅 jason 用户）",
              "cmd": "kubectl apply -f samples/bookinfo/networking/virtual-service-ratings-test-delay.yaml"
            },
            {
              "desc": "查看 YAML",
              "cmd": "cat samples/bookinfo/networking/virtual-service-ratings-test-delay.yaml",
              "expect": "spec:\n  hosts:\n  - ratings\n  http:\n  - match:\n    - headers:\n        end-user:\n          exact: jason\n    fault:\n      delay:\n        percentage:\n          value: 100.0\n        fixedDelay: 7s\n    route:\n    - destination:\n        host: ratings\n        subset: v1\n  - route:\n    - destination:\n        host: ratings\n        subset: v1"
            },
            {
              "desc": "登录 jason 刷新页面，观察 productpage 报错 —— 因为 productpage 到 reviews 的调用有硬编码 3s 超时",
              "cmd": "# 浏览器：登录 jason 刷新 http://localhost:8080/productpage\n# 页面会显示 'Sorry, product reviews are currently unavailable...'"
            }
          ]
        },
        {
          "title": "Lab 6.2 · 用 timeout 覆盖硬编码超时",
          "steps": [
            {
              "desc": "为 reviews→ratings 加 0.5s 超时",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata:\n  name: reviews\nspec:\n  hosts:\n  - reviews\n  http:\n  - route:\n    - destination:\n        host: reviews\n        subset: v2\n    timeout: 0.5s\nEOF"
            },
            {
              "desc": "登录 jason 刷新，页面变成秒回但显示 reviews 不可用（因为 500ms 超时先触发）",
              "cmd": "# 浏览器验证"
            },
            {
              "desc": "istioctl 校验配置无冲突",
              "cmd": "istioctl analyze"
            }
          ]
        },
        {
          "title": "Lab 6.3 · 熔断（circuit breaking）",
          "steps": [
            {
              "desc": "部署官方 httpbin 作为被熔断目标",
              "cmd": "kubectl apply -f samples/httpbin/httpbin.yaml"
            },
            {
              "desc": "配 DR：最多 1 个 pending 请求、并发 1，触发即熔断",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: networking.istio.io/v1\nkind: DestinationRule\nmetadata:\n  name: httpbin\nspec:\n  host: httpbin\n  trafficPolicy:\n    connectionPool:\n      tcp: { maxConnections: 1 }\n      http:\n        http1MaxPendingRequests: 1\n        maxRequestsPerConnection: 1\n    outlierDetection:\n      consecutive5xxErrors: 1\n      interval: 1s\n      baseEjectionTime: 3m\n      maxEjectionPercent: 100\nEOF"
            },
            {
              "desc": "部署 fortio 压测客户端",
              "cmd": "kubectl apply -f samples/httpbin/sample-client/fortio-deploy.yaml"
            },
            {
              "desc": "3 并发压 20 次",
              "cmd": "FORTIO=$(kubectl get pod -l app=fortio -o jsonpath='{.items[0].metadata.name}')\nkubectl exec $FORTIO -c fortio -- fortio load -c 3 -qps 0 -n 20 -loglevel Warning http://httpbin:8000/get",
              "expect": "Code 200 : 约 30-50%\nCode 503 : 约 50-70%\n（说明熔断成功挡下过量请求）"
            },
            {
              "desc": "看 upstream_rq_pending_overflow 计数增长（Envoy 熔断计数器）",
              "cmd": "POD=$(kubectl get pod -l app=fortio -o jsonpath='{.items[0].metadata.name}')\nkubectl exec $FORTIO -c istio-proxy -- pilot-agent request GET stats | grep httpbin | grep pending"
            }
          ]
        },
        {
          "title": "Lab 6.4 · 重试（retries）",
          "steps": [
            {
              "desc": "让 httpbin 返回 503，再配 3 次重试",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata:\n  name: httpbin\nspec:\n  hosts: [ httpbin ]\n  http:\n  - route:\n    - destination: { host: httpbin }\n    retries:\n      attempts: 3\n      perTryTimeout: 1s\n      retryOn: 5xx,gateway-error,connect-failure,refused-stream\nEOF"
            },
            {
              "desc": "调用 /status/503，观察响应头里出现 x-envoy-attempt-count: 4（1 次原始 + 3 次重试）",
              "cmd": "FORTIO=$(kubectl get pod -l app=fortio -o jsonpath='{.items[0].metadata.name}')\nkubectl exec $FORTIO -c fortio -- curl -sv http://httpbin:8000/status/503 2>&1 | grep -i attempt"
            }
          ]
        }
      ],
      "verify": [
        "延迟注入后 jason 用户看到 productpage 报错",
        "加 timeout 0.5s 后页面响应变快但显示 reviews 不可用",
        "fortio 压测出现大量 503，说明熔断生效",
        "curl 503 接口响应头带 x-envoy-attempt-count: 4"
      ],
      "tasks": [
        "把 ratings 注入 7s 延迟并观察 productpage 表现",
        "为 httpbin 加熔断配置并用 fortio 触发",
        "为 httpbin /status/503 加 3 次重试并验证 attempt-count"
      ],
      "gotchas": [
        "productpage 代码里对 reviews 有 3s 硬编码超时，Istio 层的 timeout 只是叠加限制，不能突破应用行为。",
        "retries.attempts 是总重试次数，不含原始请求。attempts=3 实际会发 4 次。",
        "重试放大流量：3 次重试 + 100 QPS 可能变 400 QPS 打到下游。搭配 connectionPool 上限使用。",
        "outlierDetection 至少要 2 个 endpoint 才能生效，单实例服务弹不出去。"
      ],
      "refs": [
        [
          "Fault Injection",
          "https://istio.io/latest/docs/tasks/traffic-management/fault-injection/"
        ],
        [
          "Request Timeouts",
          "https://istio.io/latest/docs/tasks/traffic-management/request-timeouts/"
        ],
        [
          "Circuit Breaking",
          "https://istio.io/latest/docs/tasks/traffic-management/circuit-breaking/"
        ]
      ]
    },
    {
      "day": 7,
      "week": 1,
      "phase": "复盘 · 项目",
      "title": "Week1 收官项目 · canary-shop 灰度商店",
      "duration": "半天",
      "goal": "独立设计并交付一个 3 服务的微店 Demo，把 Week1 所有 CRD 综合用一遍。",
      "theory": [
        {
          "title": "架构",
          "body": "**frontend**（Nginx 单页）→ **order**（v1/v2，返回订单 JSON，v2 加价 15%）→ **payment**（模拟支付，偶尔 5xx）。三个服务都用同一个官方镜像 `docker.io/istio/examples-helloworld-v1`（或用 nginxdemos/hello + 自定义 configmap）跑一个能返回文本区分的最小实现。真实做项目也可以用你自己的语言写，核心是能落 CRD。"
        },
        {
          "title": "覆盖点",
          "body": "① Gateway + VS 暴露 frontend；② order v1/v2 的 subset；③ 权重 90/10 灰度；④ header `x-user-tier: vip` 走 v2；⑤ payment 熔断 + 300ms 超时 + 2 次重试；⑥ order v2 注入 20% abort 500 验证 frontend 降级；⑦ 压测统计版本比例。"
        }
      ],
      "diagrams": [
        {
          "title": "canary-shop 拓扑",
          "mermaid": "flowchart LR\n  U((User)) --> GW[Gateway shop.local]\n  GW --> FE[frontend]\n  FE --> O[order VS]\n  O -->|match: x-user-tier=vip| OV2[order-v2]\n  O -->|w=90| OV1[order-v1]\n  O -->|w=10| OV2\n  OV1 --> P[payment<br/>DR: cb + retry + timeout]\n  OV2 --> P"
        }
      ],
      "labs": [
        {
          "title": "Step 1 · 建 ns 并开自动注入",
          "steps": [
            {
              "desc": "",
              "cmd": "kubectl create ns shop\nkubectl label ns shop istio-injection=enabled"
            }
          ]
        },
        {
          "title": "Step 2 · 部署三个服务",
          "steps": [
            {
              "desc": "落三个 Deployment + Service（order 两版本）",
              "cmd": "cat <<'EOF' | kubectl apply -n shop -f -\napiVersion: v1\nkind: Service\nmetadata: { name: frontend, labels: { app: frontend } }\nspec:\n  ports: [{ port: 80, name: http }]\n  selector: { app: frontend }\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata: { name: frontend }\nspec:\n  replicas: 1\n  selector: { matchLabels: { app: frontend } }\n  template:\n    metadata: { labels: { app: frontend } }\n    spec:\n      containers:\n      - name: nginx\n        image: nginxdemos/hello:plain-text\n        ports: [{ containerPort: 80 }]\n---\napiVersion: v1\nkind: Service\nmetadata: { name: order, labels: { app: order } }\nspec:\n  ports: [{ port: 80, name: http, targetPort: 80 }]\n  selector: { app: order }\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata: { name: order-v1 }\nspec:\n  replicas: 1\n  selector: { matchLabels: { app: order, version: v1 } }\n  template:\n    metadata: { labels: { app: order, version: v1 } }\n    spec:\n      containers:\n      - name: hello\n        image: docker.io/istio/examples-helloworld-v1:1.0\n        ports: [{ containerPort: 5000 }]\n        env: [{ name: SERVICE_VERSION, value: v1 }]\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata: { name: order-v2 }\nspec:\n  replicas: 1\n  selector: { matchLabels: { app: order, version: v2 } }\n  template:\n    metadata: { labels: { app: order, version: v2 } }\n    spec:\n      containers:\n      - name: hello\n        image: docker.io/istio/examples-helloworld-v2:1.0\n        ports: [{ containerPort: 5000 }]\n        env: [{ name: SERVICE_VERSION, value: v2 }]\n---\napiVersion: v1\nkind: Service\nmetadata: { name: payment, labels: { app: payment } }\nspec:\n  ports: [{ port: 80, name: http, targetPort: 80 }]\n  selector: { app: payment }\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata: { name: payment }\nspec:\n  replicas: 2\n  selector: { matchLabels: { app: payment } }\n  template:\n    metadata: { labels: { app: payment } }\n    spec:\n      containers:\n      - name: httpbin\n        image: kennethreitz/httpbin\n        ports: [{ containerPort: 80 }]\nEOF"
            },
            {
              "desc": "注意：order Service 里 targetPort 需与 helloworld 镜像匹配。这里镜像监听 5000，改一下：",
              "cmd": "kubectl -n shop patch svc order --type='json' -p='[{\"op\":\"replace\",\"path\":\"/spec/ports/0/targetPort\",\"value\":5000}]'"
            }
          ]
        },
        {
          "title": "Step 3 · Gateway + VS + DR",
          "steps": [
            {
              "desc": "对外暴露 frontend",
              "cmd": "cat <<'EOF' | kubectl apply -n shop -f -\napiVersion: networking.istio.io/v1\nkind: Gateway\nmetadata: { name: shop-gw }\nspec:\n  selector: { istio: ingressgateway }\n  servers:\n  - port: { number: 80, name: http, protocol: HTTP }\n    hosts: [ \"shop.local\" ]\n---\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata: { name: shop }\nspec:\n  hosts: [ \"shop.local\" ]\n  gateways: [ shop-gw ]\n  http:\n  - route:\n    - destination: { host: frontend, port: { number: 80 } }\nEOF"
            },
            {
              "desc": "order 灰度：vip → v2；否则 90/10",
              "cmd": "cat <<'EOF' | kubectl apply -n shop -f -\napiVersion: networking.istio.io/v1\nkind: DestinationRule\nmetadata: { name: order }\nspec:\n  host: order\n  subsets:\n  - { name: v1, labels: { version: v1 } }\n  - { name: v2, labels: { version: v2 } }\n---\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata: { name: order }\nspec:\n  hosts: [ order ]\n  http:\n  - match:\n    - headers: { x-user-tier: { exact: vip } }\n    route: [ { destination: { host: order, subset: v2 } } ]\n  - route:\n    - { destination: { host: order, subset: v1 }, weight: 90 }\n    - { destination: { host: order, subset: v2 }, weight: 10 }\nEOF"
            },
            {
              "desc": "payment：熔断 + 300ms 超时 + 2 次重试",
              "cmd": "cat <<'EOF' | kubectl apply -n shop -f -\napiVersion: networking.istio.io/v1\nkind: DestinationRule\nmetadata: { name: payment }\nspec:\n  host: payment\n  trafficPolicy:\n    connectionPool:\n      tcp: { maxConnections: 10 }\n      http: { http1MaxPendingRequests: 5, maxRequestsPerConnection: 5 }\n    outlierDetection:\n      consecutive5xxErrors: 3\n      interval: 5s\n      baseEjectionTime: 30s\n---\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata: { name: payment }\nspec:\n  hosts: [ payment ]\n  http:\n  - route: [ { destination: { host: payment } } ]\n    timeout: 300ms\n    retries: { attempts: 2, perTryTimeout: 100ms, retryOn: 5xx,connect-failure }\nEOF"
            }
          ]
        },
        {
          "title": "Step 4 · 验证 & 压测",
          "steps": [
            {
              "desc": "port-forward 到本机",
              "cmd": "kubectl -n istio-system port-forward svc/istio-ingressgateway 8080:80"
            },
            {
              "desc": "普通用户访问 order（应约 90% v1）",
              "cmd": "for i in $(seq 100); do curl -s -H 'Host: shop.local' http://localhost:8080/../order/hello 2>/dev/null; done | grep -oE 'version: v[12]' | sort | uniq -c\n# 直接从内部 pod 压更方便：\nkubectl -n shop run --rm -it curl --image=curlimages/curl --restart=Never -- sh -c 'for i in $(seq 100); do curl -s http://order/hello; echo; done' | grep -oE 'v[12]' | sort | uniq -c",
              "expect": "  约 90 v1\n  约 10 v2"
            },
            {
              "desc": "vip 强制 v2",
              "cmd": "kubectl -n shop run --rm -it curl --image=curlimages/curl --restart=Never -- sh -c 'for i in 1 2 3 4 5; do curl -s -H \"x-user-tier: vip\" http://order/hello; echo; done'",
              "expect": "全部 v2"
            },
            {
              "desc": "对 order v2 注入 abort 500 20%，看 frontend 是否降级到 v1",
              "cmd": "kubectl -n shop apply -f - <<'EOF'\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata: { name: order }\nspec:\n  hosts: [ order ]\n  http:\n  - match:\n    - headers: { x-user-tier: { exact: vip } }\n    fault:\n      abort: { percentage: { value: 20 }, httpStatus: 500 }\n    route: [ { destination: { host: order, subset: v2 } } ]\n  - route:\n    - { destination: { host: order, subset: v1 }, weight: 90 }\n    - { destination: { host: order, subset: v2 }, weight: 10 }\nEOF"
            }
          ]
        }
      ],
      "verify": [
        "普通请求 100 次里 v1 约 90 次、v2 约 10 次",
        "带 x-user-tier: vip 的请求 100% 走 v2",
        "对 vip 注入 20% abort 500 后，压 100 次约 20 次 500",
        "所有资源 istioctl analyze -n shop 无错误"
      ],
      "tasks": [
        "canary-shop 全部资源部署通过",
        "统计 100 次访问的版本比例并截图",
        "至少写一份 README 记录部署命令与验证结果"
      ],
      "gotchas": [
        "helloworld:v1/v2 镜像默认监听 5000 端口，Service targetPort 别忘改。",
        "多个 VS 共享同一 host 会 merge，实验时注意先 `kubectl delete vs order` 再 apply 新版本。",
        "kind 集群里没有 LoadBalancer，只能 port-forward 或用 NodePort。"
      ],
      "refs": [
        [
          "Istio Examples",
          "https://istio.io/latest/docs/examples/"
        ],
        [
          "Traffic Management Tasks",
          "https://istio.io/latest/docs/tasks/traffic-management/"
        ]
      ]
    },
    {
      "day": 8,
      "week": 2,
      "phase": "理论+实战",
      "title": "零信任第一步 · mTLS 与身份",
      "duration": "3h",
      "goal": "理解 SPIFFE 身份与 mTLS 握手过程；能把网格从 PERMISSIVE 安全迁到 STRICT。",
      "theory": [
        {
          "title": "SPIFFE 身份",
          "body": "每个工作负载的身份是 SPIFFE URI：`spiffe://<trust-domain>/ns/<ns>/sa/<serviceaccount>`。默认 trust-domain=`cluster.local`。这一 URI 会写入 istiod 签发的 x509 证书 SAN 字段，成为对端做授权的依据。**同 Pod 不同 SA = 不同身份**，因此 K8s ServiceAccount 就是访问控制的单元。",
          "refs": [
            [
              "Identity",
              "https://istio.io/latest/docs/concepts/security/#istio-identity"
            ]
          ]
        },
        {
          "title": "mTLS 握手流程",
          "body": "Envoy 启动时向本机 istio-agent 请求证书 → istio-agent 用 SA JWT token 到 istiod 换取签名证书（CSR 流程，24h 有效期，自动轮转）。客户端 Envoy 与服务端 Envoy TLS 握手时互相验证证书；服务端 Envoy 从对端证书 SAN 提取 principal 供后续 AuthorizationPolicy 使用。",
          "refs": [
            [
              "Mutual TLS",
              "https://istio.io/latest/docs/concepts/security/#mutual-tls-authentication"
            ]
          ]
        },
        {
          "title": "PeerAuthentication",
          "body": "**服务端**告诉 Envoy 用哪种方式接客户端。三种模式：**STRICT**（只收 mTLS，明文拒绝）、**PERMISSIVE**（同一端口同时开明文和 mTLS，是安全迁移的桥）、**DISABLE**（只收明文，通常用于绕过某些非 Sidecar 探针）。作用域按 metadata 声明：`namespace: istio-system` + 无 selector = 全网格；`namespace: X` + 无 selector = 该 ns；带 selector = 该 SA/label。",
          "refs": [
            [
              "PeerAuthentication",
              "https://istio.io/latest/docs/reference/config/security/peer_authentication/"
            ]
          ]
        },
        {
          "title": "DestinationRule.trafficPolicy.tls",
          "body": "**客户端**告诉 Envoy 出方向用什么 TLS。常用值：`ISTIO_MUTUAL`（用 istiod 签发的证书自动 mTLS，默认对 mesh 内启用）、`SIMPLE`（普通 TLS，用于访问外部 HTTPS 服务）、`MUTUAL`（外部 mTLS，需自己挂证书）、`DISABLE`（明文）。当迁移到 STRICT 时，客户端 DR 必须能出 mTLS，否则连不上。",
          "refs": [
            [
              "ClientTLSSettings",
              "https://istio.io/latest/docs/reference/config/networking/destination-rule/#ClientTLSSettings"
            ]
          ]
        }
      ],
      "diagrams": [
        {
          "title": "mTLS 双向握手",
          "mermaid": "sequenceDiagram\n  participant CE as Client Envoy\n  participant SE as Server Envoy\n  participant D as istiod (CA)\n  Note over CE,SE: 启动时各自向 istiod 拿证书\n  CE->>D: CSR + SA token\n  D-->>CE: cert (SAN=spiffe://.../sa/frontend, 24h)\n  SE->>D: CSR + SA token\n  D-->>SE: cert (SAN=spiffe://.../sa/order, 24h)\n  Note over CE,SE: TLS 1.3 双向握手\n  CE->>SE: ClientHello + client cert\n  SE->>SE: 验证 client cert 来自可信 CA\n  SE-->>CE: ServerHello + server cert\n  CE->>CE: 验证 server cert\n  Note over SE: 提取 principal=spiffe://.../sa/frontend<br/>供 AuthorizationPolicy 判断"
        }
      ],
      "labs": [
        {
          "title": "Lab 8.1 · 看你现在的 mTLS 状态",
          "steps": [
            {
              "desc": "查看默认 PeerAuthentication（应为空，即用 istiod 默认 PERMISSIVE）",
              "cmd": "kubectl get peerauthentication -A"
            },
            {
              "desc": "找一个 productpage pod 查它证书",
              "cmd": "POD=$(kubectl get pod -l app=productpage -o jsonpath='{.items[0].metadata.name}')\nistioctl proxy-config secret $POD -o json | jq -r '.dynamicActiveSecrets[0].secret.tlsCertificate.certificateChain.inlineBytes' | base64 -d | openssl x509 -text -noout | grep -A1 'X509v3 Subject Alternative Name'",
              "expect": "X509v3 Subject Alternative Name:\n    URI:spiffe://cluster.local/ns/default/sa/bookinfo-productpage"
            },
            {
              "desc": "istioctl 命令一键看 mTLS 是否互通",
              "cmd": "istioctl x describe pod $POD | head -20"
            }
          ]
        },
        {
          "title": "Lab 8.2 · 把 default ns 调成 STRICT",
          "steps": [
            {
              "desc": "写策略",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: security.istio.io/v1\nkind: PeerAuthentication\nmetadata:\n  name: default\n  namespace: default\nspec:\n  mtls:\n    mode: STRICT\nEOF"
            },
            {
              "desc": "从网格外（无 sidecar）访问验证会失败",
              "cmd": "kubectl create ns nomesh 2>/dev/null || true\nkubectl -n nomesh run --rm -it curl --image=curlimages/curl --restart=Never -- sh -c 'curl -v --max-time 3 http://productpage.default:9080/productpage'",
              "expect": "curl: (56) Recv failure: Connection reset by peer\n或 curl: (52) Empty reply from server"
            },
            {
              "desc": "从网格内正常访问：从 details pod 里 curl",
              "cmd": "kubectl exec $(kubectl get pod -l app=details -o jsonpath='{.items[0].metadata.name}') -c details -- curl -s -o /dev/null -w '%{http_code}\\n' http://productpage:9080/productpage",
              "expect": "200"
            }
          ]
        },
        {
          "title": "Lab 8.3 · 用 authn tls-check 排障",
          "steps": [
            {
              "desc": "看 productpage 到 reviews 的 mTLS 状态是否兼容",
              "cmd": "POD=$(kubectl get pod -l app=productpage -o jsonpath='{.items[0].metadata.name}')\nistioctl authn tls-check $POD reviews.default.svc.cluster.local",
              "expect": "HOST:PORT                                        STATUS     SERVER     CLIENT     AUTHN POLICY\nreviews.default.svc.cluster.local:9080           OK         STRICT     ISTIO_MUTUAL   default/default"
            },
            {
              "desc": "如果显示 CONFLICT，一般是客户端 DR 强行 DISABLE 或 SIMPLE 与服务端 STRICT 冲突",
              "cmd": "# 检查 DR：\nkubectl get dr -A -o yaml | grep -A2 'tls:'"
            }
          ]
        },
        {
          "title": "Lab 8.4 · 迁移期做法：先 PERMISSIVE 再 STRICT",
          "steps": [
            {
              "desc": "为某个 ns 单独 PERMISSIVE（覆盖上层）",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: security.istio.io/v1\nkind: PeerAuthentication\nmetadata:\n  name: default\n  namespace: legacy\nspec:\n  mtls:\n    mode: PERMISSIVE\nEOF"
            },
            {
              "desc": "生产迁移建议：全网 PERMISSIVE → 灰度按 ns/工作负载改 STRICT → 全网 STRICT。",
              "cmd": "# 无需命令"
            }
          ]
        }
      ],
      "verify": [
        "istioctl proxy-config secret 能看到 SPIFFE URI",
        "STRICT 之后网格外访问应失败，网格内访问 200",
        "istioctl authn tls-check 输出 STATUS=OK"
      ],
      "tasks": [
        "查看你 productpage Pod 的证书 SPIFFE URI",
        "把 default ns 切到 STRICT，网格外访问确认被拒",
        "写一条 legacy ns 的 PERMISSIVE 覆盖策略"
      ],
      "gotchas": [
        "kube-apiserver 到 Pod 的 liveness/readiness HTTP 探针不会走 sidecar，因此 STRICT 通常不影响探针；但若你自己写了外部拨测，需要给探针 SA 单独开 PERMISSIVE。",
        "把 mTLS 从 STRICT 切回 PERMISSIVE 有时几十秒才生效——xDS 推送延迟，别怀疑配置错。",
        "证书 24h 自动轮转，测试环境不要卡 clock skew。"
      ],
      "refs": [
        [
          "Authentication Policy Task",
          "https://istio.io/latest/docs/tasks/security/authentication/authn-policy/"
        ],
        [
          "Security Concepts",
          "https://istio.io/latest/docs/concepts/security/"
        ]
      ]
    },
    {
      "day": 9,
      "week": 2,
      "phase": "实战",
      "title": "授权 · AuthorizationPolicy 与 JWT 校验",
      "duration": "3h",
      "goal": "落地最小权限：谁能访问谁的哪个方法；用 JWT claim 做细粒度授权。",
      "theory": [
        {
          "title": "AuthorizationPolicy 语义",
          "body": "字段：**selector**（作用负载，缺省即 ns 内全部）+ **action**（ALLOW/DENY/CUSTOM/AUDIT）+ **rules[]**（from/to/when 三段）。默认策略：如果一个负载没有任何 ALLOW 匹配它，则默认允许（allow-by-default）。**但只要 ns 里出现任意一条 ALLOW**，未匹配请求就变成拒绝（deny-by-default）。DENY 优先于 ALLOW。空 spec 的 `AuthorizationPolicy {}` 等于「拒绝一切」。",
          "refs": [
            [
              "AuthorizationPolicy API",
              "https://istio.io/latest/docs/reference/config/security/authorization-policy/"
            ],
            [
              "Authorization Overview",
              "https://istio.io/latest/docs/concepts/security/#authorization"
            ]
          ]
        },
        {
          "title": "from / to / when",
          "body": "**from.source**：principals（SPIFFE URI）、namespaces、ipBlocks、requestPrincipals（JWT iss/sub）。**to.operation**：hosts、methods、paths、ports。**when**：condition key/values，例如 `request.headers[user-agent]`、`request.auth.claims[groups]`。多个条件之间是 AND，同一字段的多值是 OR。",
          "refs": [
            [
              "Conditions",
              "https://istio.io/latest/docs/reference/config/security/conditions/"
            ]
          ]
        },
        {
          "title": "RequestAuthentication",
          "body": "声明 workload 能接受哪些 JWT issuer + 其 JWKS 位置。Envoy 会做 signature、exp、iss 校验。**只校验不授权**：无 token 或 token 错误默认不会拒绝请求，直到出现 AuthorizationPolicy 引用 `requestPrincipals` 或 `request.auth.claims` 才生效。这样便于渐进落地。",
          "refs": [
            [
              "RequestAuthentication API",
              "https://istio.io/latest/docs/reference/config/security/request_authentication/"
            ]
          ]
        },
        {
          "title": "常见落地套路",
          "body": "1) 默认全 deny，白名单打洞；2) 边缘 gateway 校验 JWT，业务侧只做 principal 授权，避免每层重解；3) 用 SA 作为服务身份边界，一个 SA 一个业务；4) 结合 Telemetry 打 audit 日志观察策略是否过严；5) DENY 用来快速下线某个可疑客户端。"
        }
      ],
      "diagrams": [
        {
          "title": "AuthorizationPolicy 判定树",
          "mermaid": "flowchart TD\n  Req[请求进入 Envoy] --> D{有匹配 DENY 规则?}\n  D -->|是| Deny[403 RBAC:access denied]\n  D -->|否| A{有匹配 ALLOW 规则?}\n  A -->|是| Ok[放行]\n  A -->|否| E{该负载所在 ns 存在任意 ALLOW 策略?}\n  E -->|否| Ok\n  E -->|是| Deny"
        }
      ],
      "labs": [
        {
          "title": "Lab 9.1 · 全 ns 默认拒绝",
          "steps": [
            {
              "desc": "写一条空 spec deny-all，作用于 default ns",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: security.istio.io/v1\nkind: AuthorizationPolicy\nmetadata:\n  name: allow-nothing\n  namespace: default\nspec: {}\nEOF"
            },
            {
              "desc": "刷新 productpage，页面 500/403 —— 全 ns 被拒",
              "cmd": "curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/productpage",
              "expect": "403"
            }
          ]
        },
        {
          "title": "Lab 9.2 · 逐服务放行",
          "steps": [
            {
              "desc": "允许 ingressgateway → productpage GET",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: security.istio.io/v1\nkind: AuthorizationPolicy\nmetadata:\n  name: productpage-viewer\n  namespace: default\nspec:\n  selector: { matchLabels: { app: productpage } }\n  action: ALLOW\n  rules:\n  - from: [ { source: { namespaces: [\"istio-system\"] } } ]\n    to:   [ { operation: { methods: [\"GET\"] } } ]\nEOF"
            },
            {
              "desc": "允许 productpage → details / reviews",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: security.istio.io/v1\nkind: AuthorizationPolicy\nmetadata: { name: details-viewer, namespace: default }\nspec:\n  selector: { matchLabels: { app: details } }\n  action: ALLOW\n  rules:\n  - from: [ { source: { principals: [\"cluster.local/ns/default/sa/bookinfo-productpage\"] } } ]\n    to:   [ { operation: { methods: [\"GET\"] } } ]\n---\napiVersion: security.istio.io/v1\nkind: AuthorizationPolicy\nmetadata: { name: reviews-viewer, namespace: default }\nspec:\n  selector: { matchLabels: { app: reviews } }\n  action: ALLOW\n  rules:\n  - from: [ { source: { principals: [\"cluster.local/ns/default/sa/bookinfo-productpage\"] } } ]\n    to:   [ { operation: { methods: [\"GET\"] } } ]\n---\napiVersion: security.istio.io/v1\nkind: AuthorizationPolicy\nmetadata: { name: ratings-viewer, namespace: default }\nspec:\n  selector: { matchLabels: { app: ratings } }\n  action: ALLOW\n  rules:\n  - from: [ { source: { principals: [\"cluster.local/ns/default/sa/bookinfo-reviews\"] } } ]\n    to:   [ { operation: { methods: [\"GET\"] } } ]\nEOF"
            },
            {
              "desc": "再次访问 productpage 应恢复 200，且页面 reviews 正常显示",
              "cmd": "curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/productpage"
            }
          ]
        },
        {
          "title": "Lab 9.3 · JWT 校验 + claim 授权",
          "steps": [
            {
              "desc": "声明可信 JWT（用官方 demo 密钥）",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: security.istio.io/v1\nkind: RequestAuthentication\nmetadata:\n  name: jwt-example\n  namespace: default\nspec:\n  selector: { matchLabels: { app: productpage } }\n  jwtRules:\n  - issuer: \"testing@secure.istio.io\"\n    jwksUri: \"https://raw.githubusercontent.com/istio/istio/release-1.24/security/tools/jwt/samples/jwks.json\"\nEOF"
            },
            {
              "desc": "只允许携带合法 JWT 的请求访问 productpage",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: security.istio.io/v1\nkind: AuthorizationPolicy\nmetadata:\n  name: require-jwt\n  namespace: default\nspec:\n  selector: { matchLabels: { app: productpage } }\n  action: ALLOW\n  rules:\n  - from:\n    - source:\n        requestPrincipals: [\"testing@secure.istio.io/testing@secure.istio.io\"]\nEOF"
            },
            {
              "desc": "不带 token 访问应 403",
              "cmd": "curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/productpage",
              "expect": "403"
            },
            {
              "desc": "带官方 demo token 访问应 200",
              "cmd": "TOKEN=$(curl -s https://raw.githubusercontent.com/istio/istio/release-1.24/security/tools/jwt/samples/demo.jwt)\ncurl -s -o /dev/null -w '%{http_code}\\n' --header \"Authorization: Bearer $TOKEN\" http://localhost:8080/productpage",
              "expect": "200"
            },
            {
              "desc": "查看 token payload（claim.groups=group1）",
              "cmd": "echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq"
            }
          ]
        },
        {
          "title": "Lab 9.4 · 收尾 · 清理",
          "steps": [
            {
              "desc": "删除本节 AP + RequestAuth，避免影响 Day10",
              "cmd": "kubectl delete authorizationpolicy allow-nothing productpage-viewer details-viewer reviews-viewer ratings-viewer require-jwt -n default --ignore-not-found\nkubectl delete requestauthentication jwt-example -n default --ignore-not-found"
            }
          ]
        }
      ],
      "verify": [
        "空 spec 策略后 productpage 返回 403",
        "白名单放行后返回 200",
        "带 demo JWT 才能访问受保护 productpage"
      ],
      "tasks": [
        "跑通 deny-all + 白名单放行",
        "为 productpage 加 JWT 校验，无 token 应 403",
        "用 SA principals 而不是 namespaces 做授权（更严格）"
      ],
      "gotchas": [
        "principals 写全格式 `cluster.local/ns/<ns>/sa/<sa>`（注意开头没有 `spiffe://`）。",
        "把默认 deny 应用到 istio-system 会锁死 ingressgateway 到自身健康检查，禁止。",
        "AuthorizationPolicy 命中路径匹配是 Envoy path，含 querystring 前需先 strip。",
        "JWT 的 aud 校验可通过 `audiences` 字段开启，默认不校验 aud。"
      ],
      "refs": [
        [
          "Authorization Task",
          "https://istio.io/latest/docs/tasks/security/authorization/"
        ],
        [
          "JWT Authorization",
          "https://istio.io/latest/docs/tasks/security/authorization/authz-jwt/"
        ]
      ]
    },
    {
      "day": 10,
      "week": 2,
      "phase": "实战",
      "title": "可观测性 · Prometheus / Grafana / Kiali / Jaeger",
      "duration": "半天",
      "goal": "会看金指标、能读拓扑图、能从边缘一路拉出完整 trace；会用 Telemetry API 调采样率。",
      "theory": [
        {
          "title": "四大金指标",
          "body": "Google SRE 提出：**Latency / Traffic / Errors / Saturation**。Istio 让 Envoy 自动为每个请求产出这些指标，无需业务改代码：`istio_requests_total` 计数、`istio_request_duration_milliseconds_bucket` 直方图、`istio_request_bytes` / `istio_response_bytes`、`istio_tcp_*` 对应 TCP 场景。默认按 source/destination workload/ns/version/response_code 打 label。",
          "refs": [
            [
              "Istio Standard Metrics",
              "https://istio.io/latest/docs/reference/config/metrics/"
            ]
          ]
        },
        {
          "title": "采集链路",
          "body": "Envoy 15090 端口暴露 Prometheus 格式指标 → 集群里的 Prometheus 拉取 → Grafana 面板可视化 → 关键指标接告警。Prometheus 直接采 sidecar 而不需要业务打点，是 Istio 观测性最大的红利。",
          "refs": [
            [
              "Metrics Task",
              "https://istio.io/latest/docs/tasks/observability/metrics/"
            ]
          ]
        },
        {
          "title": "Kiali",
          "body": "服务网格专用拓扑控制台：把 Prometheus 数据画成实时服务图，边上是 QPS / 错误率；集成 Istio CRD 编辑器与配置健康检查（同 istioctl analyze）。是运维每天的驾驶舱。",
          "refs": [
            [
              "Kiali",
              "https://kiali.io/docs/"
            ]
          ]
        },
        {
          "title": "分布式追踪",
          "body": "Envoy 会在请求头透传 W3C trace context（`traceparent`）或 B3（`x-b3-traceid` 等）。业务代码必须做的唯一事：**把入站请求头透传到出站**，否则链路断。Istio 数据面把每个 span 报到 OTLP/Zipkin/Jaeger 采集器；采样率由 Telemetry API 或全局 meshConfig.defaultConfig.tracing.sampling 控制。",
          "refs": [
            [
              "Distributed Tracing",
              "https://istio.io/latest/docs/tasks/observability/distributed-tracing/"
            ]
          ]
        },
        {
          "title": "Telemetry API",
          "body": "1.11+ 推荐的方式替代旧 EnvoyFilter：`kind: Telemetry` 声明采样率、metrics 的 tag 增删、accessLogging 是否开启。作用域按 ns 与 selector，比 meshConfig 灵活得多。",
          "refs": [
            [
              "Telemetry API",
              "https://istio.io/latest/docs/reference/config/telemetry/"
            ]
          ]
        },
        {
          "title": "SLO / SLI / 错误预算（生产化观测的核心）",
          "body": "只看 P99 不够，要建 SLO：例如 `order` API 30 天可用性 SLO=99.9%（错误预算 43.2 分钟）；当**燃尽率**（当前错误率 / (1-SLO)）>10 时触发 fast burn 告警，>2 触发 slow burn。SLO 指标应基于 Istio `istio_requests_total`，不依赖业务打点。搭配 Kiali 拓扑与 Jaeger 链路可以在告警 10 分钟内定位故障根因。",
          "refs": [
            [
              "Google SRE Workbook · SLO",
              "https://sre.google/workbook/implementing-slos/"
            ]
          ]
        }
      ],
      "diagrams": [
        {
          "title": "观测数据流",
          "mermaid": "flowchart LR\n  A[App] --- E[Envoy sidecar]\n  E -->|:15090 /stats/prometheus| P[(Prometheus)]\n  E -->|OTLP/Zipkin| J[(Jaeger)]\n  P --> G[[Grafana Dashboards]]\n  P --> K[[Kiali topology]]\n  E -.access log stdout.- L[Loki/ELK]"
        }
      ],
      "labs": [
        {
          "title": "Lab 10.1 · 安装 addons（demo profile 自带样例）",
          "steps": [
            {
              "desc": "cd 到 istio 下载目录",
              "cmd": "cd istio-1.24.0"
            },
            {
              "desc": "一键装 Prometheus + Grafana + Kiali + Jaeger",
              "cmd": "kubectl apply -f samples/addons/"
            },
            {
              "desc": "等 4 个 pod 就绪",
              "cmd": "kubectl -n istio-system get pod -l 'app in (prometheus,grafana,kiali,jaeger)'",
              "expect": "grafana-xxx      1/1 Running\njaeger-xxx       1/1 Running\nkiali-xxx        1/1 Running\nprometheus-xxx   2/2 Running"
            }
          ]
        },
        {
          "title": "Lab 10.2 · 产生流量并打开 Kiali",
          "steps": [
            {
              "desc": "开一个后台不断刷新 productpage 的循环",
              "cmd": "for i in $(seq 1 500); do curl -s http://localhost:8080/productpage > /dev/null; sleep 0.2; done &"
            },
            {
              "desc": "启动 Kiali dashboard（会打开浏览器）",
              "cmd": "istioctl dashboard kiali",
              "expect": "http://localhost:20001/kiali"
            },
            {
              "desc": "浏览器进入 Kiali → Graph → Namespace: default → Display: Traffic/Request Rate。可看到 productpage → reviews v1/v2/v3 → ratings 的拓扑与实时 QPS。",
              "cmd": "# 无需命令"
            }
          ]
        },
        {
          "title": "Lab 10.3 · Grafana 看 Istio 服务面板",
          "steps": [
            {
              "desc": "打开 Grafana",
              "cmd": "istioctl dashboard grafana",
              "expect": "http://localhost:3000"
            },
            {
              "desc": "进入 Dashboards → Istio → Istio Service Dashboard → Service: productpage.default.svc.cluster.local。观察 Client Request Volume / Success Rate / Request Duration P50/P90/P99。",
              "cmd": "# 无需命令"
            }
          ]
        },
        {
          "title": "Lab 10.4 · 直查 Prometheus 指标",
          "steps": [
            {
              "desc": "开 Prometheus UI",
              "cmd": "istioctl dashboard prometheus"
            },
            {
              "desc": "过去 5 分钟 productpage 的 P90 延迟（毫秒）",
              "cmd": "# PromQL 粘到 Prometheus:\nhistogram_quantile(0.90,\n  sum(rate(istio_request_duration_milliseconds_bucket{\n    reporter=\"destination\",\n    destination_service_name=\"productpage\"\n  }[5m])) by (le)\n)"
            },
            {
              "desc": "过去 1 分钟每服务错误率",
              "cmd": "sum(rate(istio_requests_total{reporter=\"destination\",response_code!~\"2..\"}[1m])) by (destination_service_name)\n/\nsum(rate(istio_requests_total{reporter=\"destination\"}[1m])) by (destination_service_name)"
            }
          ]
        },
        {
          "title": "Lab 10.5 · 分布式追踪",
          "steps": [
            {
              "desc": "把采样率调到 100%（默认 1%，学习期够小流量足够）",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: telemetry.istio.io/v1\nkind: Telemetry\nmetadata:\n  name: mesh-default\n  namespace: istio-system\nspec:\n  tracing:\n  - randomSamplingPercentage: 100.0\nEOF"
            },
            {
              "desc": "多刷几次 productpage 产生 trace",
              "cmd": "for i in $(seq 20); do curl -s http://localhost:8080/productpage > /dev/null; done"
            },
            {
              "desc": "打开 Jaeger UI",
              "cmd": "istioctl dashboard jaeger"
            },
            {
              "desc": "Service 选 productpage.default → Find Traces → 展开任意一条 trace，能看到 productpage → details / reviews / ratings 的完整调用树",
              "cmd": "# 无需命令"
            }
          ]
        },
        {
          "title": "Lab 10.6 · 生产告警规则（可直接接你现网 Prometheus）",
          "steps": [
            {
              "desc": "落一份 Istio 通用告警规则 CRD（PrometheusRule）",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: monitoring.coreos.com/v1\nkind: PrometheusRule\nmetadata:\n  name: istio-alerts\n  namespace: monitoring\nspec:\n  groups:\n  - name: istio.control-plane\n    rules:\n    - alert: IstiodDown\n      expr: absent(up{app=\"istiod\"} == 1)\n      for: 2m\n      labels: { severity: critical }\n      annotations:\n        summary: \"istiod 全部实例不可用\"\n        runbook_url: \"https://runbooks/istio/istiod-down\"\n    - alert: IstiodxDSPushError\n      expr: rate(pilot_xds_push_errors[5m]) > 0.1\n      for: 5m\n      labels: { severity: warning }\n    - alert: IstiodxDSRejects\n      expr: rate(pilot_xds_pushes{type=~\".*rejects\"}[5m]) > 0\n      for: 5m\n      labels: { severity: warning }\n    - alert: IstioCertExpiryClose\n      expr: (istio_agent_cert_expiry_seconds < 7*86400)\n      for: 10m\n      labels: { severity: warning }\n      annotations: { summary: \"workload 证书 <7 天将到期，检查 istiod CA 或轮转\" }\n  - name: istio.data-plane\n    rules:\n    - alert: HighRequestErrorRate\n      expr: |\n        sum(rate(istio_requests_total{reporter=\"destination\",response_code=~\"5..\"}[5m])) by (destination_service_name)\n        /\n        sum(rate(istio_requests_total{reporter=\"destination\"}[5m])) by (destination_service_name)\n        > 0.05\n      for: 10m\n      labels: { severity: warning }\n      annotations: { summary: \"服务 {{ $labels.destination_service_name }} 错误率 >5% 持续 10m\" }\n    - alert: HighP99Latency\n      expr: |\n        histogram_quantile(0.99,\n          sum(rate(istio_request_duration_milliseconds_bucket{reporter=\"destination\"}[5m])) by (destination_service_name, le)\n        ) > 1000\n      for: 10m\n      labels: { severity: warning }\n    - alert: SidecarMemoryHigh\n      expr: container_memory_working_set_bytes{container=\"istio-proxy\"} > 400*1024*1024\n      for: 10m\n      labels: { severity: warning }\n    - alert: mTLSHandshakeFailures\n      expr: rate(istio_request_bytes_count{connection_security_policy=\"none\",reporter=\"destination\"}[5m]) > 0\n      for: 5m\n      labels: { severity: warning }\n      annotations: { summary: \"STRICT 环境下出现明文流量（可能有客户端未升级）\" }\nEOF"
            },
            {
              "desc": "Recording rules：预聚合高基数指标，缓解 Prometheus 压力",
              "cmd": "# 加入同一 PrometheusRule 的 groups[]:\n  - name: istio.recording\n    interval: 30s\n    rules:\n    - record: svc:istio_requests:rate5m\n      expr: sum(rate(istio_requests_total[5m])) by (destination_service_name, response_code)\n    - record: svc:istio_request_duration_p99_5m\n      expr: |\n        histogram_quantile(0.99,\n          sum(rate(istio_request_duration_milliseconds_bucket[5m])) by (destination_service_name, le))"
            },
            {
              "desc": "Grafana SLO 面板：错误预算燃尽（示例 SLO = 99.9%）",
              "cmd": "# PromQL（近 30 天错误预算消耗率）\n(1 -\n  sum(rate(istio_requests_total{reporter=\"destination\",response_code!~\"5..\"}[30d]))\n  /\n  sum(rate(istio_requests_total{reporter=\"destination\"}[30d]))\n) / (1 - 0.999)"
            }
          ]
        }
      ],
      "verify": [
        "Kiali 拓扑图看到 4 个服务节点，边上有 QPS 数字",
        "Grafana Istio Service Dashboard 有真实数据",
        "Jaeger 中能找到跨越 productpage/details/reviews/ratings 的 trace"
      ],
      "tasks": [
        "四个 addons 全部部署成功",
        "Kiali 拓扑图截图",
        "写一条 PromQL 查询 productpage P95 延迟",
        "拉出一条完整 productpage → ratings 的 trace"
      ],
      "gotchas": [
        "Kiali 需要 Prometheus 才能画图，先装 Prometheus。",
        "trace 断链最常见原因：某服务代码没透传 traceparent/b3 头；用 Python/Java 主流框架时装对应 propagator。",
        "生产环境不要 100% 采样，Jaeger 存储会爆；建议 1-10%，问题服务再定向调高。",
        "istio_requests_total 的 label cardinality 很高，可用 Telemetry.metrics.overrides 移除高基数 label（如 destination_workload_id）。"
      ],
      "refs": [
        [
          "Observability Tasks",
          "https://istio.io/latest/docs/tasks/observability/"
        ],
        [
          "Metrics Reference",
          "https://istio.io/latest/docs/reference/config/metrics/"
        ]
      ]
    },
    {
      "day": 11,
      "week": 2,
      "phase": "进阶",
      "title": "Egress · ServiceEntry · Sidecar CRD · 多集群拓扑",
      "duration": "3-4h",
      "goal": "能治理外部依赖流量、能收敛 Envoy 内存、能画出多集群三种模式的拓扑。",
      "theory": [
        {
          "title": "Egress 策略",
          "body": "**默认**（outboundTrafficPolicy.mode=ALLOW_ANY）：sidecar 直连未知外部 host，无治理能力。**REGISTRY_ONLY**：只允许访问网格 registry 里的服务，其他一律 502，配合 ServiceEntry 白名单，是合规首选。**通过 Egress Gateway**：把外部流量集中在专用 gateway 节点出网，便于审计、防火墙白名单化、IP 汇聚。",
          "refs": [
            [
              "Egress Task",
              "https://istio.io/latest/docs/tasks/traffic-management/egress/"
            ]
          ]
        },
        {
          "title": "ServiceEntry",
          "body": "把网格外服务（`api.stripe.com` / VM / on-prem 数据库）注册为一条虚拟 host，让 Envoy 能给它挂 VirtualService（超时/重试）、DestinationRule（TLS/熔断）。关键字段：**hosts / ports / resolution**（DNS/STATIC/DNS_ROUND_ROBIN/NONE）/ **location**（MESH_INTERNAL 与集群内平权；MESH_EXTERNAL 外部）。",
          "refs": [
            [
              "ServiceEntry API",
              "https://istio.io/latest/docs/reference/config/networking/service-entry/"
            ]
          ]
        },
        {
          "title": "Sidecar CRD（收敛 Envoy）",
          "body": "默认每个 sidecar 拿到集群里所有 Service 的 xDS 配置，Envoy 内存开销随集群 Service 数量线性增长。用 Sidecar CRD 声明该 ns 或某 workload 只需要看到哪些 host，可让 Envoy 内存从几百 MB 降到几十 MB。生产大集群必配。",
          "refs": [
            [
              "Sidecar API",
              "https://istio.io/latest/docs/reference/config/networking/sidecar/"
            ]
          ]
        },
        {
          "title": "多集群三种模式",
          "body": "① **Multi-Primary**（多主）：每个集群一个 istiod，共享同一 root CA，通过 East-West Gateway 互通；容灾好，运维复杂。② **Primary-Remote**：一个主集群 istiod 兼管多个 remote 集群，remote 集群没有独立 istiod；省资源但主挂全挂。③ **External Control Plane**：istiod 部署在独立管理集群，业务集群零控制面开销，适合托管平台。三种都要求：Pod CIDR 不重叠 或 走 East-West Gateway 转发；共享 root CA；跨集群 Service 名一致。",
          "refs": [
            [
              "Install Multicluster",
              "https://istio.io/latest/docs/setup/install/multicluster/"
            ]
          ]
        }
      ],
      "diagrams": [
        {
          "title": "Egress 三种走法",
          "mermaid": "flowchart LR\n  App1[App A<br/>ALLOW_ANY] -->|直连| Ext1((api.example.com))\n  App2[App B] --> SE[ServiceEntry注册] -->|Sidecar直连| Ext2((api.stripe.com))\n  App3[App C] --> VS3[VS 强制转发] --> EGW[[Egress Gateway]] --> Ext3((外部合规接口))\n  EGW --> Audit[[审计/合规日志]]"
        },
        {
          "title": "多集群 Multi-Primary",
          "mermaid": "flowchart LR\n  subgraph C1[Cluster 1]\n    I1[[istiod]]\n    EW1[[east-west GW]]\n    P1[Pod]\n  end\n  subgraph C2[Cluster 2]\n    I2[[istiod]]\n    EW2[[east-west GW]]\n    P2[Pod]\n  end\n  I1 <-. 共享 root CA .-> I2\n  P1 --> EW1\n  EW1 <-->|HBONE / mTLS| EW2\n  EW2 --> P2"
        }
      ],
      "labs": [
        {
          "title": "Lab 11.1 · 注册外部服务 ServiceEntry",
          "steps": [
            {
              "desc": "为 api.github.com 建 ServiceEntry",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: networking.istio.io/v1\nkind: ServiceEntry\nmetadata:\n  name: github-api\nspec:\n  hosts:\n  - api.github.com\n  ports:\n  - number: 443\n    name: https\n    protocol: HTTPS\n  resolution: DNS\n  location: MESH_EXTERNAL\nEOF"
            },
            {
              "desc": "从 sleep pod curl 试试",
              "cmd": "kubectl apply -f samples/sleep/sleep.yaml\nSLEEP=$(kubectl get pod -l app=sleep -o jsonpath='{.items[0].metadata.name}')\nkubectl exec $SLEEP -c sleep -- curl -sI https://api.github.com | head -1",
              "expect": "HTTP/2 200"
            },
            {
              "desc": "给它加超时 3s（VS 作用于外部 host）",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata:\n  name: github-api\nspec:\n  hosts: [ api.github.com ]\n  http:\n  - timeout: 3s\n    route:\n    - destination:\n        host: api.github.com\nEOF"
            }
          ]
        },
        {
          "title": "Lab 11.2 · 通过 Egress Gateway 出网",
          "steps": [
            {
              "desc": "把出 api.github.com 的流量强制转发到 egressgateway",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: networking.istio.io/v1\nkind: Gateway\nmetadata:\n  name: istio-egressgateway-github\nspec:\n  selector: { istio: egressgateway }\n  servers:\n  - port: { number: 443, name: tls, protocol: TLS }\n    hosts: [ api.github.com ]\n    tls: { mode: PASSTHROUGH }\n---\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata:\n  name: direct-github-through-egress-gateway\nspec:\n  hosts: [ api.github.com ]\n  gateways: [ istio-egressgateway-github, mesh ]\n  tls:\n  - match:\n    - gateways: [ mesh ]\n      port: 443\n      sniHosts: [ api.github.com ]\n    route:\n    - destination:\n        host: istio-egressgateway.istio-system.svc.cluster.local\n        port: { number: 443 }\n  - match:\n    - gateways: [ istio-egressgateway-github ]\n      port: 443\n      sniHosts: [ api.github.com ]\n    route:\n    - destination:\n        host: api.github.com\n        port: { number: 443 }\n      weight: 100\nEOF"
            },
            {
              "desc": "从 sleep 再次访问，观察 egressgateway 日志出现 SNI=api.github.com",
              "cmd": "kubectl exec $SLEEP -c sleep -- curl -sI https://api.github.com | head -1\nkubectl -n istio-system logs -l istio=egressgateway --tail=20 | grep api.github"
            }
          ]
        },
        {
          "title": "Lab 11.3 · 用 Sidecar 收敛内存",
          "steps": [
            {
              "desc": "先看当前 productpage Envoy 拿到的 cluster 数",
              "cmd": "POD=$(kubectl get pod -l app=productpage -o jsonpath='{.items[0].metadata.name}')\nistioctl proxy-config clusters $POD | wc -l"
            },
            {
              "desc": "限制 default ns 只看 default + istio-system",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: networking.istio.io/v1\nkind: Sidecar\nmetadata:\n  name: default\n  namespace: default\nspec:\n  egress:\n  - hosts:\n    - \"./*\"\n    - \"istio-system/*\"\nEOF"
            },
            {
              "desc": "重新统计，数字应下降；kubectl exec 进 Envoy 也可看 memory 变小",
              "cmd": "istioctl proxy-config clusters $POD | wc -l\nkubectl exec $POD -c istio-proxy -- pilot-agent request GET stats/prometheus 2>/dev/null | grep -E 'envoy_server_memory_allocated'"
            }
          ]
        }
      ],
      "verify": [
        "sleep pod 能通过 ServiceEntry 访问 api.github.com",
        "开 Egress Gateway 后 egressgateway 日志里出现 SNI=api.github.com",
        "Sidecar CRD 应用后 istioctl proxy-config clusters 数量减少"
      ],
      "tasks": [
        "写一条 ServiceEntry 把 api.github.com 纳入网格",
        "配 VS 使 sleep 走 egress gateway 访问 GitHub API",
        "写一条 Sidecar CRD 让 default ns 只看 default + istio-system 并观察内存下降"
      ],
      "gotchas": [
        "MeshConfig.outboundTrafficPolicy 是全局开关，改为 REGISTRY_ONLY 前先把常见依赖都写 ServiceEntry，否则线上炸。",
        "TLS PASSTHROUGH 与 HTTPS + TLS Terminate 是两个方向；PASSTHROUGH 时 Egress GW 看不到 http 语义。",
        "Sidecar CRD 里 `./*` 表示当前 ns 全部，`ns/svc` 精确到某服务；漏配会让 productpage 突然连不上 reviews。",
        "多集群跨集群解析走的是 clusterset 或 DNS 命名，不是 K8s CoreDNS 自动跨集群。"
      ],
      "refs": [
        [
          "Egress Task",
          "https://istio.io/latest/docs/tasks/traffic-management/egress/"
        ],
        [
          "Multicluster Deployment Models",
          "https://istio.io/latest/docs/ops/deployment/deployment-models/#multiple-clusters"
        ]
      ]
    },
    {
      "day": 12,
      "week": 2,
      "phase": "前沿",
      "title": "Ambient Mode 深入 · ztunnel + waypoint",
      "duration": "3h",
      "goal": "理解 Ambient 与 Sidecar 的取舍并跑通最小示例；能画 HBONE 隧道 + L4/L7 分层。",
      "theory": [
        {
          "title": "为什么要 Ambient",
          "body": "Sidecar 模式痛点：① 每 Pod 100-200MB Envoy 开销；② sidecar 与业务同 pod，升级要重启业务；③ init container 需 NET_ADMIN，与部分安全策略冲突；④ 协议识别失败时（如非标准 HTTP）不友好。Ambient 把 mesh 能力拆成 L4（下沉节点）+ L7（按需部署），实现零侵入、无重启、按需付费。",
          "refs": [
            [
              "Ambient Overview",
              "https://istio.io/latest/docs/ambient/overview/"
            ]
          ]
        },
        {
          "title": "ztunnel（Zero-Trust Tunnel）",
          "body": "Rust 编写，DaemonSet 部署，每节点一个。责任：① 拦截本节点所有 ambient 模式 Pod 的入/出流量（用 istio-cni 装 iptables/网络命名空间钩子）；② 与其它节点 ztunnel 走 **HBONE** 隧道通信 —— 即 HTTP/2 CONNECT + mTLS，把原始 L4 TCP 包封装进 HTTP/2 stream，天然复用连接、天然 mTLS、天然可观测；③ 携带 workload SPIFFE 身份供对端授权。",
          "refs": [
            [
              "ztunnel Reference",
              "https://istio.io/latest/docs/ambient/architecture/data-plane/"
            ]
          ]
        },
        {
          "title": "waypoint proxy",
          "body": "只有当某个 Service Account / Service / namespace 需要 L7 能力（AuthorizationPolicy 里用了 path/method、VirtualService 里用了 header 路由）时，才需要部署 waypoint。它其实是一个 Envoy Deployment（用 Gateway API 的 `kind: Gateway, gatewayClassName: istio-waypoint` 声明），流量路径变成：sourceZtunnel → waypoint → destZtunnel → dest Pod。按需付费。",
          "refs": [
            [
              "Waypoint Proxies",
              "https://istio.io/latest/docs/ambient/usage/waypoint/"
            ]
          ]
        },
        {
          "title": "Sidecar vs Ambient 选型",
          "body": "**Sidecar 优势**：延迟最低（同 pod）、EnvoyFilter 生态完善、社区最成熟。**Ambient 优势**：显著省资源（10 倍级）、Pod 无需重启、更好的 CNI 兼容、L7 按需付费。**当前状态**：Ambient 1.22 GA，1.23-1.24 生态与运维体系持续完善；生产已有大厂案例，但小规模建议先 Sidecar 熟悉再迁 Ambient。",
          "refs": [
            [
              "Comparing Sidecar and Ambient",
              "https://istio.io/latest/blog/2022/introducing-ambient-mesh/"
            ]
          ]
        }
      ],
      "diagrams": [
        {
          "title": "Ambient 请求路径（含 waypoint）",
          "mermaid": "flowchart LR\n  A[App A] --> ZA[[ztunnel A]]\n  ZA -->|HBONE mTLS| WP[[waypoint<br/>L7 策略]]\n  WP -->|HBONE mTLS| ZB[[ztunnel B]]\n  ZB --> B[App B]\n  Note1{{只需 L4 时可跳过 waypoint}}\n  ZA -. 无 L7 策略 .-> ZB"
        },
        {
          "title": "HBONE 帧结构",
          "mermaid": "flowchart TB\n  H[HTTP/2 CONNECT<br/>Host: destPodIP:port] --> T[TLS 1.3 mTLS]\n  T --> P[原始 L4 TCP payload]\n  H -. mTLS 携带 SPIFFE 身份 .-> S[对端 ztunnel 用身份做授权]"
        }
      ],
      "labs": [
        {
          "title": "Lab 12.1 · 用 istioctl 装 Ambient",
          "steps": [
            {
              "desc": "警告：此 Lab 建议单独 kind 集群，或先把 Bookinfo 卸掉。这里给出干净集群路径",
              "cmd": "kind delete cluster --name mesh || true\nkind create cluster --name mesh --config kind-mesh.yaml"
            },
            {
              "desc": "安装 ambient profile（含 CNI + ztunnel）",
              "cmd": "istioctl install --set profile=ambient --skip-confirmation"
            },
            {
              "desc": "确认 ztunnel 与 istio-cni DaemonSet 就绪",
              "cmd": "kubectl -n istio-system get ds",
              "expect": "NAME         DESIRED   CURRENT   READY\nistio-cni    3         3         3\nztunnel      3         3         3"
            },
            {
              "desc": "为 default ns 打 ambient 标签（不需要 istio-injection）",
              "cmd": "kubectl label ns default istio.io/dataplane-mode=ambient"
            }
          ]
        },
        {
          "title": "Lab 12.2 · 部署 Bookinfo，无 sidecar",
          "steps": [
            {
              "desc": "部署 Bookinfo",
              "cmd": "kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml"
            },
            {
              "desc": "关键：每个 Pod 是 1/1（没 sidecar 了）",
              "cmd": "kubectl get pods",
              "expect": "productpage-v1-xxx    1/1     Running\nreviews-v1-xxx        1/1     Running\n..."
            },
            {
              "desc": "但流量仍被 ztunnel 拦截：从 productpage curl reviews 应可通",
              "cmd": "POD=$(kubectl get pod -l app=productpage -o jsonpath='{.items[0].metadata.name}')\nkubectl exec $POD -c productpage -- curl -s http://reviews:9080/reviews/0 | head -c 200"
            },
            {
              "desc": "看 ztunnel 日志确认 HBONE 转发",
              "cmd": "kubectl -n istio-system logs ds/ztunnel --tail=20 | grep -E 'reviews|hbone'"
            }
          ]
        },
        {
          "title": "Lab 12.3 · 为 reviews 部署 waypoint 做 L7 策略",
          "steps": [
            {
              "desc": "为整个 default ns 创建 waypoint",
              "cmd": "istioctl waypoint apply --enroll-namespace --namespace default"
            },
            {
              "desc": "查看 Gateway 与 Deployment",
              "cmd": "kubectl get gateway,pod -l gateway.networking.k8s.io/gateway-name=waypoint"
            },
            {
              "desc": "写一条 L7 授权：只允许 GET /productpage",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: security.istio.io/v1\nkind: AuthorizationPolicy\nmetadata:\n  name: productpage-l7\n  namespace: default\nspec:\n  targetRefs:\n  - kind: Service\n    group: \"\"\n    name: productpage\n  rules:\n  - to:\n    - operation: { methods: [ GET ], paths: [ /productpage, /static/* ] }\nEOF"
            },
            {
              "desc": "POST 应被拒",
              "cmd": "kubectl exec $POD -c productpage -- curl -s -o /dev/null -w '%{http_code}\\n' -XPOST http://productpage:9080/productpage",
              "expect": "403"
            },
            {
              "desc": "GET 应放行",
              "cmd": "kubectl exec $POD -c productpage -- curl -s -o /dev/null -w '%{http_code}\\n' http://productpage:9080/productpage",
              "expect": "200"
            }
          ]
        }
      ],
      "verify": [
        "ambient 模式下 pod 都是 1/1，仍能互相调用",
        "ztunnel 日志出现 HBONE 转发记录",
        "waypoint 部署后 POST 被 L7 授权拒绝"
      ],
      "tasks": [
        "跑通 ambient profile 安装",
        "无 sidecar 完成 Bookinfo 调用",
        "为 productpage 部署 waypoint + L7 授权，验证 POST 403"
      ],
      "gotchas": [
        "Ambient 与 Sidecar 不能在同一 Pod 上共存，Pod 只能选一。",
        "ambient 模式对 hostNetwork Pod 不生效（流量根本没进 pod 网络命名空间）。",
        "kind 需 v0.20+；否则 CNI 挂载路径不对。",
        "waypoint 目前仅对 targetRefs（Gateway API 风格）生效，selector 语法逐步淘汰。"
      ],
      "refs": [
        [
          "Ambient Getting Started",
          "https://istio.io/latest/docs/ambient/getting-started/"
        ],
        [
          "Ambient Architecture",
          "https://istio.io/latest/docs/ambient/architecture/"
        ]
      ]
    },
    {
      "day": 13,
      "week": 2,
      "phase": "生产",
      "title": "生产运维 · 升级 / 性能调优 / 排障套路",
      "duration": "半天",
      "goal": "掌握 revision 灰度升级、Envoy 内存优化、5 步排障标准流程。",
      "theory": [
        {
          "title": "Revision 金丝雀升级",
          "body": "生产禁用 in-place 升级（`istioctl upgrade`），一定用 revision：`istioctl install --set revision=1-24-0 --set profile=default`。会得到并存的 istiod-1-24-0 与旧 istiod。给 ns 打 `istio.io/rev=1-24-0` 覆盖 `istio-injection`，滚动重启工作负载即完成迁移。验证无问题后 `istioctl uninstall --revision=<old>`。",
          "refs": [
            [
              "Canary Upgrades",
              "https://istio.io/latest/docs/setup/upgrade/canary/"
            ]
          ]
        },
        {
          "title": "性能开销 & 优化",
          "body": "Sidecar 典型开销：**内存** 40-200MB（与集群 Service 数相关）、**CPU** 0.1-0.5 vCPU per 1000 QPS、**延迟** P90 增加 <1ms（同节点）、跨节点 mTLS +1-3ms。优化：① Sidecar CRD 收敛可见 host；② 关闭不用的协议解析（telemetry v2 tag 精简）；③ 降低 Telemetry 采样率；④ 高流量场景切 Ambient；⑤ 用 CPU/mem hpa 缩放 ingress gateway。",
          "refs": [
            [
              "Performance Benchmarks",
              "https://istio.io/latest/docs/ops/deployment/performance-and-scalability/"
            ]
          ]
        },
        {
          "title": "五步排障法（记住这五步）",
          "body": "① `istioctl analyze -A`：静态检查所有配置冲突；② `istioctl proxy-status`：xDS 是否 SYNCED，STALE 说明 istiod 或 Envoy 有问题；③ `istioctl proxy-config listeners/routes/clusters/endpoints <pod>`：dump 具体 Envoy 配置对比预期；④ `kubectl logs <pod> -c istio-proxy`：Envoy 访问日志 + 错误日志；⑤ `pilot-agent request GET config_dump / stats`：终极 dump，能看到 stats 计数器（连接、熔断、重试等）。",
          "refs": [
            [
              "Diagnostic Tools",
              "https://istio.io/latest/docs/ops/diagnostic-tools/"
            ]
          ]
        },
        {
          "title": "Envoy 访问日志",
          "body": "默认关。生产开启 mesh 级 accessLogging（Telemetry API）。字段含义：`%RESPONSE_FLAGS%` 是排障关键：UH=no healthy upstream、UF=upstream connection failure、UT=upstream timeout、URX=retry limit exceeded、RL=rate limited、DPE=downstream protocol error、UAEX=external authz failed。",
          "refs": [
            [
              "Envoy Access Logs",
              "https://istio.io/latest/docs/tasks/observability/logs/access-log/"
            ]
          ]
        },
        {
          "title": "关键真相：istiod 挂了业务也能继续跑",
          "body": "生产事故复盘常见误区：以为 istiod 全挂 = 服务网格全挂。真相：Envoy 数据面缓存了最后一次 xDS 配置，即使 istiod 全部宕机，现存流量继续按最后配置正常转发；影响仅是：① 新起的 Pod 拿不到配置、② 配置变更不会生效、③ 证书 24h 后无法轮转导致业务中断。这个「优雅降级」窗口给了你时间冷静恢复控制面。生产 istiod 至少 3 副本 + PDB minAvailable=2，几乎不会真正全挂。",
          "refs": [
            [
              "Istio HA Deployment",
              "https://istio.io/latest/docs/ops/deployment/deployment-models/#control-plane-models"
            ]
          ]
        }
      ],
      "diagrams": [
        {
          "title": "Revision Canary 升级流程",
          "mermaid": "flowchart TB\n  S1[[集群现状 revision=1-23]] --> A[istioctl install<br/>--set revision=1-24-0<br/>--set profile=default]\n  A --> S2[istiod-1-23 & istiod-1-24 并存]\n  S2 --> L[给 ns 打 istio.io/rev=1-24-0<br/>取消 istio-injection]\n  L --> R[kubectl rollout restart<br/>逐个 ns 滚动]\n  R --> V{业务健康?}\n  V -->|OK| U[istioctl uninstall --revision=1-23]\n  V -->|异常| B[改回 istio.io/rev=1-23 回滚]"
        }
      ],
      "labs": [
        {
          "title": "Lab 13.1 · 用 revision 做金丝雀升级演练",
          "steps": [
            {
              "desc": "假设现网是 1.24.0。安装一个 revision 标记，验证并存（真实升级把 1-24-1 换成新版）",
              "cmd": "istioctl install --set revision=stable --set profile=demo -y\nkubectl get pods -n istio-system -l app=istiod",
              "expect": "istiod-xxx           1/1   Running    # 旧的\nistiod-stable-xxx    1/1   Running    # 新 revision"
            },
            {
              "desc": "把 default ns 切到 stable revision",
              "cmd": "kubectl label ns default istio.io/rev=stable istio-injection- --overwrite\nkubectl rollout restart deploy -n default"
            },
            {
              "desc": "确认新 pod sidecar 来自 stable revision",
              "cmd": "POD=$(kubectl get pod -l app=productpage -o jsonpath='{.items[0].metadata.name}')\nkubectl get pod $POD -o jsonpath='{.metadata.labels.istio\\.io/rev}'",
              "expect": "stable"
            }
          ]
        },
        {
          "title": "Lab 13.2 · 故意写错配置，用 5 步排障找出来",
          "steps": [
            {
              "desc": "写一条错误的 VS：subset v99 不存在",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata: { name: reviews }\nspec:\n  hosts: [ reviews ]\n  http:\n  - route:\n    - destination: { host: reviews, subset: v99 }\nEOF"
            },
            {
              "desc": "第 1 步：静态检查",
              "cmd": "istioctl analyze",
              "expect": "Error [IST0101] (VirtualService default/reviews) Referenced host+subset in destinationrule not found: \"reviews+v99\""
            },
            {
              "desc": "第 2 步：看是否推送到 Envoy（会 SYNCED，因为 istiod 会推空/回退）",
              "cmd": "istioctl proxy-status"
            },
            {
              "desc": "第 3 步：看具体 cluster / route 状态",
              "cmd": "POD=$(kubectl get pod -l app=productpage -o jsonpath='{.items[0].metadata.name}')\nistioctl proxy-config clusters $POD --fqdn reviews.default.svc.cluster.local"
            },
            {
              "desc": "第 4 步：sidecar 日志（RESPONSE_FLAGS 通常是 NR - no route）",
              "cmd": "kubectl logs $POD -c istio-proxy --tail=20"
            },
            {
              "desc": "改回正确 VS 收尾",
              "cmd": "kubectl apply -f samples/bookinfo/networking/virtual-service-all-v1.yaml"
            }
          ]
        },
        {
          "title": "Lab 13.3 · 开启访问日志",
          "steps": [
            {
              "desc": "全网开启 accessLog（stdout）",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: telemetry.istio.io/v1\nkind: Telemetry\nmetadata: { name: access-log, namespace: istio-system }\nspec:\n  accessLogging:\n  - providers:\n    - name: envoy\nEOF"
            },
            {
              "desc": "触发几次请求，观察日志",
              "cmd": "for i in 1 2 3; do curl -s http://localhost:8080/productpage > /dev/null; done\nkubectl logs -l app=productpage -c istio-proxy --tail=5",
              "expect": "[2026-xx-xx] \"GET /productpage HTTP/1.1\" 200 - via_upstream - \"-\" 0 5183 12 11 \"-\" ..."
            }
          ]
        },
        {
          "title": "Lab 13.4 · 看 Envoy 统计计数器",
          "steps": [
            {
              "desc": "查 reviews cluster 的连接/重试/熔断/健康状态",
              "cmd": "POD=$(kubectl get pod -l app=productpage -o jsonpath='{.items[0].metadata.name}')\nkubectl exec $POD -c istio-proxy -- pilot-agent request GET stats | grep 'cluster.outbound.*reviews' | grep -E 'upstream_rq_(total|retry|pending_overflow)|health_check'"
            }
          ]
        },
        {
          "title": "Lab 13.5 · 回滚 Runbook（10 分钟恢复）",
          "steps": [
            {
              "desc": "场景：升级到 revision=1-24-0 后某 ns 出现 5xx 突增，立刻回滚",
              "cmd": "# 1. 立即把出问题的 ns 打回旧 revision\nkubectl label ns prod istio.io/rev=1-23-2 --overwrite\n# 2. 滚动重启工作负载（关键：sidecar 会重新按旧 revision 注入）\nkubectl -n prod rollout restart deploy\n# 3. 观察 5xx 曲线，通常 2-5 分钟内下降\nkubectl -n prod rollout status deploy --timeout=5m"
            },
            {
              "desc": "如果连 istiod 都要下线（严重）：卸载新 revision",
              "cmd": "istioctl uninstall --revision=1-24-0 -y\n# 此时旧 revision=1-23-2 仍在运行，业务不受影响"
            },
            {
              "desc": "验证回滚成功",
              "cmd": "istioctl proxy-status | grep -v SYNCED   # 应为空（全 SYNCED）\nkubectl -n prod get pod -o jsonpath='{range .items[*]}{.metadata.name}{\"\\t\"}{.metadata.annotations.sidecar\\.istio\\.io/status}{\"\\n\"}{end}' | head"
            }
          ]
        },
        {
          "title": "Lab 13.6 · Envoy CVE 应急（数据面独立升级）",
          "steps": [
            {
              "desc": "Envoy 平均每季度爆一个 CVE。istio 1.24.x 补丁版通常在 CVE 后 24h 出。做法：只升 sidecar，不动 control plane。",
              "cmd": "# 1. 拉最新 patch：只升 istiod 镜像 tag（Chart 版本不变）\nhelm upgrade istiod istio/istiod -n istio-system \\\n  --reuse-values --set global.tag=1.24.3\n# 2. rollout restart 所有业务 ns，触发新 sidecar 注入\nfor ns in $(kubectl get ns -l istio-injection=enabled -o jsonpath='{.items[*].metadata.name}'); do\n  kubectl -n $ns rollout restart deploy\ndone"
            },
            {
              "desc": "验证所有 sidecar 版本已更新",
              "cmd": "istioctl proxy-status\nkubectl get pods -A -o jsonpath='{range .items[*]}{.spec.containers[?(@.name==\"istio-proxy\")].image}{\"\\n\"}{end}' | sort -u"
            },
            {
              "desc": "有 hotfix 但不想重启全部 pod？用 revision tag 分批",
              "cmd": "# 打 tag stable-hotfix 指向新 revision\nistioctl tag set stable-hotfix --revision 1-24-3-hotfix\nkubectl label ns prod-batch1 istio.io/rev=stable-hotfix --overwrite\nkubectl -n prod-batch1 rollout restart deploy\n# 观察 1h 无异常后再滚下一批"
            }
          ]
        }
      ],
      "verify": [
        "两个 istiod revision 并存",
        "istioctl analyze 能报出错误的 subset v99",
        "开启 accessLog 后 sidecar 日志出现 HTTP 请求行",
        "pilot-agent stats 能看到 reviews 的 upstream 计数"
      ],
      "tasks": [
        "跑通 revision 并存 + ns 灰度切换",
        "用 5 步排障法定位错误的 VS 配置",
        "开启访问日志并读懂 RESPONSE_FLAGS 的一个例子"
      ],
      "gotchas": [
        "打 `istio.io/rev=xxx` 标签时记得 `istio-injection-` 移除旧标签，否则不生效（旧标签优先）。",
        "revision 名称必须匹配 K8s DNS 标签规则：小写字母/数字/连字符，不能有点。",
        "开 accessLog 后日志量大，生产用 Telemetry 的 filter 只对错误请求打日志。",
        "istioctl analyze 只做静态检查，无法覆盖 xDS 推送延迟或 Envoy 运行时问题。"
      ],
      "refs": [
        [
          "Upgrade with Revisions",
          "https://istio.io/latest/docs/setup/upgrade/canary/"
        ],
        [
          "Debugging Envoy and Istiod",
          "https://istio.io/latest/docs/ops/diagnostic-tools/proxy-cmd/"
        ],
        [
          "Performance",
          "https://istio.io/latest/docs/ops/deployment/performance-and-scalability/"
        ]
      ]
    },
    {
      "day": 14,
      "week": 2,
      "phase": "Capstone",
      "title": "综合 Capstone · mesh-shop 全链路准生产项目",
      "duration": "一天",
      "goal": "把两周所学串起来交付一个准生产级微服务：mTLS + AuthZ + JWT + 灰度 + 熔断 + Egress + 可观测 + Runbook。",
      "theory": [
        {
          "title": "架构与目标",
          "body": "**mesh-shop** 分层：\n- **入口**：istio-ingressgateway，公网入口，做 JWT 校验；\n- **web**：BFF 层，聚合调用；\n- **catalog**：商品查询（v1 单版本）；\n- **cart**：购物车，读写 Redis；\n- **order**：下单，v1/v2 灰度；\n- **payment**：模拟支付，配熔断+超时+重试，出网调 3rd-party api（走 Egress Gateway）；\n- **notifier**：完成后调外部消息服务。\n验收：SLO 面板 P99<500ms；vip 用户 100% v2；chaos 时 web 页面平稳降级；升级零业务中断。"
        },
        {
          "title": "交付物清单",
          "body": "① `docs/architecture.md` + 拓扑图；② `manifests/base` K8s 资源 + `manifests/mesh` 全部 CRD（Gateway/VS/DR/SE/PA/RA/AP/Sidecar/Telemetry）；③ `chaos/`：故障注入脚本；④ `runbook.md` 应急响应；⑤ `postmortem-template.md`；⑥ Kiali 拓扑截图 / Grafana SLO 截图 / Jaeger 一条 trace 截图。"
        }
      ],
      "diagrams": [
        {
          "title": "mesh-shop 完整拓扑",
          "mermaid": "flowchart LR\n  U((User)) -->|JWT| IGW[Ingress GW<br/>RequestAuth校验]\n  IGW --> WEB[web BFF]\n  WEB --> CAT[catalog]\n  WEB --> CART[cart]\n  CART --> RDS[(Redis)]\n  WEB --> ORD[order VS]\n  ORD -->|match: vip| OV2[order v2]\n  ORD -->|w=95| OV1[order v1]\n  ORD -->|w=5| OV2\n  OV1 --> PAY[payment<br/>CB+timeout+retry]\n  OV2 --> PAY\n  PAY --> EGW[[Egress GW]] --> Stripe((api.stripe.com))\n  WEB --> NOTI[notifier] --> EGW\n  IGW -. mTLS STRICT .- WEB\n  WEB -. mTLS .- CAT\n  WEB -. mTLS .- ORD\n  ORD -. mTLS .- PAY"
        }
      ],
      "labs": [
        {
          "title": "Step 1 · 骨架 & 命名空间",
          "steps": [
            {
              "desc": "新建 ns，开自动注入",
              "cmd": "kubectl create ns shop\nkubectl label ns shop istio-injection=enabled"
            },
            {
              "desc": "为每个服务建 SA（授权靠 principals 依赖 SA）",
              "cmd": "for sa in web catalog cart order payment notifier; do\n  kubectl -n shop create sa $sa\ndone"
            }
          ]
        },
        {
          "title": "Step 2 · 部署业务（用 helloworld / httpbin / redis 官方镜像）",
          "steps": [
            {
              "desc": "部署 catalog / cart / order-v1 / order-v2 / payment / notifier / web + redis。此处仅示意 order+payment 关键片段，其它按同模式补齐",
              "cmd": "cat <<'EOF' | kubectl -n shop apply -f -\napiVersion: v1\nkind: Service\nmetadata: { name: order, labels: { app: order } }\nspec:\n  ports: [{ port: 80, name: http, targetPort: 5000 }]\n  selector: { app: order }\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata: { name: order-v1 }\nspec:\n  replicas: 2\n  selector: { matchLabels: { app: order, version: v1 } }\n  template:\n    metadata: { labels: { app: order, version: v1 } }\n    spec:\n      serviceAccountName: order\n      containers:\n      - name: hello\n        image: docker.io/istio/examples-helloworld-v1:1.0\n        env: [{ name: SERVICE_VERSION, value: v1 }]\n        ports: [{ containerPort: 5000 }]\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata: { name: order-v2 }\nspec:\n  replicas: 2\n  selector: { matchLabels: { app: order, version: v2 } }\n  template:\n    metadata: { labels: { app: order, version: v2 } }\n    spec:\n      serviceAccountName: order\n      containers:\n      - name: hello\n        image: docker.io/istio/examples-helloworld-v2:1.0\n        env: [{ name: SERVICE_VERSION, value: v2 }]\n        ports: [{ containerPort: 5000 }]\n---\napiVersion: v1\nkind: Service\nmetadata: { name: payment, labels: { app: payment } }\nspec:\n  ports: [{ port: 80, name: http, targetPort: 80 }]\n  selector: { app: payment }\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata: { name: payment }\nspec:\n  replicas: 3\n  selector: { matchLabels: { app: payment } }\n  template:\n    metadata: { labels: { app: payment } }\n    spec:\n      serviceAccountName: payment\n      containers:\n      - name: httpbin\n        image: kennethreitz/httpbin\n        ports: [{ containerPort: 80 }]\nEOF"
            }
          ]
        },
        {
          "title": "Step 3 · Mesh 层：全局 STRICT + 逐服务 AP",
          "steps": [
            {
              "desc": "网格级 STRICT",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: security.istio.io/v1\nkind: PeerAuthentication\nmetadata: { name: default, namespace: istio-system }\nspec: { mtls: { mode: STRICT } }\nEOF"
            },
            {
              "desc": "shop ns 默认拒绝 + 精细放行",
              "cmd": "cat <<'EOF' | kubectl -n shop apply -f -\napiVersion: security.istio.io/v1\nkind: AuthorizationPolicy\nmetadata: { name: default-deny }\nspec: {}\n---\napiVersion: security.istio.io/v1\nkind: AuthorizationPolicy\nmetadata: { name: allow-ingress-to-web }\nspec:\n  selector: { matchLabels: { app: web } }\n  action: ALLOW\n  rules:\n  - from: [ { source: { namespaces: [\"istio-system\"] } } ]\n---\napiVersion: security.istio.io/v1\nkind: AuthorizationPolicy\nmetadata: { name: allow-web-to-services }\nspec:\n  action: ALLOW\n  rules:\n  - from: [ { source: { principals: [\"cluster.local/ns/shop/sa/web\"] } } ]\n    to:   [ { operation: { methods: [\"GET\", \"POST\"] } } ]\n  selector: { matchExpressions: [ { key: app, operator: In, values: [ catalog, cart, order ] } ] }\n---\napiVersion: security.istio.io/v1\nkind: AuthorizationPolicy\nmetadata: { name: allow-order-to-payment }\nspec:\n  selector: { matchLabels: { app: payment } }\n  action: ALLOW\n  rules:\n  - from: [ { source: { principals: [\"cluster.local/ns/shop/sa/order\"] } } ]\nEOF"
            }
          ]
        },
        {
          "title": "Step 4 · Mesh 层：入口 + JWT + 灰度 + 熔断",
          "steps": [
            {
              "desc": "Gateway + web 的 VS",
              "cmd": "cat <<'EOF' | kubectl -n shop apply -f -\napiVersion: networking.istio.io/v1\nkind: Gateway\nmetadata: { name: shop-gw }\nspec:\n  selector: { istio: ingressgateway }\n  servers:\n  - port: { number: 80, name: http, protocol: HTTP }\n    hosts: [ \"shop.local\" ]\n---\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata: { name: web }\nspec:\n  hosts: [ \"shop.local\" ]\n  gateways: [ shop-gw ]\n  http:\n  - route: [ { destination: { host: web } } ]\nEOF"
            },
            {
              "desc": "入口 JWT 校验（用 Day9 的 demo issuer）",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: security.istio.io/v1\nkind: RequestAuthentication\nmetadata: { name: gateway-jwt, namespace: istio-system }\nspec:\n  selector: { matchLabels: { istio: ingressgateway } }\n  jwtRules:\n  - issuer: \"testing@secure.istio.io\"\n    jwksUri: \"https://raw.githubusercontent.com/istio/istio/release-1.24/security/tools/jwt/samples/jwks.json\"\n---\napiVersion: security.istio.io/v1\nkind: AuthorizationPolicy\nmetadata: { name: require-jwt-at-gw, namespace: istio-system }\nspec:\n  selector: { matchLabels: { istio: ingressgateway } }\n  action: ALLOW\n  rules:\n  - from: [ { source: { requestPrincipals: [\"testing@secure.istio.io/testing@secure.istio.io\"] } } ]\nEOF"
            },
            {
              "desc": "order 灰度（vip → v2；否则 95/5）",
              "cmd": "cat <<'EOF' | kubectl -n shop apply -f -\napiVersion: networking.istio.io/v1\nkind: DestinationRule\nmetadata: { name: order }\nspec:\n  host: order\n  subsets:\n  - { name: v1, labels: { version: v1 } }\n  - { name: v2, labels: { version: v2 } }\n---\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata: { name: order }\nspec:\n  hosts: [ order ]\n  http:\n  - match: [ { headers: { x-user-tier: { exact: vip } } } ]\n    route: [ { destination: { host: order, subset: v2 } } ]\n  - route:\n    - { destination: { host: order, subset: v1 }, weight: 95 }\n    - { destination: { host: order, subset: v2 }, weight: 5 }\nEOF"
            },
            {
              "desc": "payment：熔断 + 300ms 超时 + 2 次重试（仅幂等 GET）",
              "cmd": "cat <<'EOF' | kubectl -n shop apply -f -\napiVersion: networking.istio.io/v1\nkind: DestinationRule\nmetadata: { name: payment }\nspec:\n  host: payment\n  trafficPolicy:\n    connectionPool:\n      tcp: { maxConnections: 50 }\n      http: { http1MaxPendingRequests: 20, maxRequestsPerConnection: 10 }\n    outlierDetection:\n      consecutive5xxErrors: 5\n      interval: 5s\n      baseEjectionTime: 30s\n      maxEjectionPercent: 50\n---\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata: { name: payment }\nspec:\n  hosts: [ payment ]\n  http:\n  - match: [ { method: { exact: GET } } ]\n    route: [ { destination: { host: payment } } ]\n    timeout: 300ms\n    retries: { attempts: 2, perTryTimeout: 100ms, retryOn: 5xx,connect-failure }\n  - route: [ { destination: { host: payment } } ]\n    timeout: 500ms\nEOF"
            }
          ]
        },
        {
          "title": "Step 5 · Egress + Sidecar 收敛 + 观测采样",
          "steps": [
            {
              "desc": "让 payment/notifier 访问 3rd-party 走 egress gw",
              "cmd": "cat <<'EOF' | kubectl -n shop apply -f -\napiVersion: networking.istio.io/v1\nkind: ServiceEntry\nmetadata: { name: stripe-api }\nspec:\n  hosts: [ api.stripe.com ]\n  ports:\n  - { number: 443, name: https, protocol: HTTPS }\n  resolution: DNS\n  location: MESH_EXTERNAL\nEOF"
            },
            {
              "desc": "收敛 shop ns 只看 shop + istio-system",
              "cmd": "cat <<'EOF' | kubectl -n shop apply -f -\napiVersion: networking.istio.io/v1\nkind: Sidecar\nmetadata: { name: default }\nspec:\n  egress:\n  - hosts: [ \"./*\", \"istio-system/*\" ]\nEOF"
            },
            {
              "desc": "为 shop ns 打开 accessLog + 10% trace 采样",
              "cmd": "cat <<'EOF' | kubectl -n shop apply -f -\napiVersion: telemetry.istio.io/v1\nkind: Telemetry\nmetadata: { name: shop-telemetry }\nspec:\n  accessLogging: [ { providers: [ { name: envoy } ] } ]\n  tracing:      [ { randomSamplingPercentage: 10.0 } ]\nEOF"
            }
          ]
        },
        {
          "title": "Step 6 · Chaos + 观察 + 收官",
          "steps": [
            {
              "desc": "对 vip 用户注入 20% payment 5xx，验证 web 降级",
              "cmd": "cat <<'EOF' | kubectl -n shop apply -f -\napiVersion: networking.istio.io/v1\nkind: VirtualService\nmetadata: { name: payment-chaos }\nspec:\n  hosts: [ payment ]\n  http:\n  - match: [ { headers: { x-user-tier: { exact: vip } } } ]\n    fault: { abort: { percentage: { value: 20 }, httpStatus: 500 } }\n    route: [ { destination: { host: payment } } ]\n  - route: [ { destination: { host: payment } } ]\nEOF"
            },
            {
              "desc": "压 100 次 vip 请求，观测 web 依然稳定（应走降级页面/缓存）",
              "cmd": "TOKEN=$(curl -s https://raw.githubusercontent.com/istio/istio/release-1.24/security/tools/jwt/samples/demo.jwt)\nfor i in $(seq 100); do\n  curl -s -o /dev/null -w '%{http_code}\\n' -H \"Host: shop.local\" -H \"x-user-tier: vip\" -H \"Authorization: Bearer $TOKEN\" http://localhost:8080/\ndone | sort | uniq -c"
            },
            {
              "desc": "Kiali 拓扑观察 payment 出现红色错误率；Jaeger 找一条含 500 的 trace；Grafana 面板 P99 曲线抬升",
              "cmd": "istioctl dashboard kiali"
            },
            {
              "desc": "收尾：删掉 chaos VS 恢复",
              "cmd": "kubectl -n shop delete vs payment-chaos --ignore-not-found"
            }
          ]
        }
      ],
      "verify": [
        "无 JWT 请求 shop.local 返回 401/403；带 demo token 返回 200",
        "vip header 100% 到 order v2，普通用户约 95/5 分布",
        "开启 chaos 后 payment 错误率上升，Kiali 边变红，Jaeger 能拉出 500 trace",
        "关掉 chaos 后错误率回到 0，SLO 恢复"
      ],
      "tasks": [
        "完成 mesh-shop 全部部署与验收",
        "写 docs/architecture.md 与拓扑图",
        "写 runbook.md 覆盖 3 个场景：payment 抖动、单 pod OOM、错误 VS 引发 503",
        "录 5 分钟自述（架构 → 灰度 → 排障 → 升级）"
      ],
      "gotchas": [
        "STRICT + 默认 deny 是双重收紧，任何一处漏放行都 500；建议先跑通 PERMISSIVE + AP allow-all，再逐步收紧。",
        "helloworld:v2 镜像默认 5000 端口；order Service targetPort 与 Deployment containerPort 要对齐。",
        "payment 的 POST 请求不要开重试，容易产生重复扣款——按 method 分 VS route 分开配置。",
        "chaos 后如果 Kiali 未刷新，等 10-20s xDS 收敛。"
      ],
      "refs": [
        [
          "Istio Best Practices",
          "https://istio.io/latest/docs/ops/best-practices/"
        ],
        [
          "Deployment Models",
          "https://istio.io/latest/docs/ops/deployment/deployment-models/"
        ]
      ]
    },
    {
      "day": 15,
      "week": 3,
      "phase": "生产化",
      "title": "生产落地专题 · Helm/GitOps · CA · 多租户 · 压测 · CI",
      "duration": "一天",
      "goal": "补齐从「会用」到「敢上生产」的最后一公里：部署自动化、证书管理、租户隔离、性能基线、发布流水线。",
      "theory": [
        {
          "title": "CA / 根证书策略",
          "body": "**方案 A：istiod 自签 CA**（默认）—— 上手最快，24h 轮转 workload 证，但根证 10 年自签且集群内孤岛；不适合多集群或合规要求高的场景。**方案 B：外部 root CA + 中间 CA 注入 istiod**（`cacerts` Secret）—— 官方推荐，多集群共享同一 root 才能互通 mTLS。**方案 C：cert-manager + istio-csr**：由 cert-manager 签发 workload 证书，与你现网 PKI（Vault/AWS PCA/私有 CA）无缝集成，审计合规链完整。生产强烈推荐 B 或 C。",
          "refs": [
            [
              "Plug in CA Certificates",
              "https://istio.io/latest/docs/tasks/security/cert-management/plugin-ca-cert/"
            ],
            [
              "cert-manager istio-csr",
              "https://cert-manager.io/docs/usage/istio-csr/"
            ]
          ]
        },
        {
          "title": "多租户隔离模式",
          "body": "**共享控制面 + ns 隔离**（常用）：一个 istiod 服务多个业务 ns，靠 AuthorizationPolicy + Sidecar CRD 强制业务 ns 只看到自己依赖。**软多租户**：给不同租户不同 revision，各 revision 使用不同 rootNamespace / trustDomain。**硬多租户**：一租户一集群或一 istiod（external control plane）。90% 场景用共享控制面即可，前提是网络策略（NetworkPolicy）+ Sidecar CRD 双重强制。",
          "refs": [
            [
              "Multi-Tenancy",
              "https://istio.io/latest/docs/ops/deployment/deployment-models/#tenancy-models"
            ]
          ]
        },
        {
          "title": "性能基线与容量规划",
          "body": "生产上线前必做基线压测。**测什么**：① 空跑 sidecar 的资源开销（10K QPS 时 cpu/mem）；② 加上 mTLS + AuthorizationPolicy + Telemetry 后的开销增量；③ istiod 在 N 个 Pod / M 个 Service 规模下的 CPU/内存 + xDS 推送延迟（`pilot_proxy_convergence_time`）。**指标基准**：sidecar 100 QPS ≈ 5-10m CPU、40-80Mi 内存；istiod 每 1000 workload ≈ 1 vCPU + 2Gi 内存。**工具**：fortio、ghz（gRPC）、k6、Istio 官方 [perf/benchmark](https://github.com/istio/tools/tree/master/perf/benchmark)。",
          "refs": [
            [
              "Performance & Scalability",
              "https://istio.io/latest/docs/ops/deployment/performance-and-scalability/"
            ]
          ]
        },
        {
          "title": "CI/CD 集成清单",
          "body": "**PR 门禁**：① `istioctl analyze` 全 mesh 静态检查；② `kubeconform` 校验 CRD schema；③ `conftest` + OPA 规则强制策略（如禁止 mTLS DISABLE、禁止 AuthorizationPolicy 空 spec 在生产 ns、Gateway TLS 必须 minVersion=TLSV1_2）；④ 变更 diff 自动评论。**发布**：GitOps（Argo/Flux）+ Argo Rollouts 或 Flagger 做自动化金丝雀（读 Prometheus 指标，达标才继续放量）。",
          "refs": [
            [
              "Flagger Istio",
              "https://docs.flagger.app/tutorials/istio-progressive-delivery"
            ]
          ]
        },
        {
          "title": "网络与探针的生产坑",
          "body": "①  **kube-proxy replacement**：与 Cilium eBPF 共存时，istio-init 的 iptables 与 Cilium 有冲突，建议 istio-cni 替代 init container。② **kubelet TCP 探针 in STRICT**：TCP socket 探针会绕过 mTLS 表现为「探针从非网格身份进来」→ STRICT 时探针失败。改用 HTTP GET 探针 + `holdApplicationUntilProxyStarts`。③ **UID 1337 冲突**：业务容器如果也用 UID 1337 会与 Envoy 冲突，导致回环；改镜像或 podSecurityContext.runAsUser。④ **大 header/大 body**：Envoy 默认 header 60KB、single_connect_timeout 10s；金融接口注意调 `defaults.maxRequestHeadersKb`。",
          "refs": [
            [
              "Application Requirements",
              "https://istio.io/latest/docs/ops/deployment/application-requirements/"
            ]
          ]
        }
      ],
      "diagrams": [
        {
          "title": "生产落地技术全栈",
          "mermaid": "flowchart TB\n  subgraph SRC[代码/配置源]\n    Git[Git 仓库<br/>infra + apps]\n  end\n  subgraph CI[PR 门禁]\n    A1[istioctl analyze]\n    A2[kubeconform]\n    A3[OPA/conftest 策略]\n  end\n  subgraph CD[GitOps]\n    ArgoCD[[ArgoCD/Flux]]\n    Flagger[[Flagger/Argo Rollouts<br/>自动金丝雀]]\n  end\n  subgraph K8S[Kubernetes]\n    IST[istiod x3<br/>+ istio-csr]\n    GW[Ingress GW x3<br/>+ NLB]\n    APP[业务 Pod + sidecar]\n  end\n  subgraph OBS[观测]\n    P[(Prometheus)]\n    G[[Grafana + SLO]]\n    J[(Jaeger/Tempo)]\n    L[(Loki)]\n    K[[Kiali]]\n    AL[Alertmanager]\n  end\n  subgraph CA[PKI]\n    Vault[(Vault / AWS PCA)]\n  end\n  Git --> CI --> CD\n  CD --> IST\n  CD --> GW\n  Flagger -->|读指标| P\n  Flagger -->|改 VS weight| APP\n  Vault --> IST\n  APP --> P\n  APP --> J\n  APP --> L\n  P --> G\n  P --> AL --> Oncall((On-call))\n  P --> K"
        },
        {
          "title": "自动金丝雀（Flagger）流程",
          "mermaid": "sequenceDiagram\n  participant D as Deploy v2\n  participant F as Flagger\n  participant P as Prometheus\n  participant VS as VirtualService\n  D->>F: 检测到 v2 上线\n  F->>VS: 初始 v2 weight=10%\n  loop 每 30s x N 步\n    F->>P: 查 v2 错误率 & P99 延迟\n    P-->>F: 指标 OK\n    F->>VS: weight += 10%\n  end\n  alt 指标劣化\n    F->>VS: weight=0, 回滚\n    F->>D: 报告失败\n  else 到 100%\n    F->>VS: promote v2\n    F->>D: 发布成功\n  end"
        }
      ],
      "labs": [
        {
          "title": "Lab 15.1 · 用外部 root CA（生产合规必做）",
          "steps": [
            {
              "desc": "生成/取到 root CA 和中间 CA（这里用 openssl 演示，生产从 Vault/PCA 拿）",
              "cmd": "# 官方脚本一键生成层级 CA\ngit clone https://github.com/istio/istio.git\ncd istio/samples/certs\nmake -f Makefile.selfsigned.mk root-ca cluster1-cacerts"
            },
            {
              "desc": "在 istio 安装前把 cacerts Secret 塞进 istio-system",
              "cmd": "kubectl create ns istio-system --dry-run=client -o yaml | kubectl apply -f -\nkubectl -n istio-system create secret generic cacerts \\\n  --from-file=cluster1/ca-cert.pem \\\n  --from-file=cluster1/ca-key.pem \\\n  --from-file=cluster1/root-cert.pem \\\n  --from-file=cluster1/cert-chain.pem"
            },
            {
              "desc": "再执行 Helm 或 istioctl 安装 istiod。istiod 检测到 cacerts 会用它签 workload 证。",
              "cmd": "helm upgrade --install istiod istio/istiod -n istio-system -f istiod-values.yaml"
            },
            {
              "desc": "验证证书链已用外部 root",
              "cmd": "POD=$(kubectl get pod -l app=productpage -o jsonpath='{.items[0].metadata.name}')\nistioctl proxy-config secret $POD -o json \\\n  | jq -r '.dynamicActiveSecrets[0].secret.tlsCertificate.certificateChain.inlineBytes' \\\n  | base64 -d | openssl x509 -text -noout | grep -E 'Issuer|Subject'"
            }
          ]
        },
        {
          "title": "Lab 15.2 · 用 istio-csr + cert-manager 接 Vault",
          "steps": [
            {
              "desc": "装 cert-manager",
              "cmd": "helm repo add jetstack https://charts.jetstack.io\nhelm install cert-manager jetstack/cert-manager -n cert-manager --create-namespace \\\n  --version v1.15.0 --set installCRDs=true"
            },
            {
              "desc": "建一个 ClusterIssuer 指向 Vault（示例）",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: cert-manager.io/v1\nkind: Issuer\nmetadata: { name: istio-ca, namespace: cert-manager }\nspec:\n  vault:\n    path: pki_int/sign/istio-ca\n    server: https://vault.corp:8200\n    auth:\n      kubernetes:\n        role: istio-csr\n        mountPath: /v1/auth/kubernetes\n        serviceAccountRef: { name: istio-csr }\nEOF"
            },
            {
              "desc": "装 istio-csr（它会在 istiod 前面拦截 CSR 转发给 cert-manager）",
              "cmd": "helm repo add jetstack https://charts.jetstack.io\nhelm upgrade -i istio-csr jetstack/cert-manager-istio-csr -n cert-manager \\\n  --set app.certmanager.issuer.name=istio-ca \\\n  --set app.certmanager.issuer.kind=Issuer \\\n  --set app.certmanager.issuer.group=cert-manager.io"
            },
            {
              "desc": "istiod values 里指向 istio-csr",
              "cmd": "# istiod-values.yaml 追加\nglobal:\n  caAddress: cert-manager-istio-csr.cert-manager.svc:443\npilot:\n  env:\n    ENABLE_CA_SERVER: \"false\"      # 关闭 istiod 内置 CA"
            }
          ]
        },
        {
          "title": "Lab 15.3 · 用 Flagger 做自动化金丝雀",
          "steps": [
            {
              "desc": "装 Flagger",
              "cmd": "helm repo add flagger https://flagger.app\nhelm upgrade -i flagger flagger/flagger -n istio-system \\\n  --set meshProvider=istio \\\n  --set metricsServer=http://prometheus.istio-system:9090"
            },
            {
              "desc": "声明 Canary CRD（Flagger 自动改 VS weight）",
              "cmd": "cat <<'EOF' | kubectl apply -f -\napiVersion: flagger.app/v1beta1\nkind: Canary\nmetadata: { name: order, namespace: shop }\nspec:\n  targetRef: { apiVersion: apps/v1, kind: Deployment, name: order }\n  service:\n    port: 80\n    hosts: [ shop.local ]\n    gateways: [ shop/shop-gw ]\n  analysis:\n    interval: 30s\n    threshold: 5             # 5 次指标劣化即回滚\n    maxWeight: 50\n    stepWeight: 10\n    metrics:\n    - name: request-success-rate\n      thresholdRange: { min: 99 }\n      interval: 1m\n    - name: request-duration\n      thresholdRange: { max: 500 }\n      interval: 30s\n    webhooks:\n    - name: load-test\n      url: http://fortio.istio-system/fortio/\n      timeout: 5s\n      metadata: { cmd: \"load -c 10 -qps 100 -t 30s http://order.shop/\" }\nEOF"
            },
            {
              "desc": "更新 order 镜像 tag，观察 Flagger 自动放量",
              "cmd": "kubectl -n shop set image deploy/order hello=docker.io/istio/examples-helloworld-v2:1.0\nkubectl -n shop describe canary order | tail -30"
            }
          ]
        },
        {
          "title": "Lab 15.4 · PR 门禁：OPA 策略即代码",
          "steps": [
            {
              "desc": "在仓库里放策略文件 policy/istio.rego",
              "cmd": "# policy/istio.rego\npackage istio\n\ndeny[msg] {\n  input.kind == \"PeerAuthentication\"\n  input.spec.mtls.mode == \"DISABLE\"\n  msg := sprintf(\"禁止 PeerAuthentication DISABLE：%s/%s\", [input.metadata.namespace, input.metadata.name])\n}\n\ndeny[msg] {\n  input.kind == \"AuthorizationPolicy\"\n  count(object.get(input.spec, \"rules\", [])) == 0\n  not endswith(input.metadata.namespace, \"-test\")\n  msg := sprintf(\"生产 ns 禁止空 AuthorizationPolicy：%s/%s（会拒绝一切）\", [input.metadata.namespace, input.metadata.name])\n}\n\ndeny[msg] {\n  input.kind == \"Gateway\"\n  server := input.spec.servers[_]\n  server.tls\n  server.tls.mode == \"SIMPLE\"\n  server.tls.minProtocolVersion != \"TLSV1_2\"\n  server.tls.minProtocolVersion != \"TLSV1_3\"\n  msg := \"Gateway TLS 最低版本必须 >= TLSV1_2\"\n}"
            },
            {
              "desc": "PR CI 里跑（.github/workflows/istio-check.yml 关键片段）",
              "cmd": "- name: istioctl analyze\n  run: |\n    kubectl apply --dry-run=server -R -f manifests/ | istioctl analyze -R -f manifests/\n- name: kubeconform\n  run: |\n    kubeconform -strict -schema-location default \\\n      -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \\\n      manifests/\n- name: OPA conftest\n  uses: instrumenta/conftest-action@master\n  with:\n    files: manifests/\n    policy: policy/"
            }
          ]
        },
        {
          "title": "Lab 15.5 · 生产性能基线压测",
          "steps": [
            {
              "desc": "起 2 个测试 Deployment：一个不注入 sidecar，一个注入。fortio 打相同流量做对比",
              "cmd": "kubectl create ns baseline\nkubectl create ns meshed\nkubectl label ns meshed istio-injection=enabled\nkubectl -n baseline apply -f samples/httpbin/httpbin.yaml\nkubectl -n meshed apply -f samples/httpbin/httpbin.yaml\nkubectl -n baseline apply -f samples/httpbin/sample-client/fortio-deploy.yaml"
            },
            {
              "desc": "分别压 60s、10 并发",
              "cmd": "F=$(kubectl -n baseline get pod -l app=fortio -o jsonpath='{.items[0].metadata.name}')\nkubectl -n baseline exec $F -c fortio -- fortio load -c 10 -qps 0 -t 60s http://httpbin.baseline:8000/get > baseline.txt\nkubectl -n baseline exec $F -c fortio -- fortio load -c 10 -qps 0 -t 60s http://httpbin.meshed:8000/get > meshed.txt\ngrep -E 'Aggregated|percentile' baseline.txt meshed.txt"
            },
            {
              "desc": "记录基线：sidecar 增加的 P50/P99 延迟、CPU/内存开销",
              "cmd": "kubectl top pod -n meshed -l app=httpbin --containers"
            }
          ]
        }
      ],
      "verify": [
        "istioctl proxy-config secret 里 Issuer 是你的外部 CA 而不是 istiod 自签",
        "Flagger Canary describe 输出 status: Succeeded 或 Progressing",
        "OPA 策略能挡下含 DISABLE 的 PeerAuthentication PR",
        "sidecar 引入的 P99 增量能被测出（通常 <2ms 同节点）"
      ],
      "tasks": [
        "跑通 Helm 三段安装（base/istiod/gateway），values 里包含 HA + 资源 + antiAffinity + PDB",
        "接一套外部 root CA（本地 openssl 演示即可）并验证证书链",
        "落一份 PrometheusRule 告警 + 一个 SLO 面板",
        "用 Flagger 或 Argo Rollouts 跑一次自动金丝雀",
        "PR CI 里跑通 istioctl analyze + OPA 策略",
        "做一次 baseline vs meshed 压测，输出 P50/P99 差值"
      ],
      "gotchas": [
        "外部 CA 一旦启用，之前 istiod 自签的所有 workload 证书需要重新签发：给所有 ns rollout restart 一遍。",
        "Flagger 的 metrics thresholdRange 必须写得比 SLO 严一点（例如 SLO=99% 时门禁写 99.5%），避免把预算刚好烧完。",
        "OPA 策略要给非生产 ns 留豁免（如 `-test` 后缀），否则本地 dev 环境天天被挡。",
        "压测时 fortio 与 httpbin 同 node 才有意义，跨 node 会引入网络抖动淹没 sidecar 开销；用 podAntiAffinity 强制隔离对照实验。"
      ],
      "refs": [
        [
          "Production Best Practices",
          "https://istio.io/latest/docs/ops/best-practices/"
        ],
        [
          "Security Best Practices",
          "https://istio.io/latest/docs/ops/best-practices/security/"
        ],
        [
          "Deployment Best Practices",
          "https://istio.io/latest/docs/ops/best-practices/deployment/"
        ],
        [
          "Traffic Management Best Practices",
          "https://istio.io/latest/docs/ops/best-practices/traffic-management/"
        ]
      ]
    }
  ],
  "cheatsheet": [
    [
      "架构 & 端口",
      [
        [
          "istiod",
          "控制面：xDS 下发 + CA 签发 + Sidecar 注入 webhook"
        ],
        [
          "Sidecar 数据面",
          "每 Pod 一个 Envoy，接管 15006(入)/15001(出) + 15020(健康+metrics)/15090(prom)"
        ],
        [
          "Ambient 数据面",
          "节点级 ztunnel(L4,HBONE) + 按需 waypoint(L7)"
        ],
        [
          "身份",
          "SPIFFE URI: spiffe://cluster.local/ns/&lt;ns&gt;/sa/&lt;sa&gt; · 24h 轮转"
        ]
      ]
    ],
    [
      "Traffic CRD 速记",
      [
        [
          "Gateway",
          "边缘监听器：host/port/protocol/tls，绑 istio-ingressgateway pod"
        ],
        [
          "VirtualService",
          "路由 match→route(dest+subset+weight) + timeout/retries/fault/mirror/rewrite"
        ],
        [
          "DestinationRule",
          "subsets + trafficPolicy(loadBalancer/connectionPool/outlierDetection/tls)"
        ],
        [
          "ServiceEntry",
          "把外部服务注册进网格 registry"
        ],
        [
          "Sidecar (CRD)",
          "收敛 Envoy 内存：egress.hosts 只看指定 ns/host"
        ],
        [
          "WorkloadEntry",
          "把 VM/Bare-metal 纳入网格"
        ]
      ]
    ],
    [
      "Security CRD 速记",
      [
        [
          "PeerAuthentication",
          "服务端 mTLS 模式：STRICT/PERMISSIVE/DISABLE"
        ],
        [
          "RequestAuthentication",
          "声明 JWT issuer + JWKS，只校验不授权"
        ],
        [
          "AuthorizationPolicy",
          "ALLOW/DENY/AUDIT，selector + from(source) + to(operation) + when"
        ],
        [
          "principals 格式",
          "cluster.local/ns/&lt;ns&gt;/sa/&lt;sa&gt;（无 spiffe:// 前缀）"
        ]
      ]
    ],
    [
      "排障命令",
      [
        [
          "istioctl analyze -A",
          "全集群配置静态检查"
        ],
        [
          "istioctl proxy-status",
          "xDS 各资源是否 SYNCED / STALE"
        ],
        [
          "istioctl proxy-config &lt;listeners|routes|clusters|endpoints|secret&gt; &lt;pod&gt;",
          "查 Envoy 实际配置"
        ],
        [
          "istioctl x describe pod &lt;pod&gt;",
          "一次看 mTLS/VS/DR/AP 命中"
        ],
        [
          "istioctl authn tls-check &lt;pod&gt; &lt;svc&gt;",
          "看 client/server mTLS 是否兼容"
        ],
        [
          "pilot-agent request GET config_dump",
          "Envoy 完整配置 JSON"
        ],
        [
          "pilot-agent request GET stats",
          "Envoy 计数器（重试/熔断/pending 等）"
        ]
      ]
    ],
    [
      "Envoy RESPONSE_FLAGS",
      [
        [
          "UH",
          "no healthy upstream（endpoints 全挂）"
        ],
        [
          "UF",
          "upstream connection failure（连不上下游）"
        ],
        [
          "UT",
          "upstream request timeout"
        ],
        [
          "URX",
          "retry limit exceeded"
        ],
        [
          "NR",
          "no route configured（VS 里没匹配）"
        ],
        [
          "RBAC",
          "AuthorizationPolicy 拒绝"
        ],
        [
          "DPE",
          "downstream protocol error（客户端协议错）"
        ]
      ]
    ],
    [
      "生产必配",
      [
        [
          "Revision 升级",
          "istioctl install --set revision=… + istio.io/rev 标签 + rollout restart"
        ],
        [
          "Sidecar 收敛",
          "每 ns 一条 Sidecar CRD 显式列出依赖，防内存爆"
        ],
        [
          "Telemetry",
          "accessLog + 采样率 1-10%，高价值链路定向调 100%"
        ],
        [
          "熔断三件套",
          "outlierDetection + connectionPool + retryBudget（1.24+）"
        ],
        [
          "mTLS",
          "先 PERMISSIVE 灰度，再 STRICT，逐 ns 迁移"
        ]
      ]
    ],
    [
      "常见坑",
      [
        [
          "同 host 多 VS",
          "会 merge，顺序未定 → 只保留一个"
        ],
        [
          "空 spec AP",
          "= deny all，先加放行再收紧"
        ],
        [
          "POST 重试",
          "非幂等，容易重复扣款 → 按 method 拆 VS"
        ],
        [
          "kube 探针 STRICT",
          "HTTP 探针不走 sidecar 通常没问题；TCP 探针在 STRICT 下需 PERMISSIVE 端口豁免"
        ],
        [
          "ambient hostNetwork",
          "hostNetwork Pod 不受 ambient 管辖，需 sidecar 或不加入网格"
        ]
      ]
    ]
  ],
  "quiz": [
    {
      "q": "iptables 把入站流量重定向到 Envoy 哪个端口？",
      "opts": [
        "15001",
        "15006",
        "15020",
        "15090"
      ],
      "answer": 1,
      "why": "15006 是入站 listener；15001 是出站；15020/15090 是健康与 metrics。"
    },
    {
      "q": "SPIFFE URI 格式正确的是？",
      "opts": [
        "cluster.local/ns/default/sa/frontend",
        "spiffe://cluster.local/ns/default/sa/frontend",
        "spiffe:///default/frontend",
        "spiffe://frontend@cluster.local"
      ],
      "answer": 1,
      "why": "证书 SAN 里带完整 spiffe:// scheme；AuthorizationPolicy.principals 里则不带前缀。"
    },
    {
      "q": "VirtualService 里 route 的 weight 之和必须是？",
      "opts": [
        "不限，Envoy 会自动归一化",
        "100 且整数",
        "1.0",
        "任意浮点数"
      ],
      "answer": 1,
      "why": "官方要求整数之和为 100，否则 istioctl analyze 报错。"
    },
    {
      "q": "outlierDetection 写在哪种 CRD？",
      "opts": [
        "VirtualService",
        "DestinationRule",
        "AuthorizationPolicy",
        "Sidecar"
      ],
      "answer": 1,
      "why": "熔断/异常摘除属于 DestinationRule.trafficPolicy。"
    },
    {
      "q": "PeerAuthentication mode=STRICT 时，网格外无 sidecar 的 Pod 访问会？",
      "opts": [
        "正常返回",
        "连接被 Envoy 拒绝",
        "返回 401",
        "只允许 GET"
      ],
      "answer": 1,
      "why": "STRICT 只接 mTLS，明文连接被 Envoy 直接 reset。"
    },
    {
      "q": "以下哪种 AuthorizationPolicy 相当于 deny all？",
      "opts": [
        "action=DENY，rules 为空",
        "action=ALLOW，rules 为空",
        "整个 spec 为空 {}",
        "不写 selector"
      ],
      "answer": 2,
      "why": "spec:{} 没有任何 ALLOW 规则匹配，触发 deny-by-default。"
    },
    {
      "q": "Ambient 模式下承担 L4 mTLS + 身份的组件是？",
      "opts": [
        "每个 Pod 的 sidecar",
        "节点级 ztunnel DaemonSet",
        "waypoint proxy",
        "istio-cni"
      ],
      "answer": 1,
      "why": "ztunnel 用 HBONE 隧道承担 L4 + SPIFFE 身份，只有 L7 才走 waypoint。"
    },
    {
      "q": "生产升级 Istio 推荐做法是？",
      "opts": [
        "in-place istioctl upgrade",
        "revision 金丝雀 + ns 标签切换 + rollout restart",
        "关掉业务重装",
        "只升级 istioctl 二进制"
      ],
      "answer": 1,
      "why": "revision 并存 + ns 灰度是官方推荐无损升级路径。"
    },
    {
      "q": "istioctl proxy-config routes &lt;pod&gt; 主要用来？",
      "opts": [
        "查 Envoy 实际收到的 RDS 路由配置",
        "看 iptables 规则",
        "看 mTLS 证书",
        "拉 Prometheus 指标"
      ],
      "answer": 0,
      "why": "proxy-config 系列命令即导出该 Pod 上 Envoy 的 xDS 快照。"
    },
    {
      "q": "Envoy 响应日志里 RESPONSE_FLAGS=UT 通常表示？",
      "opts": [
        "下游客户端协议错",
        "上游超时",
        "RBAC 拒绝",
        "重试超限"
      ],
      "answer": 1,
      "why": "UT=upstream timeout；URX=retry exceeded；DPE=downstream protocol error；RBAC 就是权限拒绝。"
    },
    {
      "q": "关于流量镜像 mirror 说法正确的是？",
      "opts": [
        "会等待镜像目标响应后再返回给客户端",
        "异步复制请求到镜像目标，忽略其响应",
        "只镜像响应不镜像请求",
        "会自动改写 Authorization 头"
      ],
      "answer": 1,
      "why": "mirror 是 fire-and-forget shadow 流量，用于线上回放；不阻塞正常路径。"
    },
    {
      "q": "REGISTRY_ONLY 出站策略下访问未声明的外部 host 会？",
      "opts": [
        "直连成功",
        "被 Envoy 502",
        "走 egress gateway",
        "回退到明文"
      ],
      "answer": 1,
      "why": "没有 ServiceEntry 注册的目标一律被 sidecar 拦下（BlackHoleCluster）。"
    }
  ],
  "checklist": [
    [
      "安装与拓扑",
      [
        "禁用 profile=demo；生产用 default 或 empty + values",
        "istiod 副本 >= 3，pod antiAffinity 分散节点",
        "istio-ingressgateway 副本 >= 3，PDB minAvailable >= 2",
        "所有 istio 组件设置 resources.requests / limits",
        "holdApplicationUntilProxyStarts=true 全局开启",
        "启用 istio-cni 替代 init container（PSS restricted 环境必装）",
        "kube-proxy / Cilium 冲突已排查（istio-cni 与 Cilium ChainingMode）"
      ]
    ],
    [
      "证书与身份",
      [
        "使用外部 root CA（cacerts）或 istio-csr + 企业 PKI",
        "workload 证书 24h 轮转告警（<7 天 warning）",
        "root CA 有独立备份与轮换计划（>=1 次/年演练）",
        "trustDomain 明确规划，多集群共享同一 root",
        "生产 ns 全部 PeerAuthentication STRICT",
        "任何 DISABLE / SIMPLE 例外都有工单可查"
      ]
    ],
    [
      "流量策略",
      [
        "生产 ns 无空 spec AuthorizationPolicy（OPA 挡）",
        "同一 host 有且只有一个 VirtualService（owner label）",
        "非幂等 POST 接口未开重试",
        "所有出口调用有超时（timeout）设置",
        "关键下游有 outlierDetection + connectionPool 上限",
        "REGISTRY_ONLY + ServiceEntry 白名单管理 egress"
      ]
    ],
    [
      "Gateway 与 TLS",
      [
        "Gateway.tls.minProtocolVersion >= TLSV1_2",
        "证书通过 cert-manager 自动续期（Let's Encrypt 或企业 CA）",
        "LoadBalancer 类型选择合适（AWS: NLB > CLB；开启 externalTrafficPolicy=Local）",
        "SNI 与 host 匹配写清晰，无通配符冲突",
        "HTTP → HTTPS 强制重定向已配置"
      ]
    ],
    [
      "可观测性",
      [
        "Prometheus 已抓 istio-proxy 15090 与 istiod 15014",
        "关键指标做 Recording Rules 预聚合",
        "四大告警上线：错误率 / P99 延迟 / 证书快过期 / xDS 推送失败",
        "SLO 面板与错误预算燃尽率告警",
        "trace 采样率生产 1-10%，问题服务定向调 100%",
        "accessLog 通过 Loki/ELK 集中收集，保留 >=7 天"
      ]
    ],
    [
      "升级与发布",
      [
        "所有 Istio 部署走 GitOps（ArgoCD / Flux），无手工 kubectl edit",
        "升级只用 revision + istio.io/rev 标签，禁用 in-place",
        "revision 灰度按 ns 批次，每批观察 >=1h",
        "Envoy CVE 应急 SOP 已写入 Runbook（数据面 24h 内可完成升级）",
        "回滚流程演练过（打回标签 + rollout restart）",
        "Flagger / Argo Rollouts 用于业务金丝雀，指标不达标自动回滚"
      ]
    ],
    [
      "安全合规",
      [
        "PR 门禁：istioctl analyze + kubeconform + OPA 策略",
        "AuthorizationPolicy 使用 principals 而非 namespaces（更严）",
        "边缘 Gateway 校验 JWT，业务侧只做 principals 授权",
        "审计日志（K8s audit + Istio access log）保留符合合规要求",
        "定期扫描 istio 组件 CVE（Trivy / Grype）",
        "供应链：image 通过 cosign 签名验证"
      ]
    ],
    [
      "容量与性能",
      [
        "有 baseline vs meshed 压测基线数据（P50/P99 差值）",
        "istiod: 每 1000 workload ~ 1vCPU + 2Gi（HPA 覆盖）",
        "sidecar: p95 QPS 场景 requests 100m/128Mi、limits 2/1Gi",
        "Sidecar CRD 强制收敛 egress hosts（>500 Service 集群必配）",
        "Envoy 内存告警 >400Mi 触发排查"
      ]
    ],
    [
      "Runbook 覆盖场景",
      [
        "istiod 全挂：了解数据面缓存机制，冷静恢复",
        "workload 证书快过期：手动 rollout 触发轮转",
        "xDS 推送失败/STALE：pilot 日志 + Envoy config_dump 对比",
        "5xx 突增：五步排障法（analyze → proxy-status → proxy-config → logs → stats）",
        "网关证书快过期：cert-manager Certificate resource 排查",
        "Envoy OOM：Sidecar CRD 收敛 + limits 上调"
      ]
    ]
  ],
  "incidents": [
    {
      "title": "启用 STRICT mTLS 后 API Gateway 探针 100% 失败",
      "impact": "灰度期间 kubelet 判定 Pod NotReady → 循环重启 → 前端 502 持续 15min",
      "trigger": "把网关 PeerAuthentication 改为 STRICT，但 readiness 探针配置的是 TCP socket",
      "root_cause": "TCP 探针从 kubelet 节点直接建 TCP，非网格身份 → Envoy STRICT 拒绝。HTTP 探针一般走 15021 端口，Envoy 内部放行，不会遇到此问题。",
      "fix": "① 立即回滚到 PERMISSIVE 恢复；② 改探针为 HTTP GET；③ 或给探针端口配置 exclude（annotations: sidecar.istio.io/excludeInboundPorts）",
      "prevent": "STRICT 变更前先跑 istioctl authn tls-check + 一次 chaos: 主动杀节点复现探针场景"
    },
    {
      "title": "reviews 服务错误率 5%，Kiali 边红但业务查不到问题",
      "impact": "SLO 消耗率飙升，on-call 排查 40min",
      "trigger": "同一 host 同时有两条 VirtualService（不同团队各写一份）",
      "root_cause": "Istio 将两条 VS merge，顺序未定义。有时命中带 fault 注入的那一条（是同事测混沌忘删）。",
      "fix": "kubectl delete vs reviews-chaos；给所有 VS 加 owner label，写 OPA 策略强制唯一",
      "prevent": "同 host 唯一 VS 的 OPA 策略；Kiali 中 Duplicated Route 校验开告警"
    },
    {
      "title": "升级 1.22 → 1.24 后新 Pod 拿不到配置",
      "impact": "新扩容的 Pod xDS STALE，流量打到旧实例，扩容失效 20min",
      "trigger": "istioctl install --set revision=1-24 后忘了给 ns 打 istio.io/rev 标签",
      "root_cause": "ns 上还是老的 istio-injection=enabled 标签，注入的 sidecar 连 1.22 istiod；但新 istiod 的 webhook 版本已经变，pod 里的 istio-agent 客户端跟旧 istiod 协商失败。",
      "fix": "kubectl label ns prod istio.io/rev=1-24 istio-injection- --overwrite；rollout restart",
      "prevent": "写发布 checklist：revision 升级三步（install → label → rollout）少任何一步 CI 报错"
    },
    {
      "title": "Envoy 单实例内存暴涨到 800MB",
      "impact": "sidecar 触发 OOMKilled → 业务重启雪崩",
      "trigger": "集群 Service 数增长到 3000+，未配置 Sidecar CRD",
      "root_cause": "Envoy 默认拿到全集群 xDS 配置，Service/EDS 数增长导致内存线性增长",
      "fix": "紧急调 limits 到 2Gi 稳住；随后为所有业务 ns 增加 Sidecar CRD 明确 egress.hosts",
      "prevent": "集群 Service > 500 时强制 Sidecar CRD；监控 envoy_server_memory_allocated"
    },
    {
      "title": "STRICT mTLS 迁移后老客户端（未注入）全部 503",
      "impact": "订单服务掉线 8 分钟",
      "trigger": "一次性把生产 ns 从 PERMISSIVE 切到 STRICT，未先梳理外部调用方",
      "root_cause": "还有一个 CronJob 没打 istio-injection 标签，明文调用 order → 被 STRICT 拒绝",
      "fix": "立即 rollout 那个 CronJob 到有 sidecar 的 ns；或给它加 PeerAuthentication 端口级 PERMISSIVE 豁免",
      "prevent": "STRICT 前：istioctl authn tls-check 全 mesh 扫一遍；用 istio_request_bytes_count{connection_security_policy=\"none\"} 观察 24h 无明文流量再切"
    },
    {
      "title": "Egress 换到 REGISTRY_ONLY 导致外部依赖大面积失败",
      "impact": "第三方 API 调用全 502，影响支付回调 12min",
      "trigger": "为合规改 meshConfig.outboundTrafficPolicy.mode=REGISTRY_ONLY",
      "root_cause": "只声明了 3 个 ServiceEntry，实际业务依赖 20+ 外部域名",
      "fix": "紧急改回 ALLOW_ANY；随后用 pilot_conflict_outbound_listeners 与 access log 提取所有真实出口域名，补全 ServiceEntry",
      "prevent": "REGISTRY_ONLY 前先跑 30 天访问日志分析，输出全部外部 host 白名单"
    }
  ]
};
