module.exports = {
  presets: [
    [
      "@babel/env",
      {
        exclude: ["transform-regenerator"]
      }
    ],
    "@babel/flow"
  ],
  plugins: [
    "@babel/proposal-class-properties",
    "@babel/proposal-object-rest-spread",
    "transform-imports",
    "@babel/transform-modules-commonjs"
  ],
  env: {
    test: {
      presets: [["@babel/env"], "@babel/flow"]
    }
  }
};

