const fs = require("fs");
const os = require("os");
const path = require("path");
let mockXcode;
let mockScheme;
jest.mock("expo/config-plugins", () => ({
  withXcodeProject: (config, mod) => {
    mockXcode = mod;
    return config;
  },
  withDangerousMod: (config, [, mod]) => {
    mockScheme = mod;
    return config;
  },
}));
const plugin = require("../withStoreKitConfig");
let root;
let schemePath;
let config;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "medical-iap-plugin-"));
  schemePath = path.join(
    root,
    "ios/Test.xcodeproj/xcshareddata/xcschemes/Test.xcscheme",
  );
  fs.mkdirSync(path.dirname(schemePath), { recursive: true });
  fs.copyFileSync(
    path.join(__dirname, "../../Products.storekit"),
    path.join(root, "Products.storekit"),
  );
  const files = new Set();
  config = {
    modRequest: {
      projectRoot: root,
      platformProjectRoot: path.join(root, "ios"),
      projectName: "Test",
    },
    modResults: {
      hasFile: (p) => files.has(p),
      addFile: jest.fn((p) => files.add(p)),
      findPBXGroupKey: () => "group",
    },
  };
  plugin({}, "Products.storekit");
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
test("generated reference resolves to copied product and repeats without duplicates", () => {
  fs.writeFileSync(
    schemePath,
    "<Scheme><LaunchAction></LaunchAction></Scheme>",
  );
  mockXcode(config);
  mockScheme(config);
  mockXcode(config);
  mockScheme(config);
  const xml = fs.readFileSync(schemePath, "utf8");
  expect(xml.match(/<StoreKitConfigurationFileReference/g)).toHaveLength(1);
  const reference = xml.match(/identifier = "([^"]+)"/)[1];
  const target = path.resolve(
    path.dirname(path.dirname(path.dirname(schemePath))),
    reference,
  );
  const data = JSON.parse(fs.readFileSync(target));
  expect(data.products[0]).toMatchObject({
    productID: "com.solomkinmv.achi_mobile.pro",
    displayPrice: "2.99",
    type: "NonConsumable",
  });
  expect(data.version).toEqual({ major: 3, minor: 0 });
  expect(config.modResults.addFile).toHaveBeenCalledTimes(1);
});
test("repairs an old incorrect scheme reference", () => {
  fs.writeFileSync(
    schemePath,
    '<Scheme><LaunchAction><StoreKitConfigurationFileReference identifier="wrong" /></LaunchAction></Scheme>',
  );
  mockScheme(config);
  expect(fs.readFileSync(schemePath, "utf8")).toContain(
    "../Test/Products.storekit",
  );
  expect(fs.readFileSync(schemePath, "utf8")).not.toContain('"wrong"');
});
test("missing product source fails prebuild", () => {
  fs.unlinkSync(path.join(root, "Products.storekit"));
  expect(() => mockXcode(config)).toThrow("Missing StoreKit configuration");
});
