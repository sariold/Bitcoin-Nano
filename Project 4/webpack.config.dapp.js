const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	devtool: "eval-source-map",
	entry: ["babel-polyfill", path.resolve(__dirname, "src/dapp")],
	output: {
		path: path.resolve(__dirname, "prod/dapp"),
		filename: "bundle.js",
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				use: "babel-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				type: "asset/resource",
			},
			{
				test: /\.html$/,
				use: "html-loader",
				exclude: /node_modules/,
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "src/dapp/index.html"),
		}),
		new webpack.ProvidePlugin({
			Buffer: ["buffer", "Buffer"],
		}),
		new webpack.ProvidePlugin({
			process: "process/browser",
		}),
	],
	resolve: {
		extensions: [".js"],
		fallback: {
			stream: require.resolve("stream-browserify"),
			crypto: require.resolve("crypto-browserify"),
			assert: require.resolve("assert/"),
			http: require.resolve("stream-http"),
			https: require.resolve("https-browserify"),
			url: require.resolve("url/"),
			os: require.resolve("os-browserify/browser"),
			buffer: require.resolve("buffer"),
		},
	},
	devServer: {
		static: {
			directory: path.resolve(__dirname, "dapp"),
		},
		watchFiles: ["src/**/*"],
		// contentBase: path.join(__dirname, "dapp"),
		port: 8000,
		// stats: "minimal",
	},
};
