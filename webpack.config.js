const fs = require("fs");
const { resolve, basename } = require("path");

const autoprefixer = require("autoprefixer");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const DelWebpackPlugin = require("del-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ForkTsCheckerPlugin = require("fork-ts-checker-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const OfflinePlugin = require("offline-plugin");
const ZipPlugin = require("zip-webpack-plugin");

module.exports = function(env = {}, argv = {}) {
  const isProd = !env.dev;
  const serve = !!env.dev;
  const version = env.version || "custom";
  const target = env.target || "unknown";

  return {
    mode: isProd ? "production" : "development",
    devtool: isProd ? false : "cheap-module-eval-source-map",
    devServer: !serve
      ? undefined
      : {
          contentBase: "./dist"
          // host: "0.0.0.0" // uncomment to access via IP over local network
        },
    entry: "./src/app.tsx",
    output: {
      filename: "[name].[hash:5].js",
      chunkFilename: "[name].[chunkhash:5].js",
      path: resolve(__dirname, "./dist"),
    },
    optimization: {
      minimize: isProd,
    },
    performance: {
      hints: false,
    },
    stats: {
      colors: true,
      logging: "warn",
      children: false,
      assets: false,
      modules: false,
    },
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx", ".css", ".json"],
    },
    module: {
      rules: [
        {
          enforce: "pre",
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader?cacheDirectory",
            options: {
              presets: [
                require("@babel/preset-env"),
                require("@babel/preset-typescript"),
              ],
              plugins: [
                require("@babel/plugin-proposal-optional-chaining"),
                require("@babel/plugin-proposal-class-properties"),
                require("@babel/plugin-syntax-dynamic-import"),
                [
                  require("@babel/plugin-transform-react-jsx"),
                  {
                    pragma: "React.createElement",
                    pragmaFrag: "React.Fragment"
                  }
                ],
                require("@babel/plugin-transform-react-jsx-source"),
                [
                  require("@emotion/babel-plugin-jsx-pragmatic"),
                  {
                    module: "react",
                    import: "React"
                  }
                ]
              ]
            }
          }
        },
        {
          test: /\.module\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                modules: {
                  localIdentName: "[local]__[hash:base64:5]"
                }
              }
            },
            {
              loader: "postcss-loader",
              options: {
                ident: "postcss",
                plugins: [autoprefixer()],
              },
            },
          ],
        },
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"]
        },
        {
          test: /\.svg$/,
          loader: "svg-inline-loader",
        },
        {
          test: /\.(woff2?|ttf|eot|jpe?g|png|gif|mp4|mov|ogg|webm)(\?.*)?$/i,
          loader: "file-loader",
        },
      ],
    },
    plugins: [
      new DelWebpackPlugin({
        info: false,
        include: ["*.js"],
      }),
      !isProd && new ForkTsCheckerPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "jackets/**/*",
            context: "src/assets",
            globOptions: {
              ignore: ["**/.DS_Store"],
            },
          },
        ],
      }),
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(
          isProd ? "production" : "development"
        ),
        "process.env.DATA_FILES": JSON.stringify(
          fs.readdirSync(resolve(__dirname, "src/songs")).map((file) => ({
            name: basename(file, ".json"),
            display: JSON.parse(
              fs.readFileSync(resolve(__dirname, "src/songs", file))
            ).i18n.en.name,
          }))
        ),
      }),
      new MiniCssExtractPlugin({
        filename: "[name].[contenthash:5].css",
        chunkFilename: "[id].[chunkhash:5].js",
      }),
      new HtmlWebpackPlugin({
        title: "DDR Card Draw",
        filename: "index.html",
        meta: {
          viewport: "width=device-width, initial-scale=1"
        }
      }),
      isProd &&
        target === "zip" &&
        new ZipPlugin({
          path: __dirname,
          filename: `DDRCardDraw-${version}.zip`,
          exclude: "__offline_serviceworker"
        }),
      isProd &&
        new OfflinePlugin({
          ServiceWorker: {
            events: true
          },
          excludes: ["../*.zip", "jackets/**/*"]
        })
    ].filter(Boolean)
  };
};
