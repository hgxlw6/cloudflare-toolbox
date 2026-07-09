// math-idai: 纯静态站点，Worker 只负责代理 assets
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};