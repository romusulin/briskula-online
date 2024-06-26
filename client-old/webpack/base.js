const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
	mode: "development",
	devtool: "eval-source-map",
	entry: './src/main.ts',
	module: {
		rules: [
			{
				test: /\.ts?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader"
				}
			},
			{
				test: [/\.vert$/, /\.frag$/],
				use: "raw-loader"
			},
			{
				test: /\.jpg$/i,
				use: "asset/resource"
			},
			{
				test: /\.css$/i,
				use: ["style-loader", "css-loader"]
			}
		]
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
	plugins: [
		new CleanWebpackPlugin({
			root: path.resolve(__dirname, "../src")
		}),
		new webpack.DefinePlugin({
			CANVAS_RENDERER: JSON.stringify(true),
			WEBGL_RENDERER: JSON.stringify(true)
		}),
		new HtmlWebpackPlugin({
			template: "/src/index.html"
		})
	]
};
