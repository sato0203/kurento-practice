module.exports = (modeName) => {
    const config = 
    {
        mode:modeName,
        entry: {
            kurento:"./src/kurento/index.tsx",
        },
        output: {
            filename: "[name]_bundle.js",
            path: __dirname + "/dist"
        },
    
        target:"electron-renderer",
    
        // Enable sourcemaps for debugging webpack's output.
        devtool: "source-map",
    
        resolve: {
            // Add '.ts' and '.tsx' as resolvable extensions.
            extensions: [".ts", ".tsx", ".js", ".json"]
        },
    
        module: {
            rules: [
                // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
                { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
    
                // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
                { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
            ]
        },
    }
    return config;
}