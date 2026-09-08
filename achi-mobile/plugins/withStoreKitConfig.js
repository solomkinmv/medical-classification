const { withDangerousMod, withXcodeProject } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Config plugin that adds a StoreKit configuration file to the Xcode project
 * and sets it in the scheme's LaunchAction for simulator IAP testing.
 *
 * Usage in app.json:
 *   ["./plugins/withStoreKitConfig", "Products.storekit"]
 */
function withStoreKitConfig(config, storekitFileName) {
  // Step 1: Add .storekit file to the Xcode project's file references
  config = withXcodeProject(config, (config) => {
    const projectName = config.modRequest.projectName;
    const project = config.modResults;

    const src = path.resolve(config.modRequest.projectRoot, storekitFileName);
    const dest = path.join(
      config.modRequest.platformProjectRoot,
      projectName,
      storekitFileName,
    );

    // Copy the file into the ios/<ProjectName>/ directory
    if (!fs.existsSync(src))
      throw new Error(`Missing StoreKit configuration: ${src}`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);

    // Add to Xcode project if not already there
    const filePath = path.join(projectName, storekitFileName);
    if (!project.hasFile(filePath)) {
      project.addFile(
        filePath,
        project.findPBXGroupKey({ name: projectName }) ??
          project.getFirstProject().firstProject.mainGroup,
      );
    }

    return config;
  });

  // Step 2: Modify the scheme to reference the StoreKit config
  config = withDangerousMod(config, [
    "ios",
    (config) => {
      const projectName = config.modRequest.projectName;
      const schemesDir = path.join(
        config.modRequest.platformProjectRoot,
        `${projectName}.xcodeproj`,
        "xcshareddata",
        "xcschemes",
      );
      const schemePath = path.join(schemesDir, `${projectName}.xcscheme`);

      if (!fs.existsSync(schemePath)) {
        throw new Error(
          `[withStoreKitConfig] Scheme not found at ${schemePath}`,
        );
      }

      let scheme = fs.readFileSync(schemePath, "utf8");

      // Xcode resolves this reference from the xcodeproj directory.
      const identifier = `../${projectName}/${storekitFileName}`;

      // Insert StoreKitConfigurationFileReference before </LaunchAction>
      const storeKitRef =
        `      <StoreKitConfigurationFileReference\n` +
        `         identifier = "${identifier}">\n` +
        `      </StoreKitConfigurationFileReference>\n`;

      scheme = scheme.replace(
        /\s*<StoreKitConfigurationFileReference\b[^>]*(?:\/>|>[\s\S]*?<\/StoreKitConfigurationFileReference>)/g,
        "",
      );
      if (!scheme.includes("</LaunchAction>"))
        throw new Error("Missing scheme LaunchAction");
      scheme = scheme.replace(
        /\s*<\/LaunchAction>/,
        `\n${storeKitRef}   </LaunchAction>`,
      );

      fs.writeFileSync(schemePath, scheme);
      console.log(
        `[withStoreKitConfig] Added StoreKit config "${identifier}" to scheme`,
      );

      return config;
    },
  ]);

  return config;
}

module.exports = withStoreKitConfig;
