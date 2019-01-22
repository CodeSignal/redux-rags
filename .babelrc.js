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
    "transform-imports",
    "@babel/transform-modules-commonjs"
  ],
  env: {
    test: {
      presets: [["@babel/env"], "@babel/flow"]
    }
  }
};

