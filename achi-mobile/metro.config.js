const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const enableSimPreview = process.env.EXPO_ENABLE_SIM_PREVIEW === "true";

const enhancedConfig = withNativeWind(config, { input: "./global.css" });

if (enableSimPreview) {
  const connect = require("connect");
  const { simMiddleware } = require("serve-sim/middleware");

  enhancedConfig.server = enhancedConfig.server ?? {};

  const originalEnhanceMiddleware = enhancedConfig.server.enhanceMiddleware;

  enhancedConfig.server.enhanceMiddleware = (metroMiddleware, server) => {
    const middleware = originalEnhanceMiddleware
      ? originalEnhanceMiddleware(metroMiddleware, server)
      : metroMiddleware;
    const app = connect();

    app.use(simMiddleware({ basePath: "/.sim" }));
    app.use(middleware);

    return app;
  };
}

module.exports = enhancedConfig;
