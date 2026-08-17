const nextConfig = {
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/elegance.uxui" : "",
  trailingSlash: true,
};

export default nextConfig;
