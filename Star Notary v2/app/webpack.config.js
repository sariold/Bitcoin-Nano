const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = {
	mode: "none",
	resolve: {
		fallback: {
			stream: require.resolve("stream-browserify"),
			crypto: require.resolve("crypto-browserify"),
			assert: require.resolve("assert/"),
			crypto: require.resolve("crypto-browserify"),
			http: require.resolve("stream-http"),
			https: require.resolve("https-browserify"),
			url: require.resolve("url/"),
			os: require.resolve("os-browserify/browser"),
		},
	},
	entry: "./src/index.js",
	output: {
		filename: "index.js",
		path: path.resolve(__dirname, "dist"),
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [{ from: "./src/index.html", to: "index.html" }],
		}),
		new webpack.ProvidePlugin({
			Buffer: ["buffer", "Buffer"],
		}),
		new webpack.ProvidePlugin({
			process: "process/browser",
		}),
	],
	devServer: { static: path.resolve(__dirname, "dist"), compress: true },
};
