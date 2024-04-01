const merge = require("webpack-merge").merge;
const path = require("path");
const base = require("./base");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(base, {
	mode: "production",
	output: {
		filename: "bundle.min.js",
		path: path.resolve(__dirname, '../dist')
	},
	devtool: false,
	performance: {
		maxEntrypointSize: 900000,
		maxAssetSize: 900000
	},
	entry: './src/main.ts',

	/*optimization: {
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					output: {
						comments: false
					}
				}
			})
		]
	}*/
});
